"""Repository layout, configuration and ignore rules."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field, asdict
from fnmatch import fnmatch
from pathlib import Path
from typing import Iterable

REWIND_DIR = ".rewind"

# Things that are noisy, enormous, or regenerate themselves. Tracking them
# would bury the timeline in churn without making a single mistake recoverable.
DEFAULT_IGNORE = [
    ".rewind",
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "__pycache__",
    "*.pyc",
    "*.pyo",
    ".venv",
    "venv",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".tox",
    ".DS_Store",
    "Thumbs.db",
    "*.swp",
    "*.tmp",
    "*~",
    ".Trash",
    ".cache",
    "target/",
    "dist/",
    "build/",
]


@dataclass
class Config:
    """Per-repository settings, stored as JSON in ``.rewind/config.json``."""

    version: int = 1
    ignore: list = field(default_factory=lambda: list(DEFAULT_IGNORE))
    # Files larger than this are tracked by name/size but not by content.
    max_file_size: int = 64 * 1024 * 1024
    # Seconds between scans when the watcher has no inotify accelerator.
    poll_interval: float = 2.0
    # A burst of writes must be quiet for this long before a frame is cut, so a
    # save-heavy editor produces one frame instead of forty.
    settle: float = 0.75
    # Frames older than this may be dropped by ``rewind gc``.
    retention_days: int = 30
    follow_symlinks: bool = False

    @classmethod
    def load(cls, path: Path) -> "Config":
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return cls()
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path} is not valid JSON ({exc}) - fix it or delete "
                             f"it to go back to the defaults") from None
        known = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
        return cls(**{k: v for k, v in raw.items() if k in known})

    def save(self, path: Path) -> None:
        path.write_text(json.dumps(asdict(self), indent=2) + "\n", encoding="utf-8")


class Ignorer:
    """Matches paths against gitignore-flavoured patterns.

    Supported forms: a bare name (``node_modules``) matches at any depth, a
    glob (``*.pyc``) matches basenames, a trailing slash (``build/``) matches
    directories only, and a pattern containing a slash is matched against the
    whole relative path.
    """

    def __init__(self, patterns: Iterable[str]):
        self.patterns = [p.strip() for p in patterns if p.strip() and not p.startswith("#")]

    def match(self, relpath: str, is_dir: bool) -> bool:
        relpath = relpath.strip("/")
        if not relpath:
            return False
        name = relpath.rsplit("/", 1)[-1]
        for pattern in self.patterns:
            pat = pattern
            if pat.endswith("/"):
                if not is_dir:
                    continue
                pat = pat[:-1]
            if "/" in pat:
                if fnmatch(relpath, pat) or relpath.startswith(pat.strip("/") + "/"):
                    return True
                continue
            if fnmatch(name, pat):
                return True
            # A directory name anywhere in the path shadows everything beneath it.
            if ("/" + relpath).find("/" + pat + "/") != -1:
                return True
        return False


def find_repo(start: Path | None = None) -> Path | None:
    """Walk upwards looking for a ``.rewind`` directory, like git does."""
    here = (start or Path.cwd()).resolve()
    for candidate in [here, *here.parents]:
        if (candidate / REWIND_DIR / "timeline.jsonl").exists():
            return candidate
    return None


def default_root() -> Path:
    return Path(os.environ.get("REWIND_ROOT", Path.cwd())).resolve()
