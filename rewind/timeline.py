"""The film strip: an append-only sequence of frames, plus the playhead."""

from __future__ import annotations

import gzip
import json
import os
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class Frame:
    """One complete picture of the tree at a moment in time."""

    seq: int
    ts: float
    label: str = "auto"
    note: str = ""
    # The playhead this frame was cut from. History is a tree, not a line:
    # rewind, work, rewind again, and every branch stays reachable.
    prev: int = 0
    added: int = 0
    modified: int = 0
    deleted: int = 0
    files: int = 0
    bytes: int = 0

    @property
    def id(self) -> str:
        return f"f{self.seq:05d}"

    @property
    def changes(self) -> int:
        return self.added + self.modified + self.deleted

    def to_json(self) -> str:
        return json.dumps(asdict(self), separators=(",", ":"))

    @classmethod
    def from_dict(cls, data: dict) -> "Frame":
        known = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
        return cls(**{k: v for k, v in data.items() if k in known})


class Timeline:
    """Frame index on disk. Appended to, never rewritten by normal operation."""

    def __init__(self, repo_dir: Path):
        self.repo_dir = Path(repo_dir)
        self.index_path = self.repo_dir / "timeline.jsonl"
        self.frames_dir = self.repo_dir / "frames"
        self.head_path = self.repo_dir / "HEAD"
        self._frames: list[Frame] | None = None

    # -- frame index ----------------------------------------------------

    @property
    def frames(self) -> list[Frame]:
        if self._frames is None:
            self._frames = self._read_index()
        return self._frames

    def _read_index(self) -> list[Frame]:
        frames: list[Frame] = []
        try:
            with open(self.index_path, "r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if line:
                        frames.append(Frame.from_dict(json.loads(line)))
        except FileNotFoundError:
            pass
        frames.sort(key=lambda f: f.seq)
        return frames

    def reload(self) -> None:
        self._frames = None

    def append(self, frame: Frame, manifest: dict, changes: list[dict]) -> Frame:
        self.frames_dir.mkdir(parents=True, exist_ok=True)
        payload = {"frame": asdict(frame), "manifest": manifest, "changes": changes}
        blob = gzip.compress(json.dumps(payload, separators=(",", ":")).encode("utf-8"), 6)
        temp = self.frames_dir / f".{frame.id}.tmp"
        temp.write_bytes(blob)
        os.replace(temp, self.manifest_path(frame.seq))
        with open(self.index_path, "a", encoding="utf-8") as fh:
            fh.write(frame.to_json() + "\n")
            fh.flush()
            os.fsync(fh.fileno())
        self.frames.append(frame)
        return frame

    def manifest_path(self, seq: int) -> Path:
        return self.frames_dir / f"f{seq:05d}.json.gz"

    def load_frame_data(self, seq: int) -> dict:
        path = self.manifest_path(seq)
        if not path.exists():
            raise KeyError(f"frame f{seq:05d} has been pruned from this timeline")
        return json.loads(gzip.decompress(path.read_bytes()).decode("utf-8"))

    def load_manifest(self, seq: int) -> dict:
        return self.load_frame_data(seq)["manifest"]

    def load_changes(self, seq: int) -> list[dict]:
        return self.load_frame_data(seq).get("changes", [])

    def get(self, seq: int) -> Frame | None:
        for frame in self.frames:
            if frame.seq == seq:
                return frame
        return None

    def latest(self) -> Frame | None:
        return self.frames[-1] if self.frames else None

    def next_seq(self) -> int:
        return (self.frames[-1].seq + 1) if self.frames else 1

    def rewrite_index(self, frames: list[Frame]) -> None:
        """Only ``gc`` does this: drop pruned frames from the index."""
        temp = self.index_path.with_suffix(".jsonl.tmp")
        with open(temp, "w", encoding="utf-8") as fh:
            for frame in frames:
                fh.write(frame.to_json() + "\n")
        os.replace(temp, self.index_path)
        self._frames = sorted(frames, key=lambda f: f.seq)

    # -- playhead -------------------------------------------------------

    def head(self) -> int:
        try:
            return int(json.loads(self.head_path.read_text(encoding="utf-8"))["seq"])
        except (FileNotFoundError, KeyError, ValueError):
            latest = self.latest()
            return latest.seq if latest else 0

    def set_head(self, seq: int) -> None:
        temp = self.head_path.with_suffix(".tmp")
        temp.write_text(json.dumps({"seq": seq}) + "\n", encoding="utf-8")
        os.replace(temp, self.head_path)

    def position(self) -> tuple[int, int]:
        """(index of playhead in the frame list, total frames), 1-based index."""
        head = self.head()
        for i, frame in enumerate(self.frames):
            if frame.seq == head:
                return i + 1, len(self.frames)
        return len(self.frames), len(self.frames)
