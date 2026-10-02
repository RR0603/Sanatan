import time
import unittest

from rewind.timeparse import WhenError, ago, parse_duration, parse_when


class DurationTests(unittest.TestCase):
    def test_simple_units(self):
        self.assertEqual(parse_duration("30s"), 30)
        self.assertEqual(parse_duration("10m"), 600)
        self.assertEqual(parse_duration("2h"), 7200)
        self.assertEqual(parse_duration("3d"), 259200)
        self.assertEqual(parse_duration("1w"), 604800)

    def test_spelled_out_and_combined(self):
        self.assertEqual(parse_duration("2 minutes"), 120)
        self.assertEqual(parse_duration("1h30m"), 5400)

    def test_non_durations(self):
        for text in ("2026-09-21", "f00012", "", "hello", "14:00"):
            self.assertIsNone(parse_duration(text), text)


class WhenTests(unittest.TestCase):
    def setUp(self):
        self.now = 1_000_000_000.0

    def test_words(self):
        self.assertEqual(parse_when("start", self.now), ("frame", 1))
        self.assertEqual(parse_when("latest", self.now), ("frame", -1))

    def test_frame_ids(self):
        self.assertEqual(parse_when("f00012", self.now), ("frame", 12))
        self.assertEqual(parse_when("12", self.now), ("frame", 12))

    def test_steps_back(self):
        self.assertEqual(parse_when("-3", self.now), ("steps", 3))

    def test_durations_become_a_moment_in_the_past(self):
        self.assertEqual(parse_when("10m", self.now), ("time", self.now - 600))

    def test_absolute_times(self):
        kind, value = parse_when("2026-09-21 14:00", self.now)
        self.assertEqual(kind, "time")
        self.assertEqual(time.strftime("%Y-%m-%d %H:%M", time.localtime(value)),
                         "2026-09-21 14:00")

    def test_a_bare_clock_time_means_today(self):
        kind, value = parse_when("09:30", self.now)
        self.assertEqual(kind, "time")
        today = time.strftime("%Y-%m-%d", time.localtime(self.now))
        self.assertEqual(time.strftime("%Y-%m-%d %H:%M", time.localtime(value)),
                         f"{today} 09:30")

    def test_nonsense_is_explained(self):
        for text in ("", "next tuesday", "soon"):
            with self.assertRaises(WhenError):
                parse_when(text, self.now)


class AgoTests(unittest.TestCase):
    def test_phrasing(self):
        now = 1_000_000.0
        self.assertEqual(ago(now, now), "just now")
        self.assertEqual(ago(now - 45, now), "45 seconds ago")
        self.assertEqual(ago(now - 60, now), "1 minute ago")
        self.assertEqual(ago(now - 7200, now), "2 hours ago")
        self.assertEqual(ago(now - 3 * 86400, now), "3 days ago")
        self.assertEqual(ago(now + 100, now), "just now")
