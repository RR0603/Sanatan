import os
import tempfile
import unittest
from pathlib import Path

from rewind.config import Config, Ignorer
from rewind.scanner import scan
from rewind.store import BlobStore


class IgnorerTests(unittest.TestCase):
    def test_name_matches_at_any_depth(self):
        ignorer = Ignorer(["node_modules", "*.pyc"])
        self.assertTrue(ignorer.match("node_modules", True))
        self.assertTrue(ignorer.match("src/node_modules", True))
        self.assertTrue(ignorer.match("a/b/c.pyc", False))
        self.assertFalse(ignorer.match("src/app.py", False))

    def test_directory_only_pattern(self):
        ignorer = Ignorer(["build/"])
        self.assertTrue(ignorer.match("build", True))
        self.assertFalse(ignorer.match("build", False))

    def test_path_pattern(self):
        ignorer = Ignorer(["src/generated"])
        self.assertTrue(ignorer.match("src/generated", True))
        self.assertTrue(ignorer.match("src/generated/x.py", False))
        self.assertFalse(ignorer.match("lib/generated", True))

    def test_comments_and_blanks_ignored(self):
        self.assertFalse(Ignorer(["", "  ", "# a comment"]).match("a", False))


class ScanTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.store = BlobStore(self.root / ".rewind" / "objects")
        self.cfg = Config()

    def tearDown(self):
        self.tmp.cleanup()

    def scan(self, previous=None):
        return scan(self.root, self.cfg, self.store, previous)

    def test_records_files_dirs_and_symlinks(self):
        (self.root / "dir").mkdir()
        (self.root / "dir" / "f.txt").write_text("content")
        os.symlink("dir/f.txt", self.root / "link")
        manifest = self.scan().manifest
        self.assertEqual(manifest["dir"]["t"], "d")
        self.assertEqual(manifest["dir/f.txt"]["t"], "f")
        self.assertEqual(manifest["dir/f.txt"]["s"], 7)
        self.assertEqual(manifest["link"], {"t": "l", "to": "dir/f.txt"})

    def test_rewind_directory_is_never_tracked(self):
        (self.root / ".rewind").mkdir(exist_ok=True)
        (self.root / ".rewind" / "secret").write_text("x")
        self.assertNotIn(".rewind", self.scan().manifest)

    def test_oversized_files_are_listed_but_not_stored(self):
        self.cfg.max_file_size = 10
        (self.root / "big.bin").write_bytes(b"0" * 100)
        result = self.scan()
        self.assertIsNone(result.manifest["big.bin"]["h"])
        self.assertTrue(result.manifest["big.bin"]["big"])
        self.assertEqual(result.skipped_big, ["big.bin"])

    def test_unchanged_files_reuse_the_recorded_hash(self):
        target = self.root / "old.txt"
        target.write_text("stable")
        first = self.scan().manifest
        os.utime(target, (1_000_000, 1_000_000))  # make it cold
        first["old.txt"]["mt"] = round(os.stat(target).st_mtime, 6)
        second = self.scan(previous=first).manifest
        self.assertEqual(first["old.txt"]["h"], second["old.txt"]["h"])

    def test_recently_touched_files_are_always_reread(self):
        target = self.root / "warm.txt"
        target.write_text("one")
        first = self.scan().manifest
        # Same size, forced identical mtime: only re-reading catches this.
        stat_before = os.stat(target)
        target.write_text("two")
        os.utime(target, (stat_before.st_atime, stat_before.st_mtime))
        second = self.scan(previous=first).manifest
        self.assertNotEqual(first["warm.txt"]["h"], second["warm.txt"]["h"])
        self.assertEqual(self.store.read(second["warm.txt"]["h"]), b"two")

    def test_unreadable_paths_are_reported_not_fatal(self):
        blocked = self.root / "blocked"
        blocked.mkdir()
        (blocked / "f").write_text("x")
        os.chmod(blocked, 0o000)
        try:
            result = self.scan()
        finally:
            os.chmod(blocked, 0o755)
        if os.geteuid() != 0:  # root can read it regardless
            self.assertTrue(result.errors)
