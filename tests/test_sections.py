import unittest
from datetime import datetime
from unittest import mock

from helpers import make_config

from briefing.sections import news, onthisday, quote, weather
from briefing.sections.base import Context, SectionError

FORECAST = {
    "current": {"temperature_2m": 24.2, "apparent_temperature": 27.9, "weather_code": 2},
    "daily": {
        "weather_code": [61],
        "temperature_2m_max": [31.4],
        "temperature_2m_min": [23.6],
        "precipitation_probability_max": [70],
        "sunrise": ["2026-09-21T06:12"],
        "sunset": ["2026-09-21T18:24"],
    },
}

RSS = b"""<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Feed</title>
  <item>
    <title>Rupee steadies as oil slips - The Hindu</title>
    <link>https://example.com/1</link>
  </item>
  <item>
    <title><![CDATA[Monsoon retreats from north India]]></title>
    <link>https://example.com/2</link>
    <source>PTI</source>
  </item>
  <item>
    <title>Rupee steadies as oil slips - The Hindu</title>
    <link>https://example.com/dupe</link>
  </item>
</channel></rss>"""

ATOM = b"""<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Atom headline</title>
    <link rel="alternate" href="https://example.com/atom"/>
  </entry>
</feed>"""


def ctx(**overrides) -> Context:
    return Context(config=make_config(**overrides), now=datetime(2026, 9, 21, 7, 0))


class WeatherTests(unittest.TestCase):
    def test_builds_readable_lines(self):
        with mock.patch.object(weather, "get_json", return_value=FORECAST):
            section = weather.build(ctx(place="Mumbai"))

        self.assertEqual(section.title, "Weather in Mumbai")
        self.assertTrue(section.ok)
        body = "\n".join(section.lines)
        self.assertIn("Light rain", body)
        self.assertIn("24°C", body)
        self.assertIn("31°C", body)
        self.assertIn("70%", body)
        self.assertIn("06:12", body)

    def test_requests_the_configured_units_and_zone(self):
        with mock.patch.object(weather, "get_json", return_value=FORECAST) as call:
            weather.build(ctx(units="imperial", timezone="America/New_York"))
        params = call.call_args.kwargs["params"]
        self.assertEqual(params["temperature_unit"], "fahrenheit")
        self.assertEqual(params["timezone"], "America/New_York")

    def test_missing_daily_block_is_a_section_error(self):
        with mock.patch.object(weather, "get_json", return_value={"daily": {}}):
            with self.assertRaises(SectionError):
                weather.build(ctx())

    def test_partial_payload_still_renders(self):
        payload = {"daily": {"weather_code": [0], "temperature_2m_max": [30]}}
        with mock.patch.object(weather, "get_json", return_value=payload):
            section = weather.build(ctx())
        self.assertIn("? to 30°C", "\n".join(section.lines))

    def test_advice_reacts_to_conditions(self):
        self.assertIn("umbrella", weather.advice(30, 25, 80, "metric"))
        self.assertIn("hydrated", weather.advice(41, 30, 0, "metric"))
        self.assertIn("cold", weather.advice(14, 5, 0, "metric"))
        self.assertEqual(weather.advice(28, 20, 10, "metric"), "")

    def test_unknown_weather_code_has_a_fallback(self):
        self.assertEqual(weather.describe_code(1234)[1], "Mixed conditions")


class NewsTests(unittest.TestCase):
    def test_parses_rss_and_drops_duplicates(self):
        with mock.patch.object(news, "request", return_value=RSS):
            section = news.build(ctx(news_feeds=("https://feed.test/rss",)))
        self.assertEqual(len(section.lines), 2)
        self.assertIn("https://example.com/1", section.lines[0])
        self.assertIn("Monsoon retreats", section.lines[1])

    def test_parses_atom(self):
        headlines = news.parse_feed(ATOM)
        self.assertEqual(headlines[0].title, "Atom headline")
        self.assertEqual(headlines[0].link, "https://example.com/atom")

    def test_respects_news_limit(self):
        with mock.patch.object(news, "request", return_value=RSS):
            section = news.build(ctx(news_feeds=("https://feed.test/rss",), news_limit=1))
        self.assertEqual(len(section.lines), 1)

    def test_publisher_suffix_is_separated(self):
        self.assertEqual(
            news.split_source_suffix("Rupee steadies - The Hindu"),
            ("Rupee steadies", "The Hindu"),
        )

    def test_hyphenated_headline_is_not_mangled(self):
        title = "A very long trailing clause that is clearly not a publisher name at all"
        self.assertEqual(news.split_source_suffix(title), (title, ""))

    def test_headline_text_is_html_escaped(self):
        rendered = news.format_headline(news.Headline(title="Tata & Sons", link=""))
        self.assertIn("Tata &amp; Sons", rendered)

    def test_one_dead_feed_does_not_lose_the_others(self):
        from briefing.http import HttpError

        def fetch(url, **kwargs):
            if "dead" in url:
                raise HttpError("timeout")
            return RSS

        with mock.patch.object(news, "request", side_effect=fetch):
            section = news.build(ctx(news_feeds=("https://dead.test/rss", "https://ok.test/rss")))
        self.assertTrue(section.ok)

    def test_all_feeds_failing_raises(self):
        with mock.patch.object(news, "request", side_effect=SectionError("boom")):
            with self.assertRaises(SectionError):
                news.build(ctx(news_feeds=("https://dead.test/rss",)))

    def test_unparseable_xml_raises_section_error(self):
        with self.assertRaises(SectionError):
            news.parse_feed(b"<rss><channel>")


class OnThisDayTests(unittest.TestCase):
    def test_picks_most_recent_events(self):
        payload = {
            "selected": [
                {"year": 1947, "text": "A"},
                {"year": 2001, "text": "B"},
                {"year": 1815, "text": "C"},
            ]
        }
        self.assertEqual(onthisday.pick_events(payload), [(2001, "B"), (1947, "A")])

    def test_requests_todays_month_and_day(self):
        payload = {"selected": [{"year": 1947, "text": "Independence"}]}
        with mock.patch.object(onthisday, "get_json", return_value=payload) as call:
            onthisday.build(ctx())
        self.assertTrue(call.call_args.args[0].endswith("/09/21"))

    def test_empty_feed_raises(self):
        with mock.patch.object(onthisday, "get_json", return_value={"selected": []}):
            with self.assertRaises(SectionError):
                onthisday.build(ctx())


class QuoteTests(unittest.TestCase):
    def test_is_deterministic_per_day(self):
        self.assertEqual(quote.pick(5), quote.pick(5))

    def test_rotates_across_days(self):
        self.assertNotEqual(quote.pick(1), quote.pick(2))

    def test_wraps_past_the_end_of_the_list(self):
        self.assertEqual(quote.pick(1), quote.pick(1 + len(quote.QUOTES)))

    def test_never_needs_the_network(self):
        section = quote.build(ctx())
        self.assertTrue(section.ok)
        self.assertEqual(len(section.lines), 2)


if __name__ == "__main__":
    unittest.main()
