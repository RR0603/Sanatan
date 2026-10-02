import io
import os
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path

from rewind.cli import main


class CliTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "notes").mkdir()
        (self.root / "notes" / "a.txt").write_text("alpha")
        (self.root / "readme.md").write_text("readme")
        self.previous_cwd = os.getcwd()
        os.chdir(self.root)
        self.run_cli("init", ".")

    def tearDown(self):
        os.chdir(self.previous_cwd)
        self.tmp.cleanup()

    def run_cli(self, *argv):
        """Run a command, returning (exit code, output)."""
        out = io.StringIO()
        with redirect_stdout(out), redirect_stderr(out):
            code = main(["--root", str(self.root), *argv])
        return code, out.getvalue()


class BasicCommandTests(CliTestCase):
    def test_status_reports_pending_changes(self):
        (self.root / "notes" / "a.txt").write_text("changed")
        code, out = self.run_cli("status")
        self.assertEqual(code, 0)
        self.assertIn("notes/a.txt", out)

    def test_status_json(self):
        import json
        (self.root / "new.txt").write_text("x")
        code, out = self.run_cli("status", "--json")
        data = json.loads(out)
        self.assertEqual(code, 0)
        self.assertEqual(data["head"], "f00001")
        self.assertEqual([c["path"] for c in data["pending"]], ["new.txt"])

    def test_timeline_marks_the_playhead(self):
        code, out = self.run_cli("timeline")
        self.assertEqual(code, 0)
        self.assertIn("f00001", out)
        self.assertIn("you are here", out)

    def test_snap_with_a_message(self):
        (self.root / "new.txt").write_text("x")
        code, out = self.run_cli("snap", "-m", "my checkpoint")
        self.assertEqual(code, 0)
        self.assertIn("my checkpoint", out)
        _, timeline = self.run_cli("timeline")
        self.assertIn("my checkpoint", timeline)

    def test_snap_says_so_when_nothing_changed(self):
        _, out = self.run_cli("snap")
        self.assertIn("nothing has changed", out)

    def test_diff_against_now(self):
        (self.root / "readme.md").write_text("different")
        code, out = self.run_cli("diff")
        self.assertEqual(code, 0)
        self.assertIn("readme.md", out)

    def test_show_lists_what_a_frame_changed(self):
        (self.root / "new.txt").write_text("x")
        self.run_cli("snap", "-m", "added one")
        code, out = self.run_cli("show", "f00002")
        self.assertEqual(code, 0)
        self.assertIn("new.txt", out)

    def test_verify_passes_on_a_healthy_repo(self):
        code, out = self.run_cli("verify")
        self.assertEqual(code, 0)
        self.assertIn("can be restored", out)

    def test_unknown_folder_is_explained_not_traced(self):
        with tempfile.TemporaryDirectory() as empty:
            out = io.StringIO()
            with redirect_stdout(out), redirect_stderr(out):
                code = main(["--root", empty, "status"])
            self.assertEqual(code, 2)
            self.assertIn("rewind protect", out.getvalue())


class UndoTests(CliTestCase):
    def test_undo_brings_back_a_deleted_folder(self):
        self.run_cli("snap", "-m", "good state")
        shutil.rmtree(self.root / "notes")
        code, out = self.run_cli("undo", "-y")
        self.assertEqual(code, 0)
        self.assertEqual((self.root / "notes" / "a.txt").read_text(), "alpha")

    def test_undo_then_redo_returns_to_the_mistake(self):
        shutil.rmtree(self.root / "notes")
        self.run_cli("undo", "-y")
        self.assertTrue((self.root / "notes").exists())
        code, _ = self.run_cli("redo", "-y")
        self.assertEqual(code, 0)
        self.assertFalse((self.root / "notes").exists())

    def test_undo_counts_more_than_one_step(self):
        (self.root / "one").write_text("1")
        self.run_cli("snap")
        (self.root / "two").write_text("2")
        self.run_cli("snap")
        self.run_cli("undo", "2", "-y")
        self.assertFalse((self.root / "one").exists())
        self.assertFalse((self.root / "two").exists())

    def test_undo_dry_run_changes_nothing(self):
        shutil.rmtree(self.root / "notes")
        code, out = self.run_cli("undo", "--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("nothing was changed", out)
        self.assertFalse((self.root / "notes").exists())

    def test_undo_at_the_start_says_so(self):
        code, out = self.run_cli("undo", "-y")
        self.assertEqual(code, 0)
        self.assertIn("oldest frame", out)

    def test_back_accepts_a_duration(self):
        (self.root / "later.txt").write_text("x")
        self.run_cli("snap")
        code, out = self.run_cli("back", "1h", "-y")
        self.assertEqual(code, 0)
        self.assertFalse((self.root / "later.txt").exists())

    def test_back_to_a_frame_id(self):
        (self.root / "later.txt").write_text("x")
        self.run_cli("snap")
        code, _ = self.run_cli("back", "f00001", "-y")
        self.assertEqual(code, 0)
        self.assertFalse((self.root / "later.txt").exists())

    def test_back_to_an_unknown_frame_is_explained(self):
        code, out = self.run_cli("back", "f09999", "-y")
        self.assertEqual(code, 2)
        self.assertIn("no frame", out)

    def test_nothing_is_ever_lost_by_a_rewind(self):
        (self.root / "unsaved.txt").write_text("precious")
        self.run_cli("back", "f00001", "-y")
        self.assertFalse((self.root / "unsaved.txt").exists())
        self.run_cli("redo", "-y")
        self.assertEqual((self.root / "unsaved.txt").read_text(), "precious")


class RestoreTests(CliTestCase):
    def test_restore_a_folder_without_touching_the_rest(self):
        self.run_cli("snap", "-m", "good")
        shutil.rmtree(self.root / "notes")
        (self.root / "readme.md").write_text("new work worth keeping")
        self.run_cli("snap", "-m", "mixed")
        code, out = self.run_cli("restore", "notes", "-y")
        self.assertEqual(code, 0)
        self.assertEqual((self.root / "notes" / "a.txt").read_text(), "alpha")
        self.assertEqual((self.root / "readme.md").read_text(), "new work worth keeping")

    def test_restore_a_single_file_at_a_chosen_frame(self):
        (self.root / "notes" / "a.txt").write_text("second")
        self.run_cli("snap")
        (self.root / "notes" / "a.txt").write_text("third")
        self.run_cli("snap")
        code, _ = self.run_cli("restore", "notes/a.txt", "--at", "f00001", "-y")
        self.assertEqual(code, 0)
        self.assertEqual((self.root / "notes" / "a.txt").read_text(), "alpha")

    def test_restore_dry_run_changes_nothing(self):
        shutil.rmtree(self.root / "notes")
        code, out = self.run_cli("restore", "notes", "--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("nothing was changed", out)
        self.assertFalse((self.root / "notes").exists())

    def test_restoring_something_never_recorded_is_explained(self):
        code, out = self.run_cli("restore", "imaginary", "-y")
        self.assertEqual(code, 2)
        self.assertIn("does not appear", out)

    def test_restoring_a_path_outside_the_repo_is_refused(self):
        code, out = self.run_cli("restore", "/etc", "-y")
        self.assertEqual(code, 2)
        self.assertIn("outside", out)

    def test_restore_whole_tree_points_at_back(self):
        code, out = self.run_cli("restore", ".", "-y")
        self.assertEqual(code, 2)
        self.assertIn("rewind back", out)


class HistoryAndHousekeepingTests(CliTestCase):
    def test_timeline_for_one_path(self):
        (self.root / "notes" / "a.txt").write_text("edited")
        self.run_cli("snap", "-m", "touched notes")
        (self.root / "readme.md").write_text("elsewhere")
        self.run_cli("snap", "-m", "touched readme")
        code, out = self.run_cli("timeline", "--path", "notes")
        self.assertEqual(code, 0)
        self.assertIn("f00002", out)
        self.assertNotIn("f00003", out)

    def test_gc_dry_run_reports_without_removing(self):
        code, out = self.run_cli("gc", "--dry-run", "--days", "0")
        self.assertEqual(code, 0)
        self.assertIn("would drop", out)
        self.assertEqual(self.run_cli("verify")[0], 0)

    def test_hook_prints_shell_code(self):
        for shell in ("bash", "zsh", "fish"):
            code, out = self.run_cli("hook", shell)
            self.assertEqual(code, 0)
            self.assertIn("rewind mark", out)

    def test_mark_leaves_a_note_for_the_next_frame(self):
        self.run_cli("mark", "--", "rm", "-rf", "something")
        note = (self.root / ".rewind" / "next-note").read_text()
        self.assertEqual(note, "rm -rf something")

    def test_mark_ignores_rewind_s_own_commands(self):
        self.run_cli("mark", "--", "rewind", "undo")
        self.assertFalse((self.root / ".rewind" / "next-note").exists())
