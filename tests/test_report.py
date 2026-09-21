import unittest
from datetime import datetime
from unittest import mock

from helpers import make_config

from briefing import digest, report
from briefing.sections.base import Context, Section, SectionError

MORNING = datetime(2026, 9, 21, 7, 30)


class RenderTests(unittest.TestCase):
    def test_header_carries_name_and_date(self):
        text = report.render([], MORNING, name="Rahul")
        self.assertIn("Good morning, Rahul", text)
        self.assertIn("Monday, 21 September 2026", text)

    def test_greeting_follows_the_clock(self):
        self.assertTrue(report.greeting(datetime(2026, 9, 21, 7)).startswith("Good morning"))
        self.assertTrue(report.greeting(datetime(2026, 9, 21, 14)).startswith("Good afternoon"))
        self.assertTrue(report.greeting(datetime(2026, 9, 21, 20)).startswith("Good evening"))

    def test_name_is_html_escaped(self):
        self.assertIn("A &amp; B", report.render([], MORNING, name="A & B"))

    def test_failed_section_degrades_without_hiding_the_rest(self):
        sections = [
            Section(key="weather", title="Weather", error="api down"),
            Section(key="quote", title="Thought", lines=["<i>be well</i>"]),
        ]
        text = report.render(sections, MORNING)
        self.assertIn("Unavailable right now", text)
        self.assertIn("be well", text)
        self.assertNotIn("api down", text, "internal errors should not leak into the message")

    def test_empty_section_is_omitted(self):
        text = report.render([Section(key="x", title="Nothing")], MORNING)
        self.assertNotIn("Nothing", text)

    def test_intro_is_placed_above_the_sections(self):
        sections = [Section(key="quote", title="Thought", lines=["hi"])]
        text = report.render(sections, MORNING, intro="Rain later, take an umbrella.")
        self.assertLess(text.index("umbrella"), text.index("Thought"))


class BuildSectionsTests(unittest.TestCase):
    def test_runs_sections_in_configured_order(self):
        cfg = make_config(sections=("quote", "weather"))
        with mock.patch.dict(
            report.REGISTRY,
            {
                "quote": lambda c: Section(key="quote", title="Q", lines=["q"]),
                "weather": lambda c: Section(key="weather", title="W", lines=["w"]),
            },
            clear=True,
        ):
            built = report.build_sections(Context(config=cfg, now=MORNING))
        self.assertEqual([s.key for s in built], ["quote", "weather"])

    def test_section_error_is_captured_not_raised(self):
        cfg = make_config(sections=("weather",))

        def boom(_ctx):
            raise SectionError("upstream 503")

        with mock.patch.dict(report.REGISTRY, {"weather": boom}, clear=True):
            built = report.build_sections(Context(config=cfg, now=MORNING))
        self.assertEqual(built[0].error, "upstream 503")
        self.assertEqual(built[0].title, "Weather", "a failed section keeps a readable heading")

    def test_failed_section_headings_are_human_readable(self):
        self.assertEqual(report._fallback_title("onthisday"), "On this day")
        self.assertEqual(report._fallback_title("stock_prices"), "Stock Prices")

    def test_unexpected_crash_is_contained(self):
        cfg = make_config(sections=("weather",))

        def crash(_ctx):
            raise ValueError("bug")

        with mock.patch.dict(report.REGISTRY, {"weather": crash}, clear=True):
            built = report.build_sections(Context(config=cfg, now=MORNING))
        self.assertIn("ValueError", built[0].error)

    def test_unknown_section_name_is_skipped(self):
        cfg = make_config(sections=("nope",))
        built = report.build_sections(Context(config=cfg, now=MORNING))
        self.assertEqual(built, [])


class DigestTests(unittest.TestCase):
    def test_returns_nothing_without_an_api_key(self):
        sections = [Section(key="q", title="Q", lines=["hello"])]
        self.assertEqual(digest.summarise(make_config(), sections), "")

    def test_failure_is_swallowed_so_the_briefing_still_sends(self):
        from briefing.http import HttpError

        cfg = make_config(llm_api_key="k")
        sections = [Section(key="q", title="Q", lines=["hello"])]
        with mock.patch.object(digest, "post_json", side_effect=HttpError("429")):
            self.assertEqual(digest.summarise(cfg, sections), "")

    def test_openai_shape_is_parsed(self):
        cfg = make_config(llm_api_key="k")
        sections = [Section(key="q", title="Q", lines=["hello"])]
        response = {"choices": [{"message": {"content": " Rain today.\n "}}]}
        with mock.patch.object(digest, "post_json", return_value=response) as call:
            self.assertEqual(digest.summarise(cfg, sections), "Rain today.")
        self.assertIn("chat/completions", call.call_args.args[0])

    def test_anthropic_shape_is_parsed(self):
        cfg = make_config(llm_api_key="k", llm_provider="anthropic")
        sections = [Section(key="q", title="Q", lines=["hello"])]
        response = {"content": [{"text": "Clear skies."}]}
        with mock.patch.object(digest, "post_json", return_value=response) as call:
            self.assertEqual(digest.summarise(cfg, sections), "Clear skies.")
        self.assertIn("api.anthropic.com", call.call_args.args[0])

    def test_prompt_is_plain_text_without_markup(self):
        cfg = make_config(llm_api_key="k")
        sections = [Section(key="n", title="News", lines=['<a href="u">Big story</a>'])]
        response = {"choices": [{"message": {"content": "ok"}}]}
        with mock.patch.object(digest, "post_json", return_value=response) as call:
            digest.summarise(cfg, sections)
        sent = call.call_args.args[1]["messages"][-1]["content"]
        self.assertIn("Big story", sent)
        self.assertNotIn("<a href", sent)

    def test_failed_sections_are_not_sent_to_the_model(self):
        cfg = make_config(llm_api_key="k")
        sections = [Section(key="w", title="Weather", error="down")]
        with mock.patch.object(digest, "post_json") as call:
            self.assertEqual(digest.summarise(cfg, sections), "")
        call.assert_not_called()


class LocalNowTests(unittest.TestCase):
    def test_unknown_timezone_falls_back_instead_of_crashing(self):
        self.assertIsNotNone(report.local_now("Mars/Olympus"))

    def test_known_timezone_is_applied(self):
        self.assertIsNotNone(report.local_now("Asia/Kolkata").tzinfo)


if __name__ == "__main__":
    unittest.main()
