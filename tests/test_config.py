"""Configuration, news parsing, and end-to-end build tests (all offline)."""

import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest import mock

from brief import commands, config, main
from brief.sources import news


class TestConfigDefaults(unittest.TestCase):
    def test_defaults_without_a_file(self):
        cfg = config.load(path=Path("/nonexistent/config.json"), env={})
        self.assertEqual(cfg.location.name, "Delhi")
        self.assertEqual(cfg.location.timezone, "Asia/Kolkata")
        self.assertEqual(cfg.sections, config.KNOWN_SECTIONS)

    def test_secrets_read_from_env(self):
        cfg = config.load(
            path=Path("/nonexistent/config.json"),
            env={"TELEGRAM_BOT_TOKEN": " t ", "TELEGRAM_CHAT_ID": " 42 "},
        )
        self.assertEqual(cfg.bot_token, "t")
        self.assertEqual(cfg.chat_id, "42")

    def test_require_telegram_names_what_is_missing(self):
        cfg = config.load(path=Path("/nonexistent/config.json"), env={})
        with self.assertRaises(config.ConfigError) as ctx:
            cfg.require_telegram()
        self.assertIn("TELEGRAM_BOT_TOKEN", str(ctx.exception))
        self.assertIn("TELEGRAM_CHAT_ID", str(ctx.exception))

    def test_google_readiness_needs_all_three(self):
        base = {"TELEGRAM_BOT_TOKEN": "t", "TELEGRAM_CHAT_ID": "1"}
        partial = dict(base, GOOGLE_CLIENT_ID="a", GOOGLE_CLIENT_SECRET="b")
        self.assertFalse(
            config.load(path=Path("/nonexistent"), env=partial).google_calendar_ready
        )
        full = dict(partial, GOOGLE_REFRESH_TOKEN="c")
        self.assertTrue(
            config.load(path=Path("/nonexistent"), env=full).google_calendar_ready
        )


class TestConfigFile(unittest.TestCase):
    def _write(self, payload):
        tmp = Path(tempfile.mkdtemp()) / "config.json"
        tmp.write_text(json.dumps(payload), encoding="utf-8")
        return tmp

    def test_reads_location_and_sections(self):
        path = self._write(
            {
                "name": "Rahul",
                "location": {
                    "name": "Mumbai",
                    "latitude": 19.076,
                    "longitude": 72.8777,
                    "timezone": "Asia/Kolkata",
                },
                "sections": ["greeting", "panchang"],
                "news_limit": 3,
            }
        )
        cfg = config.load(path=path, env={})
        self.assertEqual(cfg.name, "Rahul")
        self.assertEqual(cfg.location.name, "Mumbai")
        self.assertAlmostEqual(cfg.location.latitude, 19.076)
        self.assertEqual(cfg.sections, ("greeting", "panchang"))
        self.assertEqual(cfg.news_limit, 3)

    def test_unknown_section_is_rejected(self):
        path = self._write({"sections": ["greeting", "horoscope"]})
        with self.assertRaises(config.ConfigError) as ctx:
            config.load(path=path, env={})
        self.assertIn("horoscope", str(ctx.exception))

    def test_bad_latitude_is_rejected(self):
        path = self._write({"location": {"latitude": 120.0}})
        with self.assertRaises(config.ConfigError):
            config.load(path=path, env={})

    def test_bad_timezone_is_rejected(self):
        path = self._write({"location": {"timezone": "Mars/Olympus"}})
        with self.assertRaises(config.ConfigError):
            config.load(path=path, env={})

    def test_negative_news_limit_is_rejected(self):
        path = self._write({"news_limit": -1})
        with self.assertRaises(config.ConfigError):
            config.load(path=path, env={})

    def test_malformed_json_is_reported_clearly(self):
        tmp = Path(tempfile.mkdtemp()) / "config.json"
        tmp.write_text("{not json", encoding="utf-8")
        with self.assertRaises(config.ConfigError) as ctx:
            config.load(path=tmp, env={})
        self.assertIn("not valid JSON", str(ctx.exception))

    def test_shipped_example_config_is_valid(self):
        example = Path(__file__).resolve().parent.parent / "config.json"
        if example.exists():
            cfg = config.load(path=example, env={})
            self.assertTrue(cfg.sections)


class TestNewsParsing(unittest.TestCase):
    RSS = b"""<?xml version="1.0"?>
    <rss version="2.0"><channel><title>BBC News</title>
    <item><title>First &amp; foremost</title><link>https://b.co/1</link></item>
    <item><title><![CDATA[Second <b>story</b>]]></title><link>https://b.co/2</link></item>
    <item><link>https://b.co/3</link></item>
    </channel></rss>"""

    ATOM = b"""<?xml version="1.0"?>
    <feed xmlns="http://www.w3.org/2005/Atom"><title>The Hindu</title>
    <entry><title>Alpha</title><link rel="alternate" href="https://h.co/a"/></entry>
    <entry><title>Beta</title><link rel="alternate" href="https://h.co/b"/></entry>
    </feed>"""

    def test_rss(self):
        items = news.parse_feed(self.RSS, "fallback", 5)
        self.assertEqual(len(items), 2)  # third has no title
        self.assertEqual(items[0].title, "First & foremost")
        self.assertEqual(items[0].source, "BBC News")
        self.assertEqual(items[1].title, "Second story")

    def test_atom(self):
        items = news.parse_feed(self.ATOM, "fallback", 5)
        self.assertEqual([i.title for i in items], ["Alpha", "Beta"])
        self.assertEqual(items[0].url, "https://h.co/a")
        self.assertEqual(items[0].source, "The Hindu")

    def test_limit_is_respected(self):
        self.assertEqual(len(news.parse_feed(self.RSS, "f", 1)), 1)

    def test_malformed_feed_raises(self):
        with self.assertRaises(ValueError):
            news.parse_feed(b"<<<not xml", "f", 5)

    def test_clean_text(self):
        self.assertEqual(news.clean_text("  <p>a &amp; b</p>\n c "), "a & b c")
        self.assertEqual(news.clean_text(""), "")

    def test_dead_feed_does_not_raise(self):
        with mock.patch.object(news, "fetch", side_effect=OSError("down")):
            self.assertEqual(news.fetch_headlines(["https://dead.example"], 5), [])

    def test_feeds_are_interleaved(self):
        def fake_fetch(url, **kwargs):
            return self.RSS if "b.co" in url else self.ATOM

        with mock.patch.object(news, "fetch", side_effect=fake_fetch):
            items = news.fetch_headlines(
                ["https://b.co/feed", "https://h.co/feed"], 4
            )
        # Round-robin: one from each source before a second from either.
        self.assertEqual(len(items), 4)
        self.assertNotEqual(items[0].source, items[1].source)

    def test_zero_limit_returns_nothing(self):
        self.assertEqual(news.fetch_headlines(["https://x"], 0), [])


class TestFriendlyReasons(unittest.TestCase):
    def test_maps_common_failures(self):
        cases = {
            "connection timed out": "timed out",
            "HTTP 403 Forbidden": "refused",
            "HTTP 401 unauthorized": "credentials",
            "HTTP 429 too many": "rate limited",
            "<urlopen error nope>": "network",
            "invalid JSON from x": "unexpected response",
            "something odd": "temporarily unavailable",
        }
        for raw, expected in cases.items():
            self.assertIn(expected, main._friendly_reason(Exception(raw)), msg=raw)

    def test_no_raw_urls_leak(self):
        reason = main._friendly_reason(
            Exception("https://api.open-meteo.com/v1/forecast failed: 403")
        )
        self.assertNotIn("http", reason)


class TestBuildEndToEnd(unittest.TestCase):
    """The brief must survive every network source being down."""

    def _offline_config(self, sections):
        return config.Config(
            location=config.Location(),
            sections=sections,
            name="Tester",
            news_feeds=("https://dead.example/feed",),
            news_limit=3,
        )

    def test_builds_with_no_network(self):
        cfg = self._offline_config(("greeting", "panchang", "shloka"))
        message = main.build(cfg, date(2026, 10, 18))
        self.assertIn("Good morning", message)
        self.assertIn("Tithi", message)
        self.assertIn("Verse of the day", message)

    def test_failed_sections_are_reported_not_hidden(self):
        cfg = self._offline_config(("greeting", "weather", "news"))
        with mock.patch(
            "brief.sources.weather.fetch_json", side_effect=OSError("boom")
        ), mock.patch.object(news, "fetch", side_effect=OSError("boom")):
            message = main.build(cfg, date(2026, 10, 18))
        self.assertIn("unavailable", message)
        self.assertIn("Good morning", message)  # the brief still went out

    def test_calendar_skipped_without_credentials(self):
        cfg = self._offline_config(("greeting", "calendar"))
        message = main.build(cfg, date(2026, 10, 18))
        self.assertNotIn("Today", message)
        self.assertNotIn("unavailable", message)

    def test_message_fits_telegram_limits(self):
        from brief.telegram import split_message

        cfg = self._offline_config(config.KNOWN_SECTIONS)
        with mock.patch(
            "brief.sources.weather.fetch_json", side_effect=OSError("boom")
        ), mock.patch.object(news, "fetch", side_effect=OSError("boom")):
            message = main.build(cfg, date(2026, 10, 18))
        for chunk in split_message(message):
            self.assertLess(len(chunk), 4096)

    def test_dry_run_exits_cleanly(self):
        code = main.main(["--dry-run", "--date", "2026-10-18"])
        self.assertEqual(code, 0)

    def test_bad_date_is_rejected(self):
        self.assertEqual(main.main(["--dry-run", "--date", "18-10-2026"]), 2)

    def test_plain_text_strips_markup(self):
        out = main._plain_text('<b>Hi</b> <a href="https://x">link</a> &amp; more')
        self.assertEqual(out, "Hi link & more")


class TestCommands(unittest.TestCase):
    def _cfg(self):
        return config.Config(
            location=config.Location(), bot_token="t", chat_id="4242"
        )

    def test_only_the_configured_chat_is_answered(self):
        self.assertTrue(commands._authorised(4242, "4242"))
        self.assertTrue(commands._authorised("4242", 4242))
        self.assertFalse(commands._authorised(1, "4242"))

    def test_help_and_start(self):
        cfg = self._cfg()
        for text in ("/help", "/start"):
            self.assertIn("Morning brief bot", commands.handle(cfg, None, text))

    def test_group_mention_suffix_is_stripped(self):
        cfg = self._cfg()
        self.assertIn("Morning brief bot", commands.handle(cfg, None, "/help@MyBot"))

    def test_unknown_command(self):
        reply = commands.handle(self._cfg(), None, "/sideways")
        self.assertIn("Unknown command", reply)

    def test_plain_message_is_ignored(self):
        self.assertIsNone(commands.handle(self._cfg(), None, "hello there"))

    def test_empty_message_is_ignored(self):
        self.assertIsNone(commands.handle(self._cfg(), None, "   "))

    def test_panchang_command_builds_offline(self):
        reply = commands.handle(self._cfg(), None, "/panchang")
        self.assertIn("Tithi", reply)


if __name__ == "__main__":
    unittest.main()
