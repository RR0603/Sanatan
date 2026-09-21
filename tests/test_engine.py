import os
import tempfile
import time
import unittest
from pathlib import Path

from rewind.engine import Repo, RewindError, build_plan, diff_manifests


class RepoTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "notes").mkdir()
        (self.root / "notes" / "a.txt").write_text("alpha")
        (self.root / "notes" / "b.txt").write_text("beta")
        (self.root / "readme.md").write_text("readme")
        self.repo = Repo.init(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def files(self):
        out = {}
        for path in sorted(self.root.rglob("*")):
            if ".rewind" in path.parts:
                continue
            rel = str(path.relative_to(self.root))
            out[rel] = path.read_text() if path.is_file() else "<dir>"
        return out


class DiffTests(unittest.TestCase):
    def test_reports_each_kind_of_change(self):
        old = {"same": {"t": "f", "h": "1", "m": 0o644},
               "edited": {"t": "f", "h": "1", "m": 0o644},
               "gone": {"t": "f", "h": "2", "m": 0o644},
               "perm": {"t": "f", "h": "3", "m": 0o644}}
        new = {"same": {"t": "f", "h": "1", "m": 0o644},
               "edited": {"t": "f", "h": "9", "m": 0o644},
               "fresh": {"t": "f", "h": "4", "m": 0o644},
               "perm": {"t": "f", "h": "3", "m": 0o755}}
        ops = {c.path: c.op for c in diff_manifests(old, new)}
        self.assertEqual(ops, {"edited": "modify", "gone": "delete",
                               "fresh": "add", "perm": "chmod"})

    def test_type_change_is_a_retype(self):
        changes = diff_manifests({"x": {"t": "f", "h": "1"}}, {"x": {"t": "d", "m": 0o755}})
        self.assertEqual(changes[0].op, "retype")

    def test_symlink_target_change(self):
        changes = diff_manifests({"l": {"t": "l", "to": "a"}}, {"l": {"t": "l", "to": "b"}})
        self.assertEqual((changes[0].op, changes[0].kind), ("modify", "l"))


class PlanTests(unittest.TestCase):
    def test_subtree_limits_what_is_touched(self):
        current = {"keep.txt": {"t": "f", "h": "1", "m": 0o644},
                   "dir": {"t": "d", "m": 0o755},
                   "dir/x.txt": {"t": "f", "h": "2", "m": 0o644}}
        target = {"keep.txt": {"t": "f", "h": "OTHER", "m": 0o644},
                  "dir": {"t": "d", "m": 0o755},
                  "dir/x.txt": {"t": "f", "h": "TARGET", "m": 0o644}}
        plan = build_plan(current, target, subtree="dir")
        self.assertEqual([p for p, _ in plan.writes], ["dir/x.txt"])

    def test_deepest_paths_are_removed_first(self):
        current = {"a": {"t": "d", "m": 0o755},
                   "a/b": {"t": "d", "m": 0o755},
                   "a/b/c.txt": {"t": "f", "h": "1", "m": 0o644}}
        plan = build_plan(current, {})
        self.assertEqual([p for p, _ in plan.removals], ["a/b/c.txt", "a/b", "a"])

    def test_oversized_file_that_cannot_return_is_flagged(self):
        target = {"big.bin": {"t": "f", "h": None, "big": True, "s": 99, "m": 0o644}}
        plan = build_plan({}, target)
        self.assertEqual(plan.writes, [])
        self.assertIn("cannot be restored", plan.warnings[0])


class CommitTests(RepoTestCase):
    def test_init_captures_everything(self):
        manifest = self.repo.timeline.load_manifest(1)
        self.assertEqual(set(manifest), {"notes", "notes/a.txt", "notes/b.txt", "readme.md"})

    def test_commit_is_skipped_when_nothing_changed(self):
        self.assertIsNone(self.repo.commit())

    def test_commit_counts_changes(self):
        (self.root / "notes" / "a.txt").write_text("ALPHA")
        (self.root / "new.txt").write_text("new")
        (self.root / "readme.md").unlink()
        frame = self.repo.commit(label="test")
        self.assertEqual((frame.added, frame.modified, frame.deleted), (1, 1, 1))
        self.assertEqual(frame.prev, 1)


class TravelTests(RepoTestCase):
    def test_deleted_folder_comes_back_whole(self):
        before = self.files()
        import shutil
        shutil.rmtree(self.root / "notes")
        self.repo.commit(label="mistake")
        self.repo.seek(1)
        self.assertEqual(self.files(), before)

    def test_rewinding_is_itself_reversible(self):
        (self.root / "notes" / "a.txt").write_text("version two")
        frame = self.repo.commit()
        self.repo.seek(1)
        self.assertEqual((self.root / "notes" / "a.txt").read_text(), "alpha")
        self.repo.seek(frame.seq)
        self.assertEqual((self.root / "notes" / "a.txt").read_text(), "version two")

    def test_unrecorded_work_is_kept_before_a_rewind(self):
        (self.root / "unsaved.txt").write_text("precious")
        _, _, safety = self.repo.seek(1)
        self.assertIsNotNone(safety)
        self.assertFalse((self.root / "unsaved.txt").exists())
        self.repo.seek(safety.seq)
        self.assertEqual((self.root / "unsaved.txt").read_text(), "precious")

    def test_dry_run_changes_nothing(self):
        (self.root / "notes" / "a.txt").write_text("changed")
        self.repo.commit()
        plan, report, safety = self.repo.seek(1, dry_run=True)
        self.assertIsNone(report)
        self.assertIsNone(safety)
        self.assertFalse(plan.empty)
        self.assertEqual((self.root / "notes" / "a.txt").read_text(), "changed")

    def test_folder_only_rewind_leaves_the_rest_alone(self):
        (self.root / "notes" / "a.txt").write_text("wrecked")
        (self.root / "readme.md").write_text("wrecked too")
        self.repo.commit()
        self.repo.seek(1, subtree="notes")
        self.assertEqual((self.root / "notes" / "a.txt").read_text(), "alpha")
        self.assertEqual((self.root / "readme.md").read_text(), "wrecked too")

    def test_file_permissions_are_restored(self):
        target = self.root / "notes" / "a.txt"
        os.chmod(target, 0o600)
        frame = self.repo.commit()
        os.chmod(target, 0o644)
        self.repo.commit()
        self.repo.seek(frame.seq)
        self.assertEqual(os.stat(target).st_mode & 0o777, 0o600)

    def test_symlinks_survive_a_round_trip(self):
        os.symlink("notes/a.txt", self.root / "link")
        frame = self.repo.commit()
        os.unlink(self.root / "link")
        self.repo.commit()
        self.repo.seek(frame.seq)
        self.assertTrue((self.root / "link").is_symlink())
        self.assertEqual(os.readlink(self.root / "link"), "notes/a.txt")

    def test_a_file_replaced_by_a_folder_can_be_reversed(self):
        frame = self.repo.commit(force=True)
        (self.root / "readme.md").unlink()
        (self.root / "readme.md").mkdir()
        (self.root / "readme.md" / "inside.txt").write_text("surprise")
        self.repo.commit()
        self.repo.seek(frame.seq)
        self.assertTrue((self.root / "readme.md").is_file())
        self.assertEqual((self.root / "readme.md").read_text(), "readme")

    def test_untracked_content_is_not_deleted_by_a_rewind(self):
        frame = self.repo.commit(force=True)
        junk = self.root / "notes" / "__pycache__"
        junk.mkdir()
        (junk / "x.pyc").write_text("compiled")
        self.repo.seek(frame.seq)
        self.assertTrue((junk / "x.pyc").exists())

    def test_seeking_an_unknown_frame_is_refused(self):
        with self.assertRaises(RewindError):
            self.repo.seek(999)


class NavigationTests(RepoTestCase):
    def test_undo_walks_back_along_the_branch_it_came_from(self):
        (self.root / "f1").write_text("1")
        a = self.repo.commit()
        (self.root / "f2").write_text("2")
        b = self.repo.commit()
        self.assertEqual(self.repo.step(-1), a.seq)
        self.assertEqual(self.repo.step(-1, 2), 1)
        self.assertEqual(self.repo.parent_of(b.seq), a.seq)

    def test_redo_returns_to_the_newest_branch(self):
        (self.root / "f1").write_text("1")
        a = self.repo.commit()
        self.repo.seek(1)
        self.assertEqual(self.repo.timeline.head(), 1)
        self.assertEqual(self.repo.step(+1), a.seq)

    def test_work_after_a_rewind_starts_a_branch_and_undo_follows_it(self):
        (self.root / "old-branch").write_text("x")
        self.repo.commit()
        self.repo.seek(1)
        (self.root / "new-branch").write_text("y")
        branched = self.repo.commit()
        self.assertEqual(branched.prev, 1)
        # Undo from the new branch goes to where that branch started, not to
        # the unrelated work that happened to be recorded later.
        self.assertEqual(self.repo.step(-1), 1)

    def test_stepping_past_the_ends_stops_there(self):
        self.repo.seek(1)
        self.assertEqual(self.repo.step(-1, 50), 1)
        newest = self.repo.timeline.latest().seq
        self.assertEqual(self.repo.step(+1, 50), newest)

    def test_frame_at_time_picks_the_last_frame_at_or_before(self):
        (self.root / "later").write_text("x")
        later = self.repo.commit()
        self.repo.timeline.frames[0].ts = time.time() - 3600
        later.ts = time.time() - 60
        self.assertEqual(self.repo.frame_at_time(time.time() - 600).seq, 1)
        self.assertEqual(self.repo.frame_at_time(time.time()).seq, later.seq)


class HistoryTests(RepoTestCase):
    def test_path_history_lists_only_frames_that_touched_it(self):
        (self.root / "notes" / "a.txt").write_text("edited")
        self.repo.commit()
        (self.root / "readme.md").write_text("elsewhere")
        self.repo.commit()
        history = self.repo.path_history("notes")
        self.assertEqual([f.seq for f, _ in history], [1, 2])


class HousekeepingTests(RepoTestCase):
    def test_verify_notices_a_missing_blob(self):
        self.assertEqual(self.repo.verify(), [])
        digest = self.repo.timeline.load_manifest(1)["readme.md"]["h"]
        self.repo.store.remove(digest)
        self.assertTrue(self.repo.verify())

    def test_gc_drops_old_frames_but_protects_the_important_ones(self):
        for i in range(6):
            (self.root / f"f{i}").write_text(str(i))
            self.repo.commit()
        named = self.repo.commit(label="keepme", force=True)
        for frame in self.repo.timeline.frames:
            frame.ts = time.time() - 90 * 86400
        self.repo.timeline.rewrite_index(self.repo.timeline.frames)
        head = self.repo.timeline.head()

        stats = self.repo.gc(keep_days=30, keep_last=2)
        kept = {f.seq for f in self.repo.timeline.frames}
        self.assertGreater(stats["frames_pruned"], 0)
        self.assertIn(1, kept)             # the first frame
        self.assertIn(head, kept)          # wherever the playhead is
        self.assertIn(named.seq, kept)     # anything the user named
        self.assertEqual(self.repo.verify(), [])

    def test_gc_keeps_blobs_that_surviving_frames_still_need(self):
        (self.root / "notes" / "a.txt").write_text("v2")
        self.repo.commit()
        self.repo.gc(keep_days=0, keep_last=1)
        self.assertEqual(self.repo.verify(), [])
        self.repo.seek(self.repo.timeline.frames[0].seq)

    def test_gc_dry_run_removes_nothing(self):
        for i in range(3):
            (self.root / f"g{i}").write_text(str(i))
            self.repo.commit()
        before = len(self.repo.timeline.frames)
        self.repo.gc(keep_days=0, keep_last=1, dry_run=True)
        self.assertEqual(len(self.repo.timeline.frames), before)
        self.assertEqual(self.repo.verify(), [])


class GuardTests(unittest.TestCase):
    def test_opening_an_unrecorded_folder_explains_itself(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(RewindError) as ctx:
                Repo.open(Path(tmp))
            self.assertIn("rewind init", str(ctx.exception))

    def test_initialising_twice_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            Repo.init(Path(tmp))
            with self.assertRaises(RewindError):
                Repo.init(Path(tmp))
