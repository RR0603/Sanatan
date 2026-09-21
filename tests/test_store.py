import os
import tempfile
import unittest
from pathlib import Path

from rewind.store import BlobStore


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.store = BlobStore(self.root / "objects")

    def tearDown(self):
        self.tmp.cleanup()

    def test_roundtrip(self):
        src = self.root / "a.txt"
        src.write_bytes(b"hello world" * 1000)
        digest, size = self.store.put_path(src)
        self.assertEqual(size, 11000)
        self.assertTrue(self.store.has(digest))
        self.assertEqual(self.store.read(digest), b"hello world" * 1000)

    def test_identical_content_stored_once(self):
        (self.root / "a").write_text("same")
        (self.root / "b").write_text("same")
        first, _ = self.store.put_path(self.root / "a")
        second, _ = self.store.put_path(self.root / "b")
        self.assertEqual(first, second)
        self.assertEqual(len(list(self.store.iter_digests())), 1)

    def test_extract_restores_bytes_mode_and_mtime(self):
        src = self.root / "script.sh"
        src.write_text("#!/bin/sh\necho hi\n")
        digest, _ = self.store.put_path(src)
        dest = self.root / "out" / "script.sh"
        self.store.extract(digest, dest, mode=0o750, mtime=1_000_000.0)
        self.assertEqual(dest.read_text(), "#!/bin/sh\necho hi\n")
        self.assertEqual(os.stat(dest).st_mode & 0o777, 0o750)
        self.assertAlmostEqual(os.stat(dest).st_mtime, 1_000_000.0, places=0)

    def test_extract_over_an_existing_file_replaces_it(self):
        digest, _ = self.store.put_bytes(b"new")
        dest = self.root / "x"
        dest.write_text("old")
        self.store.extract(digest, dest)
        self.assertEqual(dest.read_bytes(), b"new")

    def test_missing_blob_is_reported(self):
        with self.assertRaises(KeyError):
            self.store.extract("0" * 64, self.root / "nope")

    def test_remove_frees_the_blob(self):
        digest, _ = self.store.put_bytes(b"x" * 100)
        self.assertGreater(self.store.remove(digest), 0)
        self.assertFalse(self.store.has(digest))
        self.assertEqual(self.store.remove(digest), 0)

    def test_empty_file(self):
        (self.root / "empty").write_bytes(b"")
        digest, size = self.store.put_path(self.root / "empty")
        self.assertEqual(size, 0)
        self.assertEqual(self.store.read(digest), b"")
