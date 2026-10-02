"""Protecting folders: whichever folder you select, reversible whenever."""

import io
import json
import os
import shutil
import tempfile
import time
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path

from rewind import registry, watcher
from rewind.cli import candidate_folders, main
from rewind.engine import Repo, RewindError


class ProtectTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name).resolve()
        self.previous_home = os.environ.get("REWIND_HOME")
        self.previous_cwd = os.getcwd()
        os.environ["REWIND_HOME"] = str(self.root / "rewind-home")

        self.alpha = self.root / "alpha"
        (self.alpha / "notes").mkdir(parents=True)
        (self.alpha / "notes" / "a.txt").write_text("alpha one")
        (self.alpha / "readme.md").write_text("keep me")

        self.beta = self.root / "beta"
        (self.beta / "docs").mkdir(parents=True)
        (self.beta / "docs" / "b.txt").write_text("beta one")

        # Deliberately stand outside every protected folder.
        os.chdir(self.root)

    def tearDown(self):
        try:
            watcher.stop_service()
        except Exception:
            pass
        os.chdir(self.previous_cwd)
        if self.previous_home is None:
            os.environ.pop("REWIND_HOME", None)
        else:
            os.environ["REWIND_HOME"] = self.previous_home
        self.tmp.cleanup()

    def run_cli(self, *argv):
        out = io.StringIO()
        with redirect_stdout(out), redirect_stderr(out):
            code = main(list(argv))
        return code, out.getvalue()

    def protect(self, folder, *extra):
        return self.run_cli("protect", str(folder), "--no-start", *extra)


class SelectingFoldersTests(ProtectTestCase):
    def test_protecting_registers_the_folder(self):
        code, out = self.protect(self.alpha)
        self.assertEqual(code, 0)
        entry = registry.Registry.load().get(self.alpha)
        self.assertIsNotNone(entry)
        self.assertTrue(entry.recorded)

    def test_history_is_kept_outside_the_folder_by_default(self):
        self.protect(self.alpha)
        self.assertFalse((self.alpha / ".rewind").exists())
        entry = registry.Registry.load().get(self.alpha)
        self.assertTrue(entry.vault_dir.is_dir())
        self.assertFalse(entry.inside)

    def test_inside_keeps_history_with_the_folder(self):
        self.protect(self.alpha, "--inside")
        self.assertTrue((self.alpha / ".rewind" / "timeline.jsonl").exists())
        self.assertTrue(registry.Registry.load().get(self.alpha).inside)

    def test_protecting_twice_is_harmless(self):
        self.protect(self.alpha)
        code, out = self.protect(self.alpha)
        self.assertEqual(code, 0)
        self.assertIn("already protected", out)
        self.assertEqual(len(registry.Registry.load().entries), 1)

    def test_several_folders_at_once(self):
        self.protect(self.alpha)
        self.protect(self.beta)
        self.assertEqual(len(registry.Registry.load().entries), 2)

    def test_a_nested_folder_is_refused_with_a_way_forward(self):
        self.protect(self.alpha)
        code, out = self.protect(self.alpha / "notes")
        self.assertEqual(code, 2)
        self.assertIn("already inside", out)
        self.assertIn("--in", out)

    def test_force_overrides_the_overlap_refusal(self):
        self.protect(self.alpha)
        code, _ = self.protect(self.alpha / "notes", "--force")
        self.assertEqual(code, 0)

    def test_a_folder_containing_protected_folders_is_refused(self):
        self.protect(self.alpha)
        code, out = self.protect(self.root)
        self.assertEqual(code, 2)
        self.assertIn("contains folders that are already protected", out)

    def test_the_system_itself_is_refused(self):
        code, out = self.protect(Path("/proc"))
        self.assertEqual(code, 2)
        self.assertIn("not a folder of your work", out)

    def test_a_missing_folder_is_refused(self):
        code, out = self.protect(self.root / "imaginary")
        self.assertEqual(code, 2)
        self.assertIn("does not exist", out)

    def test_candidate_folders_offers_here_and_its_children(self):
        options = candidate_folders(self.root)
        self.assertEqual(options[0], self.root)
        self.assertIn(self.alpha, options)
        self.assertIn(self.beta, options)

    def test_candidate_folders_skips_hidden_ones(self):
        (self.root / ".hidden").mkdir()
        self.assertNotIn((self.root / ".hidden").resolve(),
                         candidate_folders(self.root))


class ReversingFromAnywhereTests(ProtectTestCase):
    def test_a_protected_folder_is_found_from_a_nested_subfolder(self):
        self.protect(self.alpha)
        repo = Repo.for_path(self.alpha / "notes")
        self.assertEqual(repo.root, self.alpha)

    def test_undo_reaches_a_folder_you_are_not_standing_in(self):
        self.protect(self.alpha)
        shutil.rmtree(self.alpha / "notes")
        code, out = self.run_cli("undo", "--in", str(self.alpha), "-y")
        self.assertEqual(code, 0)
        self.assertEqual((self.alpha / "notes" / "a.txt").read_text(), "alpha one")

    def test_each_folder_reverses_independently(self):
        self.protect(self.alpha)
        self.protect(self.beta)
        shutil.rmtree(self.alpha / "notes")
        (self.beta / "docs" / "b.txt").write_text("beta changed")

        self.run_cli("undo", "--in", str(self.alpha), "-y")
        self.assertTrue((self.alpha / "notes" / "a.txt").exists())
        # Reversing alpha left beta exactly as it was.
        self.assertEqual((self.beta / "docs" / "b.txt").read_text(), "beta changed")

    def test_restore_a_folder_from_outside(self):
        self.protect(self.beta)
        shutil.rmtree(self.beta / "docs")
        code, _ = self.run_cli("restore", str(self.beta / "docs"),
                               "--in", str(self.beta), "-y")
        self.assertEqual(code, 0)
        self.assertEqual((self.beta / "docs" / "b.txt").read_text(), "beta one")

    def test_status_of_a_named_folder(self):
        self.protect(self.alpha)
        (self.alpha / "notes" / "a.txt").write_text("edited")
        code, out = self.run_cli("status", "--in", str(self.alpha), "--json")
        data = json.loads(out)
        self.assertEqual(code, 0)
        self.assertTrue(data["protected"])
        self.assertEqual([c["path"] for c in data["pending"]], ["notes/a.txt"])

    def test_an_unprotected_folder_says_how_to_protect_it(self):
        code, out = self.run_cli("status", "--in", str(self.beta))
        self.assertEqual(code, 2)
        self.assertIn("rewind protect", out)

    def test_reversing_works_even_though_nothing_was_recording(self):
        """The recorder was never started: the mistake is still reversible."""
        self.protect(self.alpha)
        (self.alpha / "notes" / "a.txt").write_text("wrecked")
        (self.alpha / "readme.md").unlink()
        code, _ = self.run_cli("undo", "--in", str(self.alpha), "-y")
        self.assertEqual(code, 0)
        self.assertEqual((self.alpha / "notes" / "a.txt").read_text(), "alpha one")
        self.assertEqual((self.alpha / "readme.md").read_text(), "keep me")


class VaultSafetyTests(ProtectTestCase):
    def test_rewinds_own_storage_is_never_recorded(self):
        """Protecting a folder that holds the vault must not record the vault."""
        registry.home().mkdir(parents=True, exist_ok=True)
        code, _ = self.protect(self.root, "--force")
        self.assertEqual(code, 0)
        repo = Repo.for_path(self.root)
        manifest = repo.timeline.load_manifest(repo.timeline.latest().seq)
        leaked = [p for p in manifest if p.startswith("rewind-home")]
        self.assertEqual(leaked, [])

    def test_an_inside_vault_is_never_recorded(self):
        self.protect(self.alpha, "--inside")
        repo = Repo.for_path(self.alpha)
        manifest = repo.timeline.load_manifest(repo.timeline.latest().seq)
        self.assertEqual([p for p in manifest if p.startswith(".rewind")], [])


class ShellHookTests(ProtectTestCase):
    def test_a_note_reaches_a_protected_folders_vault(self):
        self.protect(self.alpha)
        os.chdir(self.alpha / "notes")
        self.run_cli("mark", "--", "rm", "-rf", "notes")
        vault = registry.Registry.load().get(self.alpha).vault_dir
        self.assertEqual((vault / "next-note").read_text(), "rm -rf notes")

    def test_the_note_labels_the_next_frame(self):
        self.protect(self.alpha)
        os.chdir(self.alpha)
        self.run_cli("mark", "--", "rm", "-rf", "notes")
        shutil.rmtree(self.alpha / "notes")
        repo = Repo.for_path(self.alpha)
        recorder = watcher.FolderRecorder(repo, settle=0.0)
        frame = recorder.check(time.time(), force=True)
        self.assertEqual(frame.label, "command")
        self.assertEqual(frame.note, "rm -rf notes")

    def test_a_note_outside_every_recorded_folder_is_dropped_quietly(self):
        code, out = self.run_cli("mark", "--", "ls")
        self.assertEqual(code, 0)
        self.assertEqual(out, "")


class ForgettingTests(ProtectTestCase):
    def test_forget_keeps_the_history(self):
        self.protect(self.alpha)
        vault = registry.Registry.load().get(self.alpha).vault_dir
        code, out = self.run_cli("forget", str(self.alpha))
        self.assertEqual(code, 0)
        self.assertIsNone(registry.Registry.load().get(self.alpha))
        self.assertTrue(vault.is_dir())

    def test_protecting_again_picks_the_history_back_up(self):
        self.protect(self.alpha)
        (self.alpha / "notes" / "a.txt").write_text("second")
        self.run_cli("snap", "--in", str(self.alpha), "-m", "before forgetting")
        self.run_cli("forget", str(self.alpha))

        self.protect(self.alpha)
        repo = Repo.for_path(self.alpha)
        self.assertGreaterEqual(len(repo.timeline.frames), 2)
        # The old frame is still reversible.
        self.run_cli("back", "f00001", "--in", str(self.alpha), "-y")
        self.assertEqual((self.alpha / "notes" / "a.txt").read_text(), "alpha one")

    def test_delete_history_removes_the_vault(self):
        self.protect(self.alpha)
        vault = registry.Registry.load().get(self.alpha).vault_dir
        code, out = self.run_cli("forget", str(self.alpha), "--delete-history")
        self.assertEqual(code, 0)
        self.assertFalse(vault.exists())
        self.assertIn("cannot be undone", out)

    def test_forgetting_something_unprotected_is_explained(self):
        code, out = self.run_cli("forget", str(self.beta))
        self.assertEqual(code, 2)
        self.assertIn("is not protected", out)

    def test_forgetting_a_subfolder_points_at_the_real_one(self):
        self.protect(self.alpha)
        code, out = self.run_cli("forget", str(self.alpha / "notes"))
        self.assertEqual(code, 2)
        self.assertIn("Did you mean", out)


class ListTests(ProtectTestCase):
    def test_empty_list_explains_how_to_start(self):
        code, out = self.run_cli("list")
        self.assertEqual(code, 0)
        self.assertIn("No folders are protected", out)
        self.assertIn("rewind protect", out)

    def test_list_shows_each_folder(self):
        self.protect(self.alpha)
        self.protect(self.beta)
        code, out = self.run_cli("list")
        self.assertEqual(code, 0)
        self.assertIn(str(self.alpha), out)
        self.assertIn(str(self.beta), out)

    def test_list_json(self):
        self.protect(self.alpha)
        code, out = self.run_cli("list", "--json")
        data = json.loads(out)
        self.assertEqual(code, 0)
        self.assertEqual(len(data["folders"]), 1)
        self.assertEqual(data["folders"][0]["folder"], str(self.alpha))
        self.assertEqual(data["folders"][0]["frames"], 1)
        self.assertFalse(data["recording"])

    def test_list_marks_a_folder_that_has_gone_missing(self):
        self.protect(self.beta)
        shutil.rmtree(self.beta)
        code, out = self.run_cli("list")
        self.assertEqual(code, 0)
        self.assertIn("missing", out)


class AutostartTests(ProtectTestCase):
    def test_printing_the_service_file(self):
        code, out = self.run_cli("autostart")
        self.assertEqual(code, 0)
        self.assertIn("rewind", out)
        self.assertIn("service start --foreground", out)

    def test_installing_writes_a_file(self):
        fake_home = self.root / "fake-home"
        fake_home.mkdir()
        previous = os.environ.get("HOME")
        os.environ["HOME"] = str(fake_home)
        try:
            code, out = self.run_cli("autostart", "--install")
        finally:
            if previous is None:
                os.environ.pop("HOME", None)
            else:
                os.environ["HOME"] = previous
        self.assertIn("Wrote", out)
        unit = fake_home / ".config" / "systemd" / "user" / "rewind.service"
        plist = fake_home / "Library" / "LaunchAgents" / "com.rewind.recorder.plist"
        written = unit if unit.exists() else plist
        self.assertTrue(written.exists())
        self.assertIn("rewind", written.read_text())
