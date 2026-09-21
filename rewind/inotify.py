"""A thin ctypes binding to Linux inotify.

Rewind does not trust inotify to tell it *what* changed -- only that something
did, so it can rescan immediately instead of waiting for the next poll. That
keeps the fast path fast without making correctness depend on event delivery.
Anywhere inotify is unavailable, the watcher simply polls.
"""

from __future__ import annotations

import ctypes
import os
import select
import struct
from pathlib import Path

IN_MODIFY = 0x00000002
IN_ATTRIB = 0x00000004
IN_CLOSE_WRITE = 0x00000008
IN_MOVED_FROM = 0x00000040
IN_MOVED_TO = 0x00000080
IN_CREATE = 0x00000100
IN_DELETE = 0x00000200
IN_DELETE_SELF = 0x00000400
IN_MOVE_SELF = 0x00000800
IN_ONLYDIR = 0x01000000

WATCH_MASK = (IN_MODIFY | IN_ATTRIB | IN_CLOSE_WRITE | IN_MOVED_FROM | IN_MOVED_TO
              | IN_CREATE | IN_DELETE | IN_DELETE_SELF | IN_MOVE_SELF)

EVENT_HEADER = struct.Struct("iIII")


class Unavailable(RuntimeError):
    pass


class Notifier:
    """Watches a directory tree and reports 'something happened'."""

    def __init__(self, root: Path, ignorer, max_watches: int = 8192):
        self.root = Path(root)
        self.ignorer = ignorer
        self.max_watches = max_watches
        self.watches: dict[int, str] = {}
        self.saturated = False
        try:
            self._libc = ctypes.CDLL("libc.so.6", use_errno=True)
            self.fd = self._libc.inotify_init1(os.O_NONBLOCK)
        except (OSError, AttributeError) as exc:
            raise Unavailable(str(exc)) from exc
        if self.fd < 0:
            raise Unavailable("inotify_init1 failed")

    def close(self) -> None:
        try:
            os.close(self.fd)
        except OSError:
            pass

    def __enter__(self) -> "Notifier":
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def _add(self, path: Path) -> None:
        if len(self.watches) >= self.max_watches:
            self.saturated = True
            return
        wd = self._libc.inotify_add_watch(self.fd, str(path).encode(), WATCH_MASK | IN_ONLYDIR)
        if wd < 0:
            errno = ctypes.get_errno()
            if errno == 28:  # ENOSPC: the kernel's per-user watch limit
                self.saturated = True
            return
        self.watches[wd] = str(path)

    def sync_watches(self) -> int:
        """Make sure every tracked directory has a watch. Returns the count."""
        watched = set(self.watches.values())
        stack = [(self.root, "")]
        seen = set()
        while stack:
            directory, rel = stack.pop()
            if str(directory) not in watched:
                self._add(directory)
            seen.add(str(directory))
            try:
                entries = list(os.scandir(directory))
            except OSError:
                continue
            for entry in entries:
                if not entry.is_dir(follow_symlinks=False):
                    continue
                child_rel = f"{rel}/{entry.name}" if rel else entry.name
                if self.ignorer.match(child_rel, True):
                    continue
                stack.append((Path(entry.path), child_rel))
        # Forget watches for directories that no longer exist.
        for wd, path in list(self.watches.items()):
            if path not in seen:
                self.watches.pop(wd, None)
        return len(self.watches)

    def wait(self, timeout: float) -> bool:
        """Block up to ``timeout`` seconds. True if anything happened."""
        try:
            ready, _, _ = select.select([self.fd], [], [], timeout)
        except (OSError, ValueError):
            return False
        if not ready:
            return False
        got = False
        while True:
            try:
                data = os.read(self.fd, 65536)
            except BlockingIOError:
                break
            except OSError:
                break
            if not data:
                break
            got = True
            self._drain(data)
            if len(data) < 65536:
                break
        return got

    def _drain(self, data: bytes) -> None:
        offset = 0
        while offset + EVENT_HEADER.size <= len(data):
            wd, mask, _cookie, length = EVENT_HEADER.unpack_from(data, offset)
            offset += EVENT_HEADER.size + length
            if mask & (IN_DELETE_SELF | IN_MOVE_SELF):
                self.watches.pop(wd, None)


def try_open(root: Path, ignorer) -> Notifier | None:
    try:
        notifier = Notifier(root, ignorer)
    except Unavailable:
        return None
    try:
        notifier.sync_watches()
    except Exception:
        notifier.close()
        return None
    if not notifier.watches:
        notifier.close()
        return None
    return notifier
