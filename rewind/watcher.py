"""The recorder: keeps cutting frames while you work."""

from __future__ import annotations

import os
import signal
import time
from pathlib import Path

from . import inotify
from .config import Ignorer
from .engine import Repo, diff_manifests


class Watcher:
    def __init__(self, repo: Repo, interval: float | None = None,
                 settle: float | None = None, log=None):
        self.repo = repo
        self.interval = interval if interval is not None else repo.cfg.poll_interval
        self.settle = settle if settle is not None else repo.cfg.settle
        self.log = log or (lambda msg: print(msg, flush=True))
        self.stopping = False
        self.frames_cut = 0

    def request_stop(self, *_args) -> None:
        self.stopping = True

    def _take_label(self) -> tuple[str, str]:
        """Consume a note left by the shell hook, if there is one."""
        marker = self.repo.dir / "next-note"
        try:
            note = marker.read_text(encoding="utf-8").strip()
            marker.unlink(missing_ok=True)
        except (FileNotFoundError, OSError):
            return "auto", ""
        return ("command", note[:300]) if note else ("auto", "")

    def run(self, once: bool = False, max_frames: int | None = None) -> int:
        repo = self.repo
        notifier = inotify.try_open(repo.root, Ignorer(repo.cfg.ignore))
        if notifier is not None:
            mode = f"inotify ({len(notifier.watches)} folders)"
            if notifier.saturated:
                mode += " + polling (kernel watch limit reached)"
        else:
            mode = f"polling every {self.interval:g}s"
        self.log(f"recording {repo.root} - {mode}")

        previous_signature: tuple | None = None
        pending_since: float | None = None
        last_poll = 0.0
        last_watch_sync = time.time()

        try:
            while not self.stopping:
                triggered = False
                if notifier is not None:
                    triggered = notifier.wait(min(self.interval, 1.0))
                else:
                    deadline = last_poll + self.interval
                    nap = max(0.05, deadline - time.time())
                    time.sleep(min(nap, 1.0))

                now = time.time()
                must_poll = notifier is None or notifier.saturated
                # Even with inotify, rescan occasionally: a folder created and
                # written to before its watch was added would otherwise be missed
                # until something else happened.
                gap = self.interval if must_poll else max(self.interval, 15.0)
                due = now - last_poll >= gap
                if not (triggered or due or pending_since is not None or once):
                    continue
                last_poll = now

                result = repo.scan_disk()
                changes = diff_manifests(repo.head_manifest(), result.manifest)

                if not changes:
                    previous_signature, pending_since = None, None
                    if once:
                        break
                    continue

                signature = tuple(sorted(
                    (c.op, c.path, result.manifest.get(c.path, {}).get("h", ""))
                    for c in changes))
                if signature != previous_signature:
                    # Still moving. Let the burst finish before cutting a frame.
                    previous_signature, pending_since = signature, now
                    if not once:
                        continue

                if once or (pending_since is not None and now - pending_since >= self.settle):
                    label, note = self._take_label()
                    frame = repo.commit(label=label, note=note, scan_result=result)
                    if frame:
                        self.frames_cut += 1
                        self.log(f"  {frame.id}  +{frame.added} ~{frame.modified} "
                                 f"-{frame.deleted}" + (f"  {note}" if note else ""))
                    previous_signature, pending_since = None, None
                    if once or (max_frames and self.frames_cut >= max_frames):
                        break

                if notifier is not None and time.time() - last_watch_sync > 5:
                    notifier.sync_watches()
                    last_watch_sync = time.time()
        finally:
            if notifier is not None:
                notifier.close()

        # Never walk away from unrecorded work.
        frame = self.repo.commit(label="auto", note="recorder stopping")
        if frame:
            self.frames_cut += 1
            self.log(f"  {frame.id}  final frame")
        return self.frames_cut


# -- background daemon -------------------------------------------------------

def pid_file(repo: Repo) -> Path:
    return repo.dir / "watcher.pid"


def log_file(repo: Repo) -> Path:
    return repo.dir / "watcher.log"


def running_pid(repo: Repo) -> int | None:
    try:
        pid = int(pid_file(repo).read_text().strip())
    except (FileNotFoundError, ValueError):
        return None
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        pid_file(repo).unlink(missing_ok=True)
        return None
    except PermissionError:
        return pid
    return pid


def start_daemon(repo: Repo, interval: float | None = None,
                 settle: float | None = None) -> int:
    """Fork into the background and record until told to stop."""
    existing = running_pid(repo)
    if existing:
        raise RuntimeError(f"already recording (pid {existing})")

    middle = os.fork()
    if middle != 0:
        # The middle process forks again and exits at once; reap it here so it
        # does not linger as a zombie.
        try:
            os.waitpid(middle, 0)
        except ChildProcessError:
            pass
        # Give the recorder a moment to claim the pid file.
        for _ in range(50):
            time.sleep(0.05)
            pid = running_pid(repo)
            if pid:
                return pid
        raise RuntimeError("the recorder did not come up - see .rewind/watcher.log")

    os.setsid()
    if os.fork() != 0:
        os._exit(0)

    pid_file(repo).write_text(f"{os.getpid()}\n")
    logfh = open(log_file(repo), "a", buffering=1, encoding="utf-8")
    devnull = os.open(os.devnull, os.O_RDWR)
    os.dup2(devnull, 0)
    os.dup2(logfh.fileno(), 1)
    os.dup2(logfh.fileno(), 2)

    def stamped(msg: str) -> None:
        logfh.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")

    watcher = Watcher(repo, interval, settle, log=stamped)
    signal.signal(signal.SIGTERM, watcher.request_stop)
    signal.signal(signal.SIGINT, watcher.request_stop)
    try:
        watcher.run()
    except Exception as exc:  # the log is the only place this can be seen
        stamped(f"recorder stopped with an error: {exc!r}")
    finally:
        pid_file(repo).unlink(missing_ok=True)
        stamped("recorder stopped")
    os._exit(0)


def stop_daemon(repo: Repo, timeout: float = 10.0) -> bool:
    pid = running_pid(repo)
    if not pid:
        return False
    os.kill(pid, signal.SIGTERM)
    deadline = time.time() + timeout
    while time.time() < deadline:
        if running_pid(repo) is None:
            return True
        time.sleep(0.1)
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    pid_file(repo).unlink(missing_ok=True)
    return True
