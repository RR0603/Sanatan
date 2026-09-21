"""Turning a live directory tree into a frame manifest.

A manifest maps every tracked relative path to a compact record:

    file     {"t": "f", "m": mode, "s": size, "mt": mtime, "h": sha256}
    dir      {"t": "d", "m": mode}
    symlink  {"t": "l", "to": target}

Oversized files get ``"h": None`` and ``"big": True``: their existence is
tracked so a deletion is still *reported*, but their contents are not stored.
"""

from __future__ import annotations

import os
import stat
import time
from pathlib import Path

from .config import Config, Ignorer
from .store import BlobStore


class ScanResult:
    def __init__(self) -> None:
        self.manifest: dict[str, dict] = {}
        self.bytes_tracked = 0
        self.bytes_new = 0
        self.skipped_big: list[str] = []
        self.errors: list[tuple[str, str]] = []


def scan(root: Path, cfg: Config, store: BlobStore,
         previous: dict[str, dict] | None = None) -> ScanResult:
    """Walk ``root`` and produce a manifest, storing any new file contents.

    ``previous`` is the last manifest; when a file's size and mtime are
    unchanged we trust its recorded hash instead of re-reading the file. That
    is what keeps repeated scans of a large tree cheap.
    """
    root = Path(root)
    ignorer = Ignorer(cfg.ignore)
    previous = previous or {}
    result = ScanResult()

    def walk(directory: Path, rel: str) -> None:
        try:
            entries = sorted(os.scandir(directory), key=lambda e: e.name)
        except (PermissionError, FileNotFoundError, OSError) as exc:
            result.errors.append((rel or ".", str(exc)))
            return
        for entry in entries:
            child_rel = f"{rel}/{entry.name}" if rel else entry.name
            try:
                is_link = entry.is_symlink()
                is_dir = entry.is_dir(follow_symlinks=False)
            except OSError as exc:
                result.errors.append((child_rel, str(exc)))
                continue
            if ignorer.match(child_rel, is_dir):
                continue
            try:
                if is_link:
                    if cfg.follow_symlinks and entry.is_dir():
                        st = entry.stat()
                        result.manifest[child_rel] = {"t": "d", "m": stat.S_IMODE(st.st_mode)}
                        walk(Path(entry.path), child_rel)
                    else:
                        result.manifest[child_rel] = {"t": "l", "to": os.readlink(entry.path)}
                elif is_dir:
                    st = entry.stat(follow_symlinks=False)
                    result.manifest[child_rel] = {"t": "d", "m": stat.S_IMODE(st.st_mode)}
                    walk(Path(entry.path), child_rel)
                elif entry.is_file(follow_symlinks=False):
                    _record_file(entry, child_rel, cfg, store, previous, result)
                # Sockets, fifos and devices are deliberately not tracked.
            except (PermissionError, FileNotFoundError, OSError) as exc:
                result.errors.append((child_rel, str(exc)))

    walk(root, "")
    return result


def _record_file(entry: os.DirEntry, rel: str, cfg: Config, store: BlobStore,
                 previous: dict[str, dict], result: ScanResult) -> None:
    st = entry.stat(follow_symlinks=False)
    mode = stat.S_IMODE(st.st_mode)
    record = {"t": "f", "m": mode, "s": st.st_size, "mt": round(st.st_mtime, 6)}

    if st.st_size > cfg.max_file_size:
        record["h"] = None
        record["big"] = True
        result.manifest[rel] = record
        result.skipped_big.append(rel)
        return

    # A file touched moments ago may be touched again inside one mtime tick, so
    # never trust the cache for one that is still warm -- re-read it instead.
    warm = (time.time() - st.st_mtime) < 2.0

    prior = previous.get(rel)
    if (
        not warm
        and prior
        and prior.get("t") == "f"
        and prior.get("h")
        and prior.get("s") == st.st_size
        and prior.get("mt") == record["mt"]
        and store.has(prior["h"])
    ):
        record["h"] = prior["h"]
        result.manifest[rel] = record
        result.bytes_tracked += st.st_size
        return

    digest, size = store.put_path(Path(entry.path))
    record["h"] = digest
    record["s"] = size
    result.manifest[rel] = record
    result.bytes_tracked += size
    if not prior or prior.get("h") != digest:
        result.bytes_new += size
