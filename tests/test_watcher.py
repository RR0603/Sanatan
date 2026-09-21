import os
import shutil
import tempfile
import time
import unittest
from pathlib import Path

from rewind import inotify, watcher
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
