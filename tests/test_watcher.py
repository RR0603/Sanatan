import os
import shutil
import tempfile
import time
import unittest
from pathlib import Path

from rewind import inotify, registry, watcher
from rewind.config import Ignorer
from rewind.engine import Repo


class WatcherTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "a.txt").write_text("one")
        self.repo = Repo.init(self.root)
        self.logged = []

    def tearDown(self):
        watcher.stop_daemon(self.repo)
        self.tmp.cleanup()

    def make(self, **kwargs):
        return watcher.Watcher(self.repo, interval=0.1, settle=0.0,
                               log=self.logged.append, **kwargs)


class SingleShotTests(WatcherTestCase):
    def test_cuts_a_frame_for_pending_changes(self):
        (self.root / "b.txt").write_text("two")
        cut = self.make().run(once=True)
        self.assertEqual(cut, 1)
        self.assertEqual(self.repo.timeline.latest().added, 1)

    def test_cuts_nothing_when_nothing_changed(self):
        self.assertEqual(self.make().run(once=True), 0)
        self.assertEqual(len(self.repo.timeline.frames), 1)

    def test_records_a_deletion(self):
        (self.root / "a.txt").unlink()
        self.make().run(once=True)
        frame = self.repo.timeline.latest()
        self.assertEqual(frame.deleted, 1)
        # And the deletion is reversible.
        self.repo.seek(1)
        self.assertEqual((self.root / "a.txt").read_text(), "one")

    def test_uses_the_note_left_by_the_shell_hook(self):
        (self.repo.dir / "next-note").write_text("rm -rf a.txt")
        (self.root / "a.txt").unlink()
        self.make().run(once=True)
        frame = self.repo.timeline.latest()
        self.assertEqual(frame.label, "command")
        self.assertEqual(frame.note, "rm -rf a.txt")
        self.assertFalse((self.repo.dir / "next-note").exists())

    def test_a_final_frame_is_cut_when_the_recorder_stops(self):
        instance = self.make()
        instance.request_stop()
        (self.root / "late.txt").write_text("written just before stopping")
        self.assertEqual(instance.run(), 1)
        self.assertIn("late.txt", self.repo.timeline.load_manifest(
            self.repo.timeline.latest().seq))


class DaemonTests(WatcherTestCase):
    def test_start_records_and_stop(self):
        pid = watcher.start_daemon(self.repo, interval=0.2, settle=0.1)
        self.assertEqual(watcher.running_pid(self.repo), pid)

        (self.root / "while-running.txt").write_text("hello")
        deadline = time.time() + 15
        while time.time() < deadline:
            self.repo.timeline.reload()
            if len(self.repo.timeline.frames) > 1:
                break
            time.sleep(0.2)

        self.assertTrue(watcher.stop_daemon(self.repo))
        self.assertIsNone(watcher.running_pid(self.repo))

        self.repo.timeline.reload()
        self.assertGreater(len(self.repo.timeline.frames), 1)
        newest = self.repo.timeline.latest().seq
        self.assertIn("while-running.txt", self.repo.timeline.load_manifest(newest))

    def test_starting_twice_is_refused(self):
        watcher.start_daemon(self.repo, interval=0.2)
        with self.assertRaises(RuntimeError):
            watcher.start_daemon(self.repo, interval=0.2)

    def test_stopping_when_not_running_is_harmless(self):
        self.assertFalse(watcher.stop_daemon(self.repo))

    def test_a_stale_pid_file_does_not_block_a_restart(self):
        watcher.pid_file(self.repo).write_text("999999\n")
        self.assertIsNone(watcher.running_pid(self.repo))
        self.assertFalse(watcher.pid_file(self.repo).exists())


@unittest.skipUnless(os.uname().sysname == "Linux", "inotify is Linux-only")
class NotifierTests(WatcherTestCase):
    def test_reports_that_something_happened(self):
        notifier = inotify.try_open(self.root, Ignorer(self.repo.cfg.ignore))
        if notifier is None:
            self.skipTest("inotify is unavailable in this environment")
        try:
            self.assertFalse(notifier.wait(0.1))
            (self.root / "poke.txt").write_text("!")
            self.assertTrue(notifier.wait(2.0))
        finally:
            notifier.close()

    def test_new_folders_get_watched(self):
        notifier = inotify.try_open(self.root, Ignorer(self.repo.cfg.ignore))
        if notifier is None:
            self.skipTest("inotify is unavailable in this environment")
        try:
            before = len(notifier.watches)
            (self.root / "fresh").mkdir()
            notifier.wait(1.0)
            self.assertGreater(notifier.sync_watches(), before)
        finally:
            notifier.close()

    def test_ignored_folders_are_not_watched(self):
        (self.root / "node_modules").mkdir()
        notifier = inotify.try_open(self.root, Ignorer(self.repo.cfg.ignore))
        if notifier is None:
            self.skipTest("inotify is unavailable in this environment")
        try:
            watched = set(notifier.watches.values())
            self.assertNotIn(str(self.root / "node_modules"), watched)
            self.assertNotIn(str(self.repo.dir), watched)
        finally:
            notifier.close()


class ServiceTestCase(unittest.TestCase):
    """One recorder process, every protected folder."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name).resolve()
        self.previous_home = os.environ.get("REWIND_HOME")
        os.environ["REWIND_HOME"] = str(self.root / "rewind-home")
        self.logged = []
        self.alpha = self._folder("alpha")
        self.beta = self._folder("beta")

    def tearDown(self):
        watcher.stop_service()
        if self.previous_home is None:
            os.environ.pop("REWIND_HOME", None)
        else:
            os.environ["REWIND_HOME"] = self.previous_home
        self.tmp.cleanup()

    def _folder(self, name):
        folder = self.root / name
        folder.mkdir()
        (folder / "f.txt").write_text(f"{name} one")
        return folder

    def protect(self, folder):
        reg = registry.Registry.load()
        entry = reg.add(folder)
        Repo.init(folder, repo_dir=entry.vault_dir)
        reg.save()
        return entry

    def service(self):
        return watcher.Service(interval=0.1, settle=0.0, log=self.logged.append)

    def test_records_every_protected_folder(self):
        self.protect(self.alpha)
        self.protect(self.beta)
        service = self.service()
        service.reload_folders()
        self.assertEqual(len(service.recorders), 2)

        (self.alpha / "f.txt").write_text("alpha two")
        (self.beta / "new.txt").write_text("beta new")
        now = time.time()
        frames = {path: recorder.check(now, force=True)
                  for path, recorder in service.recorders.items()}
        self.assertTrue(all(frames.values()))
        self.assertEqual(frames[str(self.alpha)].modified, 1)
        self.assertEqual(frames[str(self.beta)].added, 1)
        for recorder in service.recorders.values():
            recorder.close()

    def test_a_folder_protected_later_is_picked_up(self):
        self.protect(self.alpha)
        service = self.service()
        service.reload_folders()
        self.assertEqual(len(service.recorders), 1)

        self.protect(self.beta)
        service.reload_folders()
        self.assertEqual(set(service.recorders), {str(self.alpha), str(self.beta)})
        for recorder in service.recorders.values():
            recorder.close()

    def test_a_forgotten_folder_is_dropped(self):
        self.protect(self.alpha)
        self.protect(self.beta)
        service = self.service()
        service.reload_folders()

        reg = registry.Registry.load()
        reg.remove(self.beta)
        reg.save()
        service.reload_folders()
        self.assertEqual(set(service.recorders), {str(self.alpha)})
        for recorder in service.recorders.values():
            recorder.close()

    def test_a_missing_folder_is_skipped_not_fatal(self):
        self.protect(self.alpha)
        self.protect(self.beta)
        shutil.rmtree(self.beta)
        service = self.service()
        service.reload_folders()
        self.assertEqual(set(service.recorders), {str(self.alpha)})
        for recorder in service.recorders.values():
            recorder.close()

    def test_no_protected_folders_is_not_an_error(self):
        service = self.service()
        service.reload_folders()
        self.assertEqual(service.recorders, {})

    def test_start_records_both_folders_and_stop(self):
        self.protect(self.alpha)
        self.protect(self.beta)
        pid = watcher.start_service(interval=0.2, settle=0.1)
        self.assertEqual(watcher.service_running_pid(), pid)

        (self.alpha / "live.txt").write_text("written while recording")
        (self.beta / "live.txt").write_text("written while recording")

        deadline = time.time() + 20
        seen = set()
        while time.time() < deadline and len(seen) < 2:
            for folder in (self.alpha, self.beta):
                entry = registry.Registry.load().get(folder)
                repo = Repo.open(folder, entry.vault_dir)
                repo.timeline.reload()
                newest = repo.timeline.latest()
                if "live.txt" in repo.timeline.load_manifest(newest.seq):
                    seen.add(str(folder))
            if len(seen) < 2:
                time.sleep(0.3)

        self.assertTrue(watcher.stop_service())
        self.assertIsNone(watcher.service_running_pid())
        self.assertEqual(seen, {str(self.alpha), str(self.beta)},
                         f"service log: {watcher.service_log_file().read_text()}")

    def test_ensure_service_is_idempotent(self):
        self.protect(self.alpha)
        first = watcher.ensure_service(interval=0.5)
        second = watcher.ensure_service(interval=0.5)
        self.assertEqual(first, second)
        self.assertTrue(watcher.stop_service())

    def test_starting_the_service_twice_is_refused(self):
        self.protect(self.alpha)
        watcher.start_service(interval=0.5)
        with self.assertRaises(RuntimeError):
            watcher.start_service(interval=0.5)
