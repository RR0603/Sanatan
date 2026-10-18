"""Astronomy checks against published reference values.

The expected numbers come from worked examples in Jean Meeus,
*Astronomical Algorithms* (2nd ed.). They are fixed, external ground truth --
if a refactor breaks the ephemeris, these fail.
"""

import math
import unittest
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from brief.panchang import astro


class TestJulianDay(unittest.TestCase):
    def test_known_epoch(self):
        moment = datetime(2000, 1, 1, 12, 0, tzinfo=timezone.utc)
        self.assertAlmostEqual(astro.julian_day(moment), 2451545.0, places=6)

    def test_meeus_example_7a(self):
        # 1957 October 4.81 UT -> JD 2436116.31
        moment = datetime(1957, 10, 4, 19, 26, 24, tzinfo=timezone.utc)
        self.assertAlmostEqual(astro.julian_day(moment), 2436116.31, places=2)

    def test_round_trip(self):
        for moment in (
            datetime(1899, 7, 3, 4, 5, tzinfo=timezone.utc),
            datetime(2026, 10, 18, 23, 59, tzinfo=timezone.utc),
            datetime(2100, 2, 28, 12, 0, tzinfo=timezone.utc),
        ):
            back = astro.julian_day_to_datetime(astro.julian_day(moment))
            self.assertLess(abs((back - moment).total_seconds()), 0.01)

    def test_naive_datetime_rejected(self):
        with self.assertRaises(ValueError):
            astro.julian_day(datetime(2026, 1, 1, 0, 0))

    def test_timezone_is_honoured(self):
        ist = ZoneInfo("Asia/Kolkata")
        a = astro.julian_day(datetime(2026, 1, 1, 5, 30, tzinfo=ist))
        b = astro.julian_day(datetime(2026, 1, 1, 0, 0, tzinfo=timezone.utc))
        self.assertAlmostEqual(a, b, places=9)


class TestSolarLongitude(unittest.TestCase):
    def test_meeus_example_25b(self):
        # JD 2448908.5 (1992 Oct 13.0 TD) -> apparent longitude 199.90895 deg
        t = (2448908.5 - astro.J2000) / 36525.0
        self.assertAlmostEqual(astro.solar_longitude(t), 199.90895, places=4)

    def test_obliquity_meeus_example_22a(self):
        # 1987 April 10.0 TD -> 23 deg 26' 27.407" = 23.4409463 deg
        t = (2446895.5 - astro.J2000) / 36525.0
        self.assertAlmostEqual(astro.obliquity(t), 23.4409463, places=6)


class TestLunarLongitude(unittest.TestCase):
    def test_meeus_example_47a_arguments(self):
        t = (2448724.5 - astro.J2000) / 36525.0
        args = astro._moon_arguments(t)
        for key, expected in (
            ("L1", 134.290182),
            ("D", 113.842304),
            ("M", 97.643514),
            ("Mp", 5.150833),
            ("F", 219.889721),
        ):
            self.assertAlmostEqual(args[key], expected, places=5, msg=key)

    def test_meeus_example_47a_longitude(self):
        # 1992 April 12.0 TD -> lunar longitude 133.162655 deg
        t = (2448724.5 - astro.J2000) / 36525.0
        self.assertAlmostEqual(astro.lunar_longitude(t), 133.162655, places=4)

    def test_moon_longitude_always_in_range(self):
        for days in range(0, 4000, 37):
            t = days / 36525.0
            value = astro.lunar_longitude(t)
            self.assertGreaterEqual(value, 0.0)
            self.assertLess(value, 360.0)


class TestAyanamsa(unittest.TestCase):
    def test_lahiri_at_j2000(self):
        # Lahiri ayanamsa at J2000 is about 23 deg 51' 08".
        self.assertAlmostEqual(astro.lahiri_ayanamsa(0.0), 23.8523, places=3)

    def test_increases_with_precession(self):
        # Roughly 50.3 arcseconds a year.
        per_century = astro.lahiri_ayanamsa(1.0) - astro.lahiri_ayanamsa(0.0)
        self.assertAlmostEqual(per_century * 3600.0 / 100.0, 50.3, delta=0.2)

    def test_sidereal_conversion_wraps(self):
        t = 0.26
        self.assertAlmostEqual(
            astro.sidereal(10.0, t),
            astro.norm360(10.0 - astro.lahiri_ayanamsa(t)),
            places=9,
        )
        self.assertGreaterEqual(astro.sidereal(1.0, t), 0.0)


class TestDeltaT(unittest.TestCase):
    def test_modern_era(self):
        # Around 2026 Delta-T is approximately 72-76 seconds.
        jd = astro.julian_day(datetime(2026, 1, 1, tzinfo=timezone.utc))
        self.assertAlmostEqual(astro.delta_t_seconds(jd), 75.0, delta=5.0)

    def test_continuous_across_branches(self):
        # No discontinuity where the polynomial fits meet.
        for year in (2005, 2050):
            jd = astro.julian_day(datetime(year, 1, 1, tzinfo=timezone.utc))
            before = astro.delta_t_seconds(jd - 1.0)
            after = astro.delta_t_seconds(jd + 1.0)
            self.assertLess(abs(after - before), 2.0, msg=str(year))


class TestSolarEvents(unittest.TestCase):
    IST = ZoneInfo("Asia/Kolkata")
    DELHI = (28.6139, 77.2090)

    def _local(self, day, rising):
        moment = astro.solar_event(day, *self.DELHI, rising=rising)
        self.assertIsNotNone(moment)
        return moment.astimezone(self.IST)

    def test_delhi_equinox(self):
        # Near the equinox, day length is close to 12 hours.
        rise = self._local(date(2026, 3, 20), True)
        setting = self._local(date(2026, 3, 20), False)
        hours = (setting - rise).total_seconds() / 3600.0
        self.assertAlmostEqual(hours, 12.1, delta=0.2)

    def test_delhi_solstices(self):
        # Published Delhi values: ~05:24/19:22 in June, ~07:10/17:29 in Dec.
        self.assertEqual(self._local(date(2026, 6, 21), True).hour, 5)
        self.assertEqual(self._local(date(2026, 6, 21), False).hour, 19)
        self.assertEqual(self._local(date(2026, 12, 21), True).hour, 7)
        self.assertEqual(self._local(date(2026, 12, 21), False).hour, 17)

    def test_longer_days_in_summer(self):
        june = (
            self._local(date(2026, 6, 21), False) - self._local(date(2026, 6, 21), True)
        )
        december = (
            self._local(date(2026, 12, 21), False)
            - self._local(date(2026, 12, 21), True)
        )
        self.assertGreater(june, december)

    def test_polar_night_returns_none(self):
        # Longyearbyen in midwinter: the Sun does not rise.
        self.assertIsNone(astro.solar_event(date(2026, 12, 21), 78.22, 15.63, True))

    def test_twilight_precedes_sunrise(self):
        day = date(2026, 10, 18)
        rise = astro.solar_event(day, *self.DELHI, rising=True)
        light = astro.solar_event(
            day, *self.DELHI, rising=True, altitude=astro.CIVIL_TWILIGHT_ALTITUDE
        )
        self.assertLess(light, rise)
        self.assertLess((rise - light).total_seconds(), 45 * 60)


class TestNorm360(unittest.TestCase):
    def test_wraps(self):
        self.assertAlmostEqual(astro.norm360(370.0), 10.0)
        self.assertAlmostEqual(astro.norm360(-10.0), 350.0)
        self.assertAlmostEqual(astro.norm360(360.0), 0.0)


if __name__ == "__main__":
    unittest.main()
