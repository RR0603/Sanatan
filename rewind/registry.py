"""The list of folders you have chosen to be able to reverse.

A folder you protect is recorded whether or not you are standing in it, and
stays reversible until you tell Rewind to forget it. The registry lives outside
every protected folder so that protecting one does not alter it:

    $REWIND_HOME/registry.json     which folders are protected
    $REWIND_HOME/vaults/<name>/    each folder's frames and stored contents

``REWIND_HOME`` defaults to ``$XDG_DATA_HOME/rewind``, i.e. normally
``~/.local/share/rewind``. History can also be kept inside the folder itself
(``rewind protect --inside``), which is handy for a project folder you move or
copy around.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass, asdict
from pathlib import Path

REGISTRY_VERSION = 1

# Recording these would mean recording the machine, not a folder of your work.
FORBIDDEN = {"/", "/proc", "/sys", "/dev", "/run", "/boot"}


def home() -> Path:
    """Where Rewind keeps the registry and the vaults."""
    explicit = os.environ.get("REWIND_HOME")
    if explicit:
        return Path(explicit).expanduser().resolve()
    xdg = os.environ.get("XDG_DATA_HOME")
    base = Path(xdg).expanduser() if xdg else Path.home() / ".local" / "share"
    return (base / "rewind").resolve()


def registry_path() -> Path:
    return home() / "registry.json"


def vaults_dir() -> Path:
    return home() / "vaults"


def vault_for(folder: Path) -> Path:
    """A stable, readable vault directory name for a folder."""
    folder = Path(folder).resolve()
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", folder.name or "root").strip("-") or "root"
    digest = hashlib.sha256(str(folder).encode()).hexdigest()[:8]
    return vaults_dir() / f"{slug}-{digest}"


@dataclass
class Entry:
    """One protected folder."""

    path: str
    vault: str
    added: float = 0.0
    paused: bool = False

    @property
    def folder(self) -> Path:
        return Path(self.path)

    @property
    def vault_dir(self) -> Path:
        return Path(self.vault)

    @property
    def inside(self) -> bool:
        """True when the history is kept in the folder rather than a vault."""
        return self.vault_dir.parent == self.folder

    @property
    def exists(self) -> bool:
        return self.folder.is_dir()

    @property
    def recorded(self) -> bool:
        return (self.vault_dir / "timeline.jsonl").exists()


class Registry:
    def __init__(self, entries: list[Entry] | None = None):
        self.entries: list[Entry] = entries or []

    # -- persistence ----------------------------------------------------

    @classmethod
    def load(cls) -> "Registry":
        try:
            raw = json.loads(registry_path().read_text(encoding="utf-8"))
        except FileNotFoundError:
            return cls()
        except json.JSONDecodeError as exc:
            raise ValueError(f"{registry_path()} is not valid JSON ({exc}) - fix it "
                             f"or delete it to start a fresh list") from None
        known = {f for f in Entry.__dataclass_fields__}  # type: ignore[attr-defined]
        entries = [Entry(**{k: v for k, v in item.items() if k in known})
                   for item in raw.get("folders", [])]
        return cls(entries)

    def save(self) -> None:
        path = registry_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"version": REGISTRY_VERSION,
                   "folders": [asdict(e) for e in self.sorted()]}
        temp = path.with_suffix(".json.tmp")
        temp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        os.replace(temp, path)

    def sorted(self) -> list[Entry]:
        return sorted(self.entries, key=lambda e: e.path)

    # -- lookups --------------------------------------------------------

    def get(self, folder: Path) -> Entry | None:
        """The entry for exactly this folder."""
        target = str(Path(folder).resolve())
        for entry in self.entries:
            if entry.path == target:
                return entry
        return None

    def covering(self, path: Path) -> Entry | None:
        """The protected folder that contains ``path`` -- the innermost one."""
        target = Path(path).resolve()
        best: Entry | None = None
        for entry in self.entries:
            root = entry.folder
            if target == root or _is_within(target, root):
                if best is None or len(entry.path) > len(best.path):
                    best = entry
        return best

    def inside_of(self, folder: Path) -> list[Entry]:
        """Protected folders that live underneath ``folder``."""
        target = Path(folder).resolve()
        return [e for e in self.entries if _is_within(e.folder, target)]

    def active(self) -> list[Entry]:
        return [e for e in self.sorted() if not e.paused and e.exists]

    # -- changes --------------------------------------------------------

    def add(self, folder: Path, vault: Path | None = None) -> Entry:
        folder = Path(folder).resolve()
        existing = self.get(folder)
        if existing:
            return existing
        entry = Entry(path=str(folder),
                      vault=str(vault or vault_for(folder)),
                      added=time.time())
        self.entries.append(entry)
        return entry

    def remove(self, folder: Path) -> Entry | None:
        entry = self.get(folder)
        if entry:
            self.entries.remove(entry)
        return entry


def _is_within(path: Path, ancestor: Path) -> bool:
    try:
        path.relative_to(ancestor)
    except ValueError:
        return False
    return path != ancestor


def refuses(folder: Path) -> str | None:
    """Why this folder must not be recorded, or ``None`` if it is fine."""
    folder = Path(folder).resolve()
    if str(folder) in FORBIDDEN:
        return (f"{folder} is the system itself, not a folder of your work. "
                f"Protect something like ~/Documents or a project folder.")
    if not folder.exists():
        return f"{folder} does not exist"
    if not folder.is_dir():
        return f"{folder} is a file, not a folder"
    if _is_within(home(), folder) or home() == folder:
        # Allowed: the vaults are ignored while scanning. Nothing to report.
        return None
    return None
