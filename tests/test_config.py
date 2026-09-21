import os
import unittest
from unittest import mock

from helpers import make_config  # noqa: F401  (also fixes sys.path)

from briefing import config as config_module


class LoadConfigTests(unittest.TestCase):
    def test_missing_credentials_raise(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(config_module.ConfigError) as ctx:
                config_module.load()
        self.assertIn("TELEGRAM_BOT_TOKEN", str(ctx.exception))
        self.assertIn("TELEGRAM_CHAT_ID", str(ctx.exception))

    def test_dry_run_does_not_require_credentials(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            cfg = config_module.load(require_telegram=False)
        self.assertEqual(cfg.bot_token, "")
        self.assertEqual(cfg.timezone, "Asia/Kolkata")

    def test_values_are_parsed_and_trimmed(self):
        env = {
            "TELEGRAM_BOT_TOKEN": "  abc  ",
            "TELEGRAM_CHAT_ID": " 42 ",
            "BRIEFING_LAT": "19.07",
            "BRIEFING_LON": "72.87",
            "BRIEFING_SECTIONS": "weather, quote ,",
            "NEWS_LIMIT": "99",
        }
        with mock.patch.dict(os.environ, env, clear=True):
            cfg = config_module.load()
        self.assertEqual(cfg.bot_token, "abc")
        self.assertEqual(cfg.chat_id, "42")
        self.assertAlmostEqual(cfg.latitude, 19.07)
        self.assertEqual(cfg.sections, ("weather", "quote"))
        self.assertEqual(cfg.news_limit, 15, "news limit should be clamped")

    def test_bad_number_is_reported_clearly(self):
        env = {"TELEGRAM_BOT_TOKEN": "a", "TELEGRAM_CHAT_ID": "b", "BRIEFING_LAT": "north"}
        with mock.patch.dict(os.environ, env, clear=True):
            with self.assertRaises(config_module.ConfigError):
                config_module.load()

    def test_default_feeds_exist_without_the_environment(self):
        cfg = make_config()
        self.assertTrue(cfg.news_feeds, "a bare Config must still have a feed to read")

    def test_units_affect_temperature_request(self):
        cfg = make_config(units="imperial")
        self.assertEqual(cfg.temperature_unit, "fahrenheit")
        self.assertEqual(cfg.degree_suffix, "F")


if __name__ == "__main__":
    unittest.main()
