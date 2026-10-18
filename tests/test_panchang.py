"""Panchang checks, anchored on published lunar phase dates."""

import unittest
from datetime import date, timedelta
from zoneinfo import ZoneInfo

from brief.panchang import calendar as pc
from brief.panchang import names

IST = ZoneInfo("Asia/Kolkata")
DELHI = (28.6139, 77.2090)


def compute(day):
    return pc.compute(day, DELHI[0], DELHI[1], IST)


class TestNameTables(unittest.TestCase):
    def test_table_sizes(self):
        self.assertEqual(len(names.TITHIS), 30)
        self.assertEqual(len(names.NAKSHATRAS), 27)
        self.assertEqual(len(names.YOGAS), 27)
        self.assertEqual(len(names.RASHIS), 12)
        self.assertEqual(len(names.RASHI_ENGLISH), 12)
        self.assertEqual(len(names.MASAS), 12)
        self.assertEqual(len(names.VARAS), 7)
        self.assertEqual(len(names.CHARA_KARANAS), 7)
        self.assertEqual(len(names.FIXED_KARANAS), 4)

    def test_tithi_15_and_30_are_the_full_and_new_moon(self):
        self.assertEqual(names.TITHIS[14], "Purnima")
        self.assertEqual(names.TITHIS[29], "Amavasya")

    def test_timing_segment_tables_are_permutations(self):
        for table in (
            names.RAHU_KAAL_SEGMENT,
            names.YAMA_GANDA_SEGMENT,
            names.GULIKA_SEGMENT,
        ):
            self.assertEqual(len(table), 7)
            self.assertTrue(all(1 <= v <= 8 for v in table))


class TestLunarPhaseAnchors(unittest.TestCase):
    """New and full moons must land on Amavasya and Purnima respectively."""

    NEW_MOONS = (date(2026, 1, 18), date(2026, 3, 19), date(2026, 10, 10))
    FULL_MOONS = (date(2026, 1, 3), date(2026, 10, 26))

    def test_new_moons_are_amavasya(self):
        for day in self.NEW_MOONS:
            self.assertEqual(compute(day).tithi.name, "Amavasya", msg=str(day))

    def test_full_moons_are_purnima(self):
        for day in self.FULL_MOONS:
            self.assertEqual(compute(day).tithi.name, "Purnima", msg=str(day))

    def test_paksha_matches_phase(self):
        for day in self.NEW_MOONS:
            self.assertEqual(compute(day).paksha, "Krishna", msg=str(day))
        for day in self.FULL_MOONS:
            self.assertEqual(compute(day).paksha, "Shukla", msg=str(day))


class TestLimbs(unittest.TestCase):
    def test_indices_in_range_across_a_year(self):
        day = date(2026, 1, 1)
        while day.year == 2026:
            p = compute(day)
            self.assertTrue(0 <= p.tithi.index < 30, msg=str(day))
            self.assertTrue(0 <= p.nakshatra.index < 27, msg=str(day))
            self.assertTrue(0 <= p.yoga.index < 27, msg=str(day))
            self.assertTrue(0 <= p.karana.index < 60, msg=str(day))
            self.assertIn(p.tithi.name, names.TITHIS)
            self.assertIn(p.nakshatra.name, names.NAKSHATRAS)
            self.assertIn(p.yoga.name, names.YOGAS)
            day += timedelta(days=7)

    def test_tithi_advances_over_a_lunar_month(self):
        """Every tithi name should appear across one synodic month."""
        seen = set()
        day = date(2026, 1, 1)
        for _ in range(30):
            seen.add(compute(day).tithi.index)
            day += timedelta(days=1)
        self.assertGreaterEqual(len(seen), 28)

    def test_transition_times_are_in_the_future(self):
        p = compute(date(2026, 10, 18))
        self.assertIsNotNone(p.sunrise)
        for limb in (p.tithi, p.nakshatra, p.yoga, p.karana):
            if limb.ends_at is not None:
                self.assertGreater(limb.ends_at, p.sunrise)
                self.assertLess(limb.ends_at - p.sunrise, timedelta(days=2))

    def test_describe_includes_successor(self):
        p = compute(date(2026, 10, 18))
        text = p.tithi.describe(IST)
        self.assertIn("till", text)
        self.assertIn("then", text)


class TestKarana(unittest.TestCase):
    def test_fixed_karanas_at_month_boundaries(self):
        self.assertEqual(pc.karana_name(0), "Kimstughna")
        self.assertEqual(pc.karana_name(57), "Shakuni")
        self.assertEqual(pc.karana_name(58), "Chatushpada")
        self.assertEqual(pc.karana_name(59), "Naga")

    def test_chara_karanas_cycle(self):
        self.assertEqual(pc.karana_name(1), "Bava")
        self.assertEqual(pc.karana_name(8), "Bava")
        self.assertEqual(pc.karana_name(7), "Vishti")

    def test_every_index_names_something(self):
        for i in range(60):
            self.assertTrue(pc.karana_name(i))


class TestDayWindows(unittest.TestCase):
    def test_all_windows_present_and_ordered(self):
        p = compute(date(2026, 10, 18))
        labels = {w.label for w in p.windows}
        self.assertEqual(
            labels,
            {
                "Rahu Kaal",
                "Yama Ganda",
                "Gulika Kaal",
                "Abhijit Muhurta",
                "Brahma Muhurta",
            },
        )
        for window in p.windows:
            self.assertLess(window.start, window.end)

    def test_rahu_kaal_falls_within_daylight(self):
        p = compute(date(2026, 10, 18))
        rahu = p.window("Rahu Kaal")
        self.assertGreaterEqual(rahu.start, p.sunrise)
        self.assertLessEqual(rahu.end, p.sunset)

    def test_rahu_kaal_is_one_eighth_of_the_day(self):
        p = compute(date(2026, 10, 18))
        rahu = p.window("Rahu Kaal")
        daylight = (p.sunset - p.sunrise).total_seconds()
        self.assertAlmostEqual(
            (rahu.end - rahu.start).total_seconds(), daylight / 8.0, delta=1.0
        )

    def test_brahma_muhurta_precedes_sunrise(self):
        p = compute(date(2026, 10, 18))
        brahma = p.window("Brahma Muhurta")
        self.assertLess(brahma.end, p.sunrise)
        self.assertEqual((brahma.end - brahma.start), timedelta(minutes=48))

    def test_abhijit_straddles_midday(self):
        p = compute(date(2026, 10, 18))
        abhijit = p.window("Abhijit Muhurta")
        midday = p.sunrise + (p.sunset - p.sunrise) / 2
        self.assertTrue(abhijit.contains(midday))

    def test_sunday_rahu_kaal_is_the_last_segment(self):
        # Sunday's Rahu Kaal is the eighth part, so it ends at sunset.
        p = compute(date(2026, 10, 18))  # a Sunday
        self.assertEqual(p.vara_english, "Sunday")
        self.assertAlmostEqual(
            (p.window("Rahu Kaal").end - p.sunset).total_seconds(), 0.0, delta=1.0
        )


class TestObservances(unittest.TestCase):
    def test_ekadashi_flagged_exactly_on_ekadashi(self):
        day = date(2026, 1, 1)
        while day < date(2026, 4, 1):
            p = compute(day)
            flagged = any("Ekadashi" in o for o in p.observances)
            self.assertEqual(flagged, p.tithi.name == "Ekadashi", msg=str(day))
            day += timedelta(days=1)

    def test_full_and_new_moon_flagged(self):
        self.assertTrue(
            any("full moon" in o for o in compute(date(2026, 1, 3)).observances)
        )
        self.assertTrue(
            any("new moon" in o for o in compute(date(2026, 1, 18)).observances)
        )

    def test_ekadashi_occurs_about_twice_a_month(self):
        count = 0
        day = date(2026, 1, 1)
        while day.year == 2026:
            if compute(day).tithi.name == "Ekadashi":
                count += 1
            day += timedelta(days=1)
        self.assertTrue(22 <= count <= 26, msg=f"got {count}")


class TestCalendarMetadata(unittest.TestCase):
    def test_vara_matches_weekday(self):
        for day in (date(2026, 10, 18), date(2026, 10, 19), date(2026, 10, 24)):
            self.assertEqual(compute(day).vara_english, day.strftime("%A"))

    def test_masa_is_a_known_month(self):
        day = date(2026, 1, 1)
        while day.year == 2026:
            self.assertIn(compute(day).masa, names.MASAS, msg=str(day))
            day += timedelta(days=11)

    def test_samvat_offsets(self):
        p = compute(date(2026, 10, 18))
        self.assertIn(p.vikram_samvat, (2082, 2083))
        self.assertIn(p.shaka_samvat, (1947, 1948))
        self.assertEqual(p.vikram_samvat - p.shaka_samvat, 135)

    def test_signs_are_named(self):
        p = compute(date(2026, 10, 18))
        self.assertTrue(any(r in p.moon_sign for r in names.RASHIS))
        self.assertTrue(any(r in p.sun_sign for r in names.RASHIS))


class TestCrossingSearch(unittest.TestCase):
    def test_returns_none_when_target_is_out_of_window(self):
        from datetime import datetime, timezone

        start = datetime(2026, 10, 18, tzinfo=timezone.utc)
        current = pc.elongation(start)
        far = (current + 180.0) % 360.0
        self.assertIsNone(pc.next_crossing(start, pc.elongation, far, search_days=0.5))

    def test_finds_crossing_within_window(self):
        from datetime import datetime, timezone

        start = datetime(2026, 10, 18, tzinfo=timezone.utc)
        target = (pc.elongation(start) + 6.0) % 360.0
        found = pc.next_crossing(start, pc.elongation, target, search_days=3.0)
        self.assertIsNotNone(found)
        # The elongation at the found moment should be at the target.
        self.assertAlmostEqual(pc.elongation(found), target, delta=0.01)


class TestSouthernHemisphere(unittest.TestCase):
    def test_works_outside_india(self):
        # Sydney: the engine should not assume a northern, Indian location.
        p = pc.compute(
            date(2026, 10, 18), -33.8688, 151.2093, ZoneInfo("Australia/Sydney")
        )
        self.assertIsNotNone(p.sunrise)
        self.assertIsNotNone(p.sunset)
        self.assertLess(p.sunrise, p.sunset)
        self.assertIn(p.tithi.name, names.TITHIS)


if __name__ == "__main__":
    unittest.main()
