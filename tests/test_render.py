"""Rendering, escaping and message-splitting tests."""

import unittest
from datetime import date, datetime
from zoneinfo import ZoneInfo

from brief import render, telegram
from brief.panchang import calendar as pc
from brief.sources.gcal import Event
from brief.sources.news import Headline
from brief.sources.shloka import Shloka, shloka_for
from brief.sources.weather import Weather, aqi_band, describe_code

IST = ZoneInfo("Asia/Kolkata")


class TestEscaping(unittest.TestCase):
    def test_html_specials(self):
        self.assertEqual(telegram.escape("a & b"), "a &amp; b")
        self.assertEqual(telegram.escape("<b>x</b>"), "&lt;b&gt;x&lt;/b&gt;")

    def test_ampersand_escaped_once(self):
        # A naive ordering would turn & into &amp;amp;
        self.assertEqual(telegram.escape("<&>"), "&lt;&amp;&gt;")

    def test_link_escapes_both_parts(self):
        out = telegram.link("https://x.com/?a=1&b=2", "Bonds & <rates>")
        self.assertIn("a=1&amp;b=2", out)
        self.assertIn("Bonds &amp; &lt;rates&gt;", out)
        self.assertTrue(out.startswith("<a href="))

    def test_non_string_input(self):
        self.assertEqual(telegram.escape(42), "42")


class TestSplitMessage(unittest.TestCase):
    def test_short_text_is_one_chunk(self):
        self.assertEqual(telegram.split_message("hello"), ["hello"])

    def test_empty_text_sends_nothing(self):
        self.assertEqual(telegram.split_message(""), [])

    def test_splits_on_paragraphs(self):
        text = "\n\n".join(f"para {i} " + "x" * 300 for i in range(30))
        chunks = telegram.split_message(text)
        self.assertGreater(len(chunks), 1)
        for chunk in chunks:
            self.assertLessEqual(len(chunk), telegram.SPLIT_TARGET)

    def test_nothing_is_lost(self):
        text = "\n\n".join(f"block{i}" for i in range(900))
        chunks = telegram.split_message(text)
        rejoined = "\n\n".join(chunks)
        for i in range(900):
            self.assertIn(f"block{i}", rejoined)

    def test_hard_cut_for_one_long_line(self):
        chunks = telegram.split_message("y" * 10000)
        self.assertEqual(sum(len(c) for c in chunks), 10000)
        for chunk in chunks:
            self.assertLessEqual(len(chunk), telegram.SPLIT_TARGET)

    def test_every_chunk_within_telegram_limit(self):
        chunks = telegram.split_message("z" * 50000)
        for chunk in chunks:
            self.assertLess(len(chunk), telegram.MESSAGE_LIMIT)


class TestWeatherHelpers(unittest.TestCase):
    def test_known_and_unknown_codes(self):
        self.assertEqual(describe_code(0)[0], "Clear sky")
        self.assertEqual(describe_code(95)[0], "Thunderstorm")
        self.assertEqual(describe_code(None)[0], "Unsettled")
        self.assertEqual(describe_code("nonsense")[0], "Unsettled")

    def test_cpcb_aqi_bands(self):
        self.assertEqual(aqi_band(30)[0], "Good")
        self.assertEqual(aqi_band(80)[0], "Satisfactory")
        self.assertEqual(aqi_band(150)[0], "Moderate")
        self.assertEqual(aqi_band(250)[0], "Poor")
        self.assertEqual(aqi_band(350)[0], "Very Poor")
        self.assertEqual(aqi_band(500)[0], "Severe")

    def test_band_boundaries_inclusive(self):
        self.assertEqual(aqi_band(50)[0], "Good")
        self.assertEqual(aqi_band(100)[0], "Satisfactory")

    def test_unknown_aqi(self):
        self.assertEqual(aqi_band(None)[0], "unknown")


class TestSections(unittest.TestCase):
    def _weather(self, **kwargs):
        base = dict(
            condition="Haze",
            emoji="\U0001f32b️",
            temp_min=18.2,
            temp_max=31.6,
            feels_max=33.1,
            precipitation_mm=0.0,
            precipitation_chance=5,
            wind_max=11.4,
            uv_index=6.3,
        )
        base.update(kwargs)
        return Weather(**base)

    def test_greeting_includes_name_and_date(self):
        out = render.greeting_section(date(2026, 10, 18), IST, "Rahul")
        self.assertIn("Rahul", out)
        self.assertIn("Sunday", out)
        self.assertIn("18 October 2026", out)

    def test_greeting_without_name(self):
        out = render.greeting_section(date(2026, 10, 18), IST, "")
        self.assertIn("Good morning", out)
        self.assertNotIn(", <", out)

    def test_greeting_escapes_name(self):
        out = render.greeting_section(date(2026, 10, 18), IST, "R & <b>")
        self.assertIn("&amp;", out)
        self.assertNotIn("<b>R", out)

    def test_weather_section_fields(self):
        out = render.weather_section(self._weather(), "Delhi")
        for fragment in ("Delhi", "Haze", "18", "32", "Rain 5%", "UV index 6.3"):
            self.assertIn(fragment, out)

    def test_weather_tolerates_missing_values(self):
        out = render.weather_section(
            self._weather(
                temp_min=None,
                temp_max=None,
                feels_max=None,
                precipitation_chance=None,
                wind_max=None,
                uv_index=None,
            ),
            "Delhi",
        )
        self.assertIn("—", out)  # em dash placeholder

    def test_weather_includes_aqi_when_present(self):
        label, emoji = aqi_band(318)
        out = render.weather_section(
            self._weather(aqi=318, aqi_label=label, aqi_emoji=emoji, pm25=168.4),
            "Delhi",
        )
        self.assertIn("AQI 318", out)
        self.assertIn("Very Poor", out)
        self.assertIn("PM2.5", out)

    def test_panchang_section_has_all_five_limbs(self):
        p = pc.compute(date(2026, 10, 18), 28.6139, 77.2090, IST)
        out = render.panchang_section(p, IST)
        for limb in ("Tithi", "Nakshatra", "Yoga", "Karana"):
            self.assertIn(limb, out)
        self.assertIn("Rahu Kaal", out)
        self.assertIn("Sunrise", out)

    def test_calendar_section_with_events(self):
        events = [
            Event(
                "Standup",
                datetime(2026, 10, 18, 9, 30, tzinfo=IST),
                datetime(2026, 10, 18, 9, 45, tzinfo=IST),
                False,
                "Zoom",
            ),
            Event("Holiday", None, None, True),
        ]
        out = render.calendar_section(events, IST)
        self.assertIn("09:30", out)
        self.assertIn("Standup", out)
        self.assertIn("all day", out)

    def test_calendar_section_when_empty(self):
        out = render.calendar_section([], IST)
        self.assertIn("Nothing on the calendar", out)

    def test_calendar_escapes_event_titles(self):
        events = [Event("Review <draft> & ship", None, None, True)]
        out = render.calendar_section(events, IST)
        self.assertIn("&lt;draft&gt;", out)
        self.assertIn("&amp;", out)

    def test_news_section_links_headlines(self):
        out = render.news_section(
            [Headline("Rates hold & steady", "https://x.com/a?b=1&c=2", "BBC")]
        )
        self.assertIn('<a href="https://x.com/a?b=1&amp;c=2">', out)
        self.assertIn("Rates hold &amp; steady", out)

    def test_news_section_without_url(self):
        out = render.news_section([Headline("No link here", "", "X")])
        self.assertIn("No link here", out)
        self.assertNotIn("<a href", out)

    def test_news_section_when_empty(self):
        self.assertIn("No headlines", render.news_section([]))

    def test_shloka_section(self):
        out = render.shloka_section(
            Shloka("Gita 2.47", "कर्म", "Do your work.")
        )
        self.assertIn("Gita 2.47", out)
        self.assertIn("Do your work.", out)

    def test_failure_note_lists_reasons(self):
        out = render.failure_note([("Weather", "source timed out")])
        self.assertIn("Weather", out)
        self.assertIn("source timed out", out)

    def test_failure_note_empty_when_nothing_failed(self):
        self.assertEqual(render.failure_note([]), "")

    def test_compose_skips_blank_sections(self):
        out = render.compose(["a", "", None, "b"])
        self.assertEqual(out, "a\n\nb")

    def test_compose_appends_failures(self):
        out = render.compose(["a"], [("News", "rate limited")])
        self.assertIn("a", out)
        self.assertIn("rate limited", out)


class TestShlokaRotation(unittest.TestCase):
    def test_deterministic_for_a_date(self):
        a = shloka_for(date(2026, 10, 18))
        b = shloka_for(date(2026, 10, 18))
        self.assertEqual(a.reference, b.reference)

    def test_changes_day_to_day(self):
        a = shloka_for(date(2026, 10, 18))
        b = shloka_for(date(2026, 10, 19))
        self.assertNotEqual(a.reference, b.reference)

    def test_collection_loads_and_is_complete(self):
        from brief.sources.shloka import load_collection

        verses = load_collection()
        self.assertGreaterEqual(len(verses), 15)
        for verse in verses:
            self.assertTrue(verse.reference)
            self.assertTrue(verse.sanskrit)
            self.assertTrue(verse.translation)

    def test_empty_collection_returns_none(self):
        self.assertIsNone(shloka_for(date(2026, 10, 18), collection=[]))


if __name__ == "__main__":
    unittest.main()
