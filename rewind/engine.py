"""The projector: cutting frames, and playing the film backwards.

The model is deliberately small:

* A **frame** is a full manifest of the tree at a moment. Frames are cheap
  because file contents live in the shared blob store.
* The **playhead** is the frame you are currently living in.
* **Seeking** means: look at what is actually on disk right now, work out the
  difference against the frame you asked for, and apply it.

Every frame records the playhead it was cut from (``prev``), so history is a
tree rather than a line. Rewind, then work, then rewind again: each branch stays
reachable, and undo always means "the state this one came from".
"""

from __future__ import annotations

import os
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path

from . import registry
from .config import Config, REWIND_DIR, find_repo
from .scanner import ScanResult, scan
from .store import BlobStore
from .timeline import Frame, Timeline


class RewindError(Exception):
    """Something the user needs to know about, phrased for a human."""


@dataclass
class Change:
    op: str          # add | modify | delete | chmod | retype
    path: str
    kind: str = "f"  # f | d | l
    detail: str = ""

    def to_dict(self) -> dict:
        return {"op": self.op, "path": self.path, "kind": self.kind, "detail": self.detail}


@dataclass
class Plan:
    """What it would take to turn the tree on disk into a target frame."""

    removals: list[tuple[str, str]] = field(default_factory=list)   # (path, kind)
    makedirs: list[str] = field(default_factory=list)
    writes: list[tuple[str, dict]] = field(default_factory=list)    # (path, record)
    chmods: list[tuple[str, int]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def empty(self) -> bool:
        return not (self.removals or self.makedirs or self.writes or self.chmods)

    def summary(self) -> str:
        restored = len(self.writes) + len(self.makedirs)
        return f"{restored} restored, {len(self.removals)} removed, {len(self.chmods)} permissions"


@dataclass
class ApplyReport:
    restored: int = 0
    removed: int = 0
    chmodded: int = 0
    warnings: list[str] = field(default_factory=list)
    failures: list[tuple[str, str]] = field(default_factory=list)


def diff_manifests(old: dict, new: dict) -> list[Change]:
    """Changes that turn ``old`` into ``new``, as a human would describe them."""
    changes: list[Change] = []
    for path, record in sorted(new.items()):
        before = old.get(path)
        if before is None:
            changes.append(Change("add", path, record["t"]))
        elif before["t"] != record["t"]:
            changes.append(Change("retype", path, record["t"],
                                  f"{before['t']} -> {record['t']}"))
        elif record["t"] == "f":
            if before.get("h") != record.get("h"):
                changes.append(Change("modify", path, "f"))
            elif before.get("m") != record.get("m"):
                changes.append(Change("chmod", path, "f",
                                      f"{before.get('m', 0):o} -> {record.get('m', 0):o}"))
        elif record["t"] == "l":
            if before.get("to") != record.get("to"):
                changes.append(Change("modify", path, "l", record.get("to", "")))
        elif record["t"] == "d" and before.get("m") != record.get("m"):
            changes.append(Change("chmod", path, "d",
                                  f"{before.get('m', 0):o} -> {record.get('m', 0):o}"))
    for path, record in sorted(old.items()):
        if path not in new:
            changes.append(Change("delete", path, record["t"]))
    return changes


def build_plan(current: dict, target: dict, subtree: str | None = None) -> Plan:
    """Work out how to make the tree on disk look like ``target``.

    With ``subtree`` set, only that path and its descendants are touched -- that
    is how a single folder is rewound while the rest of the tree stays put.
    """
    plan = Plan()

    def in_scope(path: str) -> bool:
        if subtree is None:
            return True
        return path == subtree or path.startswith(subtree.rstrip("/") + "/")

    # 1. Anything on disk that the target does not have, or has as another type.
    for path, record in current.items():
        if not in_scope(path):
            continue
        wanted = target.get(path)
        if wanted is None or wanted["t"] != record["t"]:
            plan.removals.append((path, record["t"]))
    # Deepest first, so directories are empty by the time we reach them.
    plan.removals.sort(key=lambda item: item[0].count("/"), reverse=True)

    # 2. Everything the target wants that is missing or different.
    for path, record in sorted(target.items()):
        if not in_scope(path):
            continue
        present = current.get(path)
        same_type = present is not None and present["t"] == record["t"]
        if record["t"] == "d":
            if not same_type:
                plan.makedirs.append(path)
            elif present.get("m") != record.get("m"):
                plan.chmods.append((path, record["m"]))
        elif record["t"] == "l":
            if not same_type or present.get("to") != record.get("to"):
                plan.writes.append((path, record))
        elif record["t"] == "f":
            if record.get("h") is None:
                # Oversized: contents were never stored, so they cannot come back.
                if not same_type:
                    plan.warnings.append(
                        f"{path}: too large to have been recorded, cannot be restored")
                elif present.get("s") != record.get("s"):
                    plan.warnings.append(
                        f"{path}: too large to have been recorded, left as it is")
                continue
            if not same_type or present.get("h") != record.get("h"):
                plan.writes.append((path, record))
            elif present.get("m") != record.get("m"):
                plan.chmods.append((path, record["m"]))
    plan.makedirs.sort(key=lambda p: p.count("/"))
    # Permissions go on last: a read-only directory cannot be written into.
    plan.chmods.sort(key=lambda item: item[0].count("/"), reverse=True)
    return plan


class Repo:
    """A tracked tree and its film."""

    def __init__(self, root: Path, repo_dir: Path | None = None):
        self.root = Path(root).resolve()
        # History normally lives in a vault outside the folder, so that
        # protecting a folder does not change its contents. It can also live in
        # the folder itself, which travels with it.
        self.dir = (Path(repo_dir).resolve() if repo_dir
                    else self.root / REWIND_DIR)
        self.cfg = Config.load(self.dir / "config.json")
        self.store = BlobStore(self.dir / "objects")
        self.timeline = Timeline(self.dir)

    @property
    def extra_ignore(self) -> list[str]:
        """Rewind's own storage, when it sits inside the folder being recorded."""
        pruned = []
        for path in (self.dir, registry.home()):
            try:
                rel = path.relative_to(self.root)
            except ValueError:
                continue
            if str(rel) not in (".", ""):
                pruned.append(str(rel).replace(os.sep, "/"))
        return pruned

    @property
    def inside(self) -> bool:
        return self.dir.parent == self.root

    # -- lifecycle ------------------------------------------------------

    @classmethod
    def init(cls, root: Path, ignore: list[str] | None = None,
             repo_dir: Path | None = None) -> "Repo":
        root = Path(root).resolve()
        repo_dir = Path(repo_dir).resolve() if repo_dir else root / REWIND_DIR
        if (repo_dir / "timeline.jsonl").exists():
            raise RewindError(f"{root} is already being recorded")
        (repo_dir / "objects").mkdir(parents=True, exist_ok=True)
        (repo_dir / "frames").mkdir(parents=True, exist_ok=True)
        cfg = Config()
        if ignore:
            cfg.ignore = list(dict.fromkeys(cfg.ignore + list(ignore)))
        cfg.save(repo_dir / "config.json")
        (repo_dir / "timeline.jsonl").touch()
        repo = cls(root, repo_dir)
        repo.commit(label="init", note="recording started", force=True)
        return repo

    @classmethod
    def open(cls, root: Path, repo_dir: Path | None = None) -> "Repo":
        root = Path(root).resolve()
        repo_dir = Path(repo_dir).resolve() if repo_dir else root / REWIND_DIR
        if not (repo_dir / "timeline.jsonl").exists():
            raise RewindError(
                f"{root} is not being recorded yet - run 'rewind protect' on it first")
        return cls(root, repo_dir)

    @classmethod
    def for_path(cls, path: Path) -> "Repo":
        """Open whichever recorded folder covers ``path``.

        Protected folders are found first, wherever you are standing inside
        them; failing that, Rewind walks upwards looking for an in-folder
        ``.rewind``. That is what makes a protected folder reversible from
        anywhere, at any time.
        """
        path = Path(path).resolve()
        entry = registry.Registry.load().covering(path)
        if entry is not None and entry.recorded:
            return cls(entry.folder, entry.vault_dir)
        found = find_repo(path)
        if found is not None:
            return cls(found)
        if entry is not None:
            raise RewindError(
                f"{entry.path} is protected but has no frames yet - "
                f"run 'rewind snap' in it, or 'rewind service start'")
        raise RewindError(
            f"{path} is not in a folder Rewind is recording.\n"
            f"       Protect it with:  rewind protect {path}\n"
            f"       See what is protected with:  rewind list")

    # -- reading the world ----------------------------------------------

    def head_frame(self) -> Frame | None:
        return self.timeline.get(self.timeline.head())

    def head_manifest(self) -> dict:
        head = self.timeline.head()
        if head == 0:
            return {}
        try:
            return self.timeline.load_manifest(head)
        except KeyError:
            return {}

    def scan_disk(self, previous: dict | None = None) -> ScanResult:
        if previous is None:
            previous = self.head_manifest()
        return scan(self.root, self.cfg, self.store, previous, self.extra_ignore)

    def pending_changes(self) -> tuple[list[Change], ScanResult]:
        """What has happened since the playhead frame was cut."""
        result = self.scan_disk()
        return diff_manifests(self.head_manifest(), result.manifest), result

    # -- writing frames --------------------------------------------------

    def commit(self, label: str = "auto", note: str = "", force: bool = False,
               scan_result: ScanResult | None = None) -> Frame | None:
        """Cut a frame. Returns ``None`` when nothing has changed."""
        result = scan_result or self.scan_disk()
        changes = diff_manifests(self.head_manifest(), result.manifest)
        if not changes and not force:
            return None
        frame = Frame(
            seq=self.timeline.next_seq(),
            ts=time.time(),
            label=label,
            note=note,
            prev=self.timeline.head(),
            added=sum(1 for c in changes if c.op == "add"),
            modified=sum(1 for c in changes if c.op in ("modify", "retype")),
            deleted=sum(1 for c in changes if c.op == "delete"),
            files=sum(1 for r in result.manifest.values() if r["t"] == "f"),
            bytes=result.bytes_tracked,
        )
        self.timeline.append(frame, result.manifest, [c.to_dict() for c in changes])
        self.timeline.set_head(frame.seq)
        return frame

    # -- playing the film ------------------------------------------------

    def seek(self, target_seq: int, subtree: str | None = None, dry_run: bool = False,
             safety: bool = True) -> tuple[Plan, ApplyReport | None, Frame | None]:
        """Make the tree on disk match frame ``target_seq``.

        Unrecorded work is captured as its own frame first, so a rewind never
        destroys anything -- including the state you rewound away from.
        """
        target_frame = self.timeline.get(target_seq)
        if target_frame is None:
            raise RewindError(f"there is no frame f{target_seq:05d} in this timeline")
        target = self.timeline.load_manifest(target_seq)

        result = self.scan_disk()
        current = result.manifest

        safety_frame = None
        if safety and not dry_run:
            safety_frame = self.commit(
                label="pre-rewind",
                note=f"state before rewinding to {target_frame.id}",
                scan_result=result,
            )

        plan = build_plan(current, target, subtree)
        if dry_run:
            return plan, None, safety_frame

        report = self.apply(plan)
        if subtree is None:
            self.timeline.set_head(target_seq)
        else:
            # A folder-only rewind produces a state no single frame describes,
            # so record it as a frame of its own and stay there.
            self.commit(label="folder-rewind",
                        note=f"{subtree} rewound to {target_frame.id}")
        return plan, report, safety_frame

    def apply(self, plan: Plan) -> ApplyReport:
        report = ApplyReport(warnings=list(plan.warnings))

        for path, kind in plan.removals:
            full = self.root / path
            try:
                if kind == "d" and not full.is_symlink():
                    try:
                        full.rmdir()
                    except OSError:
                        # Untracked or ignored content lives here; leave it alone.
                        report.warnings.append(
                            f"{path}/: kept, it still holds files Rewind does not track")
                        continue
                else:
                    full.unlink(missing_ok=True)
                report.removed += 1
            except OSError as exc:
                report.failures.append((path, str(exc)))

        for path in plan.makedirs:
            try:
                (self.root / path).mkdir(parents=True, exist_ok=True)
                report.restored += 1
            except OSError as exc:
                report.failures.append((path, str(exc)))

        for path, record in plan.writes:
            full = self.root / path
            try:
                full.parent.mkdir(parents=True, exist_ok=True)
                if record["t"] == "l":
                    if full.is_symlink() or full.exists():
                        if full.is_dir() and not full.is_symlink():
                            shutil.rmtree(full)
                        else:
                            full.unlink()
                    os.symlink(record["to"], full)
                else:
                    self.store.extract(record["h"], full,
                                       mode=record.get("m"), mtime=record.get("mt"))
                report.restored += 1
            except (OSError, KeyError) as exc:
                report.failures.append((path, str(exc)))

        for path, mode in plan.chmods:
            try:
                os.chmod(self.root / path, mode)
                report.chmodded += 1
            except OSError as exc:
                report.failures.append((path, str(exc)))

        return report

    # -- navigation helpers ----------------------------------------------

    def parent_of(self, seq: int) -> int | None:
        frame = self.timeline.get(seq)
        if frame is None:
            return None
        if frame.prev and self.timeline.get(frame.prev):
            return frame.prev
        # Fall back to recording order for frames cut before prev was tracked.
        earlier = [f.seq for f in self.timeline.frames if f.seq < seq]
        return earlier[-1] if earlier else None

    def child_of(self, seq: int) -> int | None:
        """The newest frame cut from ``seq`` -- the way forward through the film."""
        children = [f.seq for f in self.timeline.frames if f.prev == seq and f.seq != seq]
        if children:
            return max(children)
        later = [f.seq for f in self.timeline.frames if f.seq > seq]
        return later[0] if later else None

    def step(self, direction: int, count: int = 1) -> int:
        """Walk ``count`` frames back (-1) or forward (+1) from the playhead."""
        seq = self.timeline.head()
        for _ in range(count):
            nxt = self.parent_of(seq) if direction < 0 else self.child_of(seq)
            if nxt is None:
                break
            seq = nxt
        return seq

    def frame_at_time(self, when: float) -> Frame | None:
        """The last frame cut at or before ``when``."""
        candidates = [f for f in self.timeline.frames if f.ts <= when]
        if candidates:
            return candidates[-1]
        return self.timeline.frames[0] if self.timeline.frames else None

    # -- history of one path ----------------------------------------------

    def path_history(self, relpath: str) -> list[tuple[Frame, str]]:
        """Every frame in which ``relpath`` (or anything under it) changed."""
        prefix = relpath.rstrip("/") + "/"
        out: list[tuple[Frame, str]] = []
        for frame in self.timeline.frames:
            try:
                changes = self.timeline.load_changes(frame.seq)
            except KeyError:
                continue
            hits = [c for c in changes
                    if c["path"] == relpath or c["path"].startswith(prefix)]
            if hits:
                ops = sorted({c["op"] for c in hits})
                label = ", ".join(ops)
                if len(hits) > 1:
                    label += f" ({len(hits)} paths)"
                out.append((frame, label))
        return out

    # -- housekeeping -------------------------------------------------------

    def referenced_digests(self) -> set[str]:
        digests: set[str] = set()
        for frame in self.timeline.frames:
            try:
                manifest = self.timeline.load_manifest(frame.seq)
            except KeyError:
                continue
            for record in manifest.values():
                if record.get("t") == "f" and record.get("h"):
                    digests.add(record["h"])
        return digests

    def gc(self, keep_days: float | None = None, keep_last: int = 20,
           dry_run: bool = False) -> dict:
        """Drop old automatic frames, then the blobs nothing points at any more."""
        keep_days = self.cfg.retention_days if keep_days is None else keep_days
        cutoff = time.time() - keep_days * 86400
        frames = self.timeline.frames
        head = self.timeline.head()
        protected = set()
        if frames:
            protected.add(frames[0].seq)
        protected.add(head)
        if keep_last > 0:
            protected.update(f.seq for f in frames[-keep_last:])
        protected.update(f.seq for f in frames if f.label not in ("auto", "pre-rewind"))

        doomed = [f for f in frames if f.seq not in protected and f.ts < cutoff]
        if dry_run:
            return {"frames_pruned": len(doomed), "blobs_pruned": 0, "bytes_freed": 0,
                    "frames_kept": len(frames) - len(doomed), "dry_run": True}

        for frame in doomed:
            self.timeline.manifest_path(frame.seq).unlink(missing_ok=True)
        surviving = [f for f in frames if f not in doomed]
        self.timeline.rewrite_index(surviving)

        live = self.referenced_digests()
        blobs_pruned = 0
        bytes_freed = 0
        for digest in list(self.store.iter_digests()):
            if digest not in live:
                bytes_freed += self.store.remove(digest)
                blobs_pruned += 1
        return {"frames_pruned": len(doomed), "blobs_pruned": blobs_pruned,
                "bytes_freed": bytes_freed, "frames_kept": len(surviving),
                "dry_run": False}

    def verify(self) -> list[str]:
        """Report frames whose contents can no longer be fully restored."""
        problems: list[str] = []
        for frame in self.timeline.frames:
            try:
                manifest = self.timeline.load_manifest(frame.seq)
            except KeyError:
                problems.append(f"{frame.id}: manifest is missing")
                continue
            missing = [p for p, r in manifest.items()
                       if r.get("t") == "f" and r.get("h") and not self.store.has(r["h"])]
            if missing:
                problems.append(
                    f"{frame.id}: {len(missing)} file(s) lost from the store, "
                    f"first is {missing[0]}")
        return problems
