import os
import tempfile
import unittest
from pathlib import Path

from rewind import registry


class RegistryTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.previous_home = os.environ.get("REWIND_HOME")
        os.environ["REWIND_HOME"] = str(self.root / "rewind-home")
        (self.root / "alpha").mkdir()
        (self.root / "alpha" / "inner").mkdir()
        (self.root / "beta").mkdir()

    def tearDown(self):
        if self.previous_home is None:
            os.environ.pop("REWIND_HOME", None)
        else:
            os.environ["REWIND_HOME"] = self.previous_home
        self.tmp.cleanup()


class LocationTests(RegistryTestCase):
    def test_home_follows_the_environment(self):
        self.assertEqual(registry.home(), (self.root / "rewind-home").resolve())

    def test_vault_names_are_readable_and_stable(self):
        first = registry.vault_for(self.root / "alpha")
        second = registry.vault_for(self.root / "alpha")
        self.assertEqual(first, second)
        self.assertTrue(first.name.startswith("alpha-"))
        self.assertNotEqual(first, registry.vault_for(self.root / "beta"))

    def test_folders_with_the_same_name_get_different_vaults(self):
        (self.root / "beta" / "alpha").mkdir()
        self.assertNotEqual(registry.vault_for(self.root / "alpha"),
                            registry.vault_for(self.root / "beta" / "alpha"))


class PersistenceTests(RegistryTestCase):
    def test_round_trip(self):
        reg = registry.Registry()
        reg.add(self.root / "alpha")
        reg.add(self.root / "beta")
        reg.save()

        reloaded = registry.Registry.load()
        self.assertEqual([e.path for e in reloaded.sorted()],
                         [str(self.root / "alpha"), str(self.root / "beta")])

    def test_missing_registry_is_simply_empty(self):
        self.assertEqual(registry.Registry.load().entries, [])

    def test_a_corrupt_registry_is_explained(self):
        registry.registry_path().parent.mkdir(parents=True, exist_ok=True)
        registry.registry_path().write_text("{not json")
        with self.assertRaises(ValueError) as ctx:
            registry.Registry.load()
        self.assertIn("not valid JSON", str(ctx.exception))

    def test_adding_the_same_folder_twice_is_one_entry(self):
        reg = registry.Registry()
        first = reg.add(self.root / "alpha")
        second = reg.add(self.root / "alpha")
        self.assertIs(first, second)
        self.assertEqual(len(reg.entries), 1)


class LookupTests(RegistryTestCase):
    def setUp(self):
        super().setUp()
        self.reg = registry.Registry()
        self.reg.add(self.root / "alpha")
        self.reg.add(self.root / "beta")

    def test_covering_finds_the_folder_you_are_standing_in(self):
        entry = self.reg.covering(self.root / "alpha" / "inner" / "deep.txt")
        self.assertEqual(entry.path, str(self.root / "alpha"))

    def test_covering_prefers_the_innermost_folder(self):
        self.reg.add(self.root / "alpha" / "inner")
        entry = self.reg.covering(self.root / "alpha" / "inner" / "x.txt")
        self.assertEqual(entry.path, str(self.root / "alpha" / "inner"))

    def test_covering_returns_nothing_outside_every_folder(self):
        self.assertIsNone(self.reg.covering(self.root))

    def test_inside_of_lists_nested_folders(self):
        nested = self.reg.inside_of(self.root)
        self.assertEqual(len(nested), 2)
        self.assertEqual(self.reg.inside_of(self.root / "alpha"), [])

    def test_active_skips_paused_and_missing_folders(self):
        self.reg.add(self.root / "gone")
        self.reg.get(self.root / "beta").paused = True
        self.assertEqual([e.path for e in self.reg.active()],
                         [str(self.root / "alpha")])

    def test_remove(self):
        self.assertIsNotNone(self.reg.remove(self.root / "alpha"))
        self.assertIsNone(self.reg.get(self.root / "alpha"))
        self.assertIsNone(self.reg.remove(self.root / "alpha"))


class RefusalTests(RegistryTestCase):
    def test_the_system_itself_is_refused(self):
        for path in ("/", "/proc", "/sys", "/dev"):
            self.assertIsNotNone(registry.refuses(Path(path)), path)

    def test_a_missing_folder_is_refused(self):
        self.assertIn("does not exist", registry.refuses(self.root / "nope"))

    def test_a_file_is_refused(self):
        target = self.root / "a.txt"
        target.write_text("x")
        self.assertIn("not a folder", registry.refuses(target))

    def test_an_ordinary_folder_is_fine(self):
        self.assertIsNone(registry.refuses(self.root / "alpha"))

    def test_a_folder_holding_rewinds_own_storage_is_fine(self):
        # The vaults are pruned while scanning, so this is allowed.
        registry.home().mkdir(parents=True, exist_ok=True)
        self.assertIsNone(registry.refuses(self.root))
