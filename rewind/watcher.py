"""The recorder: keeps cutting frames for every folder you protect.

One process watches all of them. Each folder gets its own inotify descriptor
where the kernel allows it, and the loop waits on all of them at once, so
twenty protected folders cost one sleeping process rather than twenty.
"""

from __future__ import annotations

import os
import select
import signal
import time
from pathlib import Path

from . import inotify, registry
from .config import Ignorer
from .engine import Repo, diff_manifests
from .timeline import Frame

# How often to rescan a folder even when inotify has reported nothing: a folder
# created and written to before its watch existed would otherwise go unnoticed.
SAFETY_RESCAN = 15.0
# How often the service re-reads the registry, so a folder protected while it is
# running starts being recorded without a restart.
REGISTRY_POLL = 10.0


class FolderRecorder:
    """Decides when a burst of edits to one folder has settled into a frame."""

    def __init__(self, repo: Repo, settle: float, log=None):
        self.repo = repo
        self.settle = settle
        self.log = log or (lambda msg: None)
        self.notifier: inotify.Notifier | None = None
        self.previous_signature: tuple | None = None
        self.pending_since: float | None = None
        self.last_scan = 0.0
        self.last_watch_sync = 0.0
        self.frames_cut = 0
        self.broken = False

    # -- setup ----------------------------------------------------------

    def open_notifier(self) -> None:
        try:
            self.notifier = inotify.try_open(self.repo.root,
                                             self._ignorer())
        except Exception:
            self.notifier = None

    def _ignorer(self) -> Ignorer:
        return Ignorer(list(self.repo.cfg.ignore) + self.repo.extra_ignore)

    def describe(self) -> str:
        if self.notifier is None:
            return "polling"
        mode = f"inotify ({len(self.notifier.watches)} folders)"
        if self.notifier.saturated:
            mode += " + polling (kernel watch limit reached)"
        return mode

    @property
    def fd(self) -> int | None:
        return self.notifier.fd if self.notifier is not None else None

    @property
    def must_poll(self) -> bool:
        return self.notifier is None or self.notifier.saturated

    def close(self) -> None:
        if self.notifier is not None:
            self.notifier.close()
            self.notifier = None

    # -- the decision ---------------------------------------------------

    def due(self, now: float, interval: float) -> bool:
        gap = interval if self.must_poll else max(interval, SAFETY_RESCAN)
        return now - self.last_scan >= gap

    def check(self, now: float, force: bool = False) -> Frame | None:
        """Scan the folder and cut a frame if its changes have settled."""
        if self.broken:
            return None
        self.last_scan = now
        try:
            result = self.repo.scan_disk()
            changes = diff_manifests(self.repo.head_manifest(), result.manifest)
        except OSError as exc:
            self.log(f"  {self.repo.root}: cannot be read ({exc})")
            self.broken = True
            return None

        if not changes:
            self.previous_signature = self.pending_since = None
            return None

        signature = tuple(sorted(
            (c.op, c.path, result.manifest.get(c.path, {}).get("h", ""))
            for c in changes))
        if signature != self.previous_signature:
            # Still moving. Let the burst finish before cutting a frame.
            self.previous_signature, self.pending_since = signature, now
            if not force:
                return None

        if force or (self.pending_since is not None
                     and now - self.pending_since >= self.settle):
            label, note = self._take_note()
            frame = self.repo.commit(label=label, note=note, scan_result=result)
            self.previous_signature = self.pending_since = None
            if frame:
                self.frames_cut += 1
            return frame
        return None

    def final_frame(self, note: str) -> Frame | None:
        """Never walk away from unrecorded work."""
        if self.broken:
            return None
        try:
            return self.repo.commit(label="auto", note=note)
        except OSError:
            return None

    def sync_watches(self, now: float) -> None:
        if self.notifier is not None and now - self.last_watch_sync > 5:
            try:
                self.notifier.sync_watches()
            except Exception:
                pass
            self.last_watch_sync = now

    def _take_note(self) -> tuple[str, str]:
        """Consume a note left by the shell hook, if there is one."""
        marker = self.repo.dir / "next-note"
        try:
            note = marker.read_text(encoding="utf-8").strip()
            marker.unlink(missing_ok=True)
        except (FileNotFoundError, OSError):
            return "auto", ""
        return ("command", note[:300]) if note else ("auto", "")


class Watcher:
    """Records a single folder. ``rewind watch`` and the tests use this."""

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

    def run(self, once: bool = False, max_frames: int | None = None) -> int:
        recorder = FolderRecorder(self.repo, self.settle, self.log)
        recorder.open_notifier()
        self.log(f"recording {self.repo.root} - {recorder.describe()}")
        try:
            while not self.stopping:
                triggered = False
                if recorder.notifier is not None:
                    triggered = recorder.notifier.wait(min(self.interval, 1.0))
                else:
                    time.sleep(min(max(0.05, self.interval), 1.0))

                now = time.time()
                waiting = recorder.pending_since is not None
                if not (triggered or waiting or once or recorder.due(now, self.interval)):
                    continue

                frame = recorder.check(now, force=once)
                if frame:
                    self.frames_cut += 1
                    self.log(f"  {frame.id}  +{frame.added} ~{frame.modified} "
                             f"-{frame.deleted}" + (f"  {frame.note}" if frame.note else ""))
                if once or (max_frames and self.frames_cut >= max_frames):
                    break
                recorder.sync_watches(now)
        finally:
            recorder.close()

        frame = recorder.final_frame("recorder stopping")
        if frame:
            self.frames_cut += 1
            self.log(f"  {frame.id}  final frame")
        return self.frames_cut


class Service:
    """Records every protected folder in one process."""

    def __init__(self, interval: float | None = None, settle: float | None = None,
                 log=None):
        self.interval = interval or 2.0
        self.settle = settle if settle is not None else 0.75
        self.log = log or (lambda msg: print(msg, flush=True))
        self.recorders: dict[str, FolderRecorder] = {}
        self.stopping = False
        self.frames_cut = 0
        self.last_registry_read = 0.0

    def request_stop(self, *_args) -> None:
        self.stopping = True

    # -- which folders -------------------------------------------------

    def reload_folders(self) -> None:
        """Pick up folders protected (or forgotten) since the last look."""
        try:
            entries = registry.Registry.load().active()
        except ValueError as exc:
            self.log(f"registry unreadable: {exc}")
            return
        wanted = {}
        for entry in entries:
            if not entry.recorded:
                continue
            wanted[entry.path] = entry

        for path in list(self.recorders):
            if path not in wanted:
                self.recorders.pop(path).close()
                self.log(f"stopped recording {path}")

        for path, entry in wanted.items():
            if path in self.recorders:
                continue
            try:
                repo = Repo.open(entry.folder, entry.vault_dir)
            except Exception as exc:
                self.log(f"cannot record {path}: {exc}")
                continue
            recorder = FolderRecorder(repo, self.settle, self.log)
            recorder.open_notifier()
            self.recorders[path] = recorder
            self.log(f"recording {path} - {recorder.describe()}")

    # -- the loop ------------------------------------------------------

    def run(self) -> int:
        self.reload_folders()
        if not self.recorders:
            self.log("no folders are protected yet - 'rewind protect <folder>' adds one")

        try:
            while not self.stopping:
                now = time.time()
                if now - self.last_registry_read >= REGISTRY_POLL:
                    self.reload_folders()
                    self.last_registry_read = now

                triggered = self._wait(min(self.interval, 1.0))
                now = time.time()
                for path, recorder in list(self.recorders.items()):
                    waiting = recorder.pending_since is not None
                    if not (path in triggered or waiting
                            or recorder.due(now, self.interval)):
                        continue
                    frame = recorder.check(now)
                    if frame:
                        self.frames_cut += 1
                        self.log(f"  {Path(path).name}/{frame.id}  +{frame.added} "
                                 f"~{frame.modified} -{frame.deleted}"
                                 + (f"  {frame.note}" if frame.note else ""))
                    recorder.sync_watches(now)
        finally:
            for recorder in self.recorders.values():
                frame = recorder.final_frame("recorder stopping")
                if frame:
                    self.frames_cut += 1
                recorder.close()
            self.recorders.clear()
        return self.frames_cut

    def _wait(self, timeout: float) -> set[str]:
        """Wait on every folder's inotify descriptor at once."""
        fds = {}
        for path, recorder in self.recorders.items():
            fd = recorder.fd
            if fd is not None:
                fds[fd] = path
        if not fds:
            time.sleep(min(max(0.05, timeout), 1.0))
            return set()
        try:
            ready, _, _ = select.select(list(fds), [], [], timeout)
        except (OSError, ValueError):
            time.sleep(timeout)
            return set()
        woken = set()
        for fd in ready:
            path = fds[fd]
            recorder = self.recorders.get(path)
            if recorder is not None and recorder.notifier is not None:
                recorder.notifier.wait(0)
                woken.add(path)
        return woken


# -- background processes ----------------------------------------------------

def pid_file(repo: Repo) -> Path:
    return repo.dir / "watcher.pid"


def log_file(repo: Repo) -> Path:
    return repo.dir / "watcher.log"


def service_pid_file() -> Path:
    return registry.home() / "service.pid"


def service_log_file() -> Path:
    return registry.home() / "service.log"


def _pid_in(path: Path) -> int | None:
    try:
        pid = int(path.read_text().strip())
    except (FileNotFoundError, ValueError, OSError):
        return None
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        path.unlink(missing_ok=True)
        return None
    except PermissionError:
        return pid
    return pid


def running_pid(repo: Repo) -> int | None:
    return _pid_in(pid_file(repo))


def service_running_pid() -> int | None:
    return _pid_in(service_pid_file())


def _daemonize(pid_path: Path, log_path: Path, body) -> int:
    """Fork twice, claim the pid file, and run ``body(log)`` detached."""
    existing = _pid_in(pid_path)
    if existing:
        raise RuntimeError(f"already recording (pid {existing})")
    pid_path.parent.mkdir(parents=True, exist_ok=True)

    middle = os.fork()
    if middle != 0:
        # The middle process forks again and exits at once; reap it here so it
        # does not linger as a zombie.
        try:
            os.waitpid(middle, 0)
        except ChildProcessError:
            pass
        for _ in range(60):
            time.sleep(0.05)
            pid = _pid_in(pid_path)
            if pid:
                return pid
        raise RuntimeError(f"the recorder did not come up - see {log_path}")

    os.setsid()
    if os.fork() != 0:
        os._exit(0)

    pid_path.write_text(f"{os.getpid()}\n")
    logfh = open(log_path, "a", buffering=1, encoding="utf-8")
    devnull = os.open(os.devnull, os.O_RDWR)
    os.dup2(devnull, 0)
    os.dup2(logfh.fileno(), 1)
    os.dup2(logfh.fileno(), 2)

    def stamped(msg: str) -> None:
        logfh.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")

    try:
        body(stamped)
    except Exception as exc:  # the log is the only place this can be seen
        stamped(f"recorder stopped with an error: {exc!r}")
    finally:
        pid_path.unlink(missing_ok=True)
        stamped("recorder stopped")
    os._exit(0)


def _stop(pid_path: Path, timeout: float = 10.0) -> bool:
    pid = _pid_in(pid_path)
    if not pid:
        return False
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        pid_path.unlink(missing_ok=True)
        return False
    deadline = time.time() + timeout
    while time.time() < deadline:
        if _pid_in(pid_path) is None:
            return True
        time.sleep(0.1)
    try:
        os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    pid_path.unlink(missing_ok=True)
    return True


def start_daemon(repo: Repo, interval: float | None = None,
                 settle: float | None = None) -> int:
    """Record one folder in the background."""
    def body(log):
        watcher = Watcher(repo, interval, settle, log=log)
        signal.signal(signal.SIGTERM, watcher.request_stop)
        signal.signal(signal.SIGINT, watcher.request_stop)
        watcher.run()

    return _daemonize(pid_file(repo), log_file(repo), body)


def stop_daemon(repo: Repo, timeout: float = 10.0) -> bool:
    return _stop(pid_file(repo), timeout)


def start_service(interval: float | None = None,
                  settle: float | None = None) -> int:
    """Record every protected folder in the background."""
    def body(log):
        service = Service(interval, settle, log=log)
        signal.signal(signal.SIGTERM, service.request_stop)
        signal.signal(signal.SIGINT, service.request_stop)
        service.run()

    return _daemonize(service_pid_file(), service_log_file(), body)


def stop_service(timeout: float = 10.0) -> bool:
    return _stop(service_pid_file(), timeout)


def ensure_service(interval: float | None = None) -> int | None:
    """Start the recorder unless it is already running. Returns its pid."""
    pid = service_running_pid()
    if pid:
        return pid
    try:
        return start_service(interval)
    except RuntimeError:
        return service_running_pid()
