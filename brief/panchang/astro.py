"""Astronomical primitives: time scales, solar/lunar longitude, ayanamsa, rise/set.

Pure standard library. Algorithms follow Jean Meeus, *Astronomical Algorithms*
(2nd ed.); the lunar series is the truncated form of table 47.A, which is
accurate to roughly 0.02 degrees -- about a minute of arc, or a couple of
minutes of clock time on a tithi boundary. That is far inside the tolerance of
a morning greeting, and it costs no API call and no dependency.
"""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone

DEG = math.pi / 180.0
J2000 = 2451545.0


def norm360(x: float) -> float:
    """Wrap an angle in degrees into [0, 360)."""
    return x % 360.0


def julian_day(moment: datetime) -> float:
    """Julian Day of an aware datetime, on the UTC scale."""
    if moment.tzinfo is None:
        raise ValueError("julian_day() requires a timezone-aware datetime")
    utc = moment.astimezone(timezone.utc)
    year, month = utc.year, utc.month
    day = (
        utc.day
        + (utc.hour + (utc.minute + (utc.second + utc.microsecond / 1e6) / 60.0) / 60.0)
        / 24.0
    )
    if month <= 2:
        year -= 1
        month += 12
    a = year // 100
    b = 2 - a + a // 4
    return (
        math.floor(365.25 * (year + 4716))
        + math.floor(30.6001 * (month + 1))
        + day
        + b
        - 1524.5
    )


def julian_day_to_datetime(jd: float) -> datetime:
    """Inverse of :func:`julian_day`, returning an aware UTC datetime."""
    jd += 0.5
    z = math.floor(jd)
    frac = jd - z
    if z < 2299161:
        a = z
    else:
        alpha = math.floor((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - math.floor(alpha / 4)
    b = a + 1524
    c = math.floor((b - 122.1) / 365.25)
    d = math.floor(365.25 * c)
    e = math.floor((b - d) / 30.6001)
    day = b - d - math.floor(30.6001 * e) + frac
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    whole = int(day)
    seconds = (day - whole) * 86400.0
    base = datetime(int(year), int(month), whole, tzinfo=timezone.utc)
    return base + timedelta(seconds=seconds)


def delta_t_seconds(jd: float) -> float:
    """TT - UT1 in seconds (Espenak & Meeus polynomial fits)."""
    year = 2000.0 + (jd - J2000) / 365.25
    if 2005 <= year <= 2050:
        t = year - 2000.0
        return 62.92 + 0.32217 * t + 0.005589 * t * t
    if 1986 <= year < 2005:
        t = year - 2000.0
        return (
            63.86
            + 0.3345 * t
            - 0.060374 * t**2
            + 0.0017275 * t**3
            + 0.000651814 * t**4
            + 0.00002373599 * t**5
        )
    if 2050 < year <= 2150:
        return -20 + 32 * ((year - 1820) / 100.0) ** 2 - 0.5628 * (2150 - year)
    u = (year - 1820) / 100.0
    return -20 + 32 * u * u


def centuries_tt(jd_utc: float) -> float:
    """Julian centuries of Terrestrial Time since J2000, from a UTC Julian Day."""
    jd_tt = jd_utc + delta_t_seconds(jd_utc) / 86400.0
    return (jd_tt - J2000) / 36525.0


def nutation_longitude(t: float) -> float:
    """Nutation in longitude, degrees. Leading terms only (~0.5 arcsec)."""
    omega = 125.04452 - 1934.136261 * t
    lsun = 280.4665 + 36000.7698 * t
    lmoon = 218.3165 + 481267.8813 * t
    arcsec = (
        -17.20 * math.sin(omega * DEG)
        - 1.32 * math.sin(2 * lsun * DEG)
        - 0.23 * math.sin(2 * lmoon * DEG)
        + 0.21 * math.sin(2 * omega * DEG)
    )
    return arcsec / 3600.0


def obliquity(t: float) -> float:
    """Mean obliquity of the ecliptic, degrees (Laskar)."""
    u = t / 100.0
    return (
        23.0
        + 26.0 / 60.0
        + (
            21.448
            - 4680.93 * u
            - 1.55 * u**2
            + 1999.25 * u**3
            - 51.38 * u**4
            - 249.67 * u**5
            - 39.05 * u**6
            + 7.12 * u**7
            + 27.87 * u**8
            + 5.79 * u**9
            + 2.45 * u**10
        )
        / 3600.0
    )


def solar_longitude(t: float) -> float:
    """Apparent geocentric longitude of the Sun, degrees (Meeus ch. 25)."""
    l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t
    m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t
    m_rad = norm360(m) * DEG
    centre = (
        (1.914602 - 0.004817 * t - 0.000014 * t * t) * math.sin(m_rad)
        + (0.019993 - 0.000101 * t) * math.sin(2 * m_rad)
        + 0.000289 * math.sin(3 * m_rad)
    )
    true_long = l0 + centre
    omega = 125.04 - 1934.136 * t
    return norm360(true_long - 0.00569 - 0.00478 * math.sin(omega * DEG))


# Meeus table 47.A, truncated to the terms above ~2e-6 rad of influence.
# Each row: (D, M, M', F, coefficient in 1e-6 degrees).
_MOON_LON_TERMS = (
    (0, 0, 1, 0, 6288774),
    (2, 0, -1, 0, 1274027),
    (2, 0, 0, 0, 658314),
    (0, 0, 2, 0, 213618),
    (0, 1, 0, 0, -185116),
    (0, 0, 0, 2, -114332),
    (2, 0, -2, 0, 58793),
    (2, -1, -1, 0, 57066),
    (2, 0, 1, 0, 53322),
    (2, -1, 0, 0, 45758),
    (0, 1, -1, 0, -40923),
    (1, 0, 0, 0, -34720),
    (0, 1, 1, 0, -30383),
    (2, 0, 0, -2, 15327),
    (0, 0, 1, 2, -12528),
    (0, 0, 1, -2, 10980),
    (4, 0, -1, 0, 10675),
    (0, 0, 3, 0, 10034),
    (4, 0, -2, 0, 8548),
    (2, 1, -1, 0, -7888),
    (2, 1, 0, 0, -6766),
    (1, 0, -1, 0, -5163),
    (1, 1, 0, 0, 4987),
    (2, -1, 1, 0, 4036),
    (2, 0, 2, 0, 3994),
    (4, 0, 0, 0, 3861),
    (2, 0, -3, 0, 3665),
    (0, 1, -2, 0, -2689),
    (2, 0, -1, 2, -2602),
    (2, -1, -2, 0, 2390),
    (1, 0, 1, 0, -2348),
    (2, -2, 0, 0, 2236),
    (0, 1, 2, 0, -2120),
    (0, 2, 0, 0, -2069),
    (2, -2, -1, 0, 2048),
    (2, 0, 1, -2, -1773),
    (2, 0, 0, 2, -1595),
    (4, -1, -1, 0, 1215),
    (0, 0, 2, 2, -1110),
    (3, 0, -1, 0, -892),
    (2, 1, 1, 0, -810),
    (4, -1, -2, 0, 759),
    (0, 2, -1, 0, -713),
    (2, 2, -1, 0, -700),
    (2, 1, -2, 0, 691),
    (2, -1, 0, -2, 596),
    (4, 0, 1, 0, 549),
    (0, 0, 4, 0, 537),
    (4, -1, 0, 0, 520),
    (1, 0, -2, 0, -487),
    (2, 1, 0, -2, -399),
    (0, 0, 2, -2, -381),
    (1, 1, 1, 0, 351),
    (3, 0, -2, 0, -340),
    (4, 0, -3, 0, 330),
    (2, -1, 2, 0, 327),
    (0, 2, 1, 0, -323),
    (1, 1, -1, 0, 299),
    (2, 0, 3, 0, 294),
)


def _moon_arguments(t: float) -> dict:
    return {
        "L1": norm360(
            218.3164477
            + 481267.88123421 * t
            - 0.0015786 * t**2
            + t**3 / 538841.0
            - t**4 / 65194000.0
        ),
        "D": norm360(
            297.8501921
            + 445267.1114034 * t
            - 0.0018819 * t**2
            + t**3 / 545868.0
            - t**4 / 113065000.0
        ),
        "M": norm360(
            357.5291092 + 35999.0502909 * t - 0.0001536 * t**2 + t**3 / 24490000.0
        ),
        "Mp": norm360(
            134.9633964
            + 477198.8675055 * t
            + 0.0087414 * t**2
            + t**3 / 69699.0
            - t**4 / 14712000.0
        ),
        "F": norm360(
            93.2720950
            + 483202.0175233 * t
            - 0.0036539 * t**2
            - t**3 / 3526000.0
            + t**4 / 863310000.0
        ),
    }


def lunar_longitude(t: float) -> float:
    """Apparent geocentric longitude of the Moon, degrees (Meeus ch. 47)."""
    args = _moon_arguments(t)
    d, m, mp, f, l1 = args["D"], args["M"], args["Mp"], args["F"], args["L1"]
    a1 = norm360(119.75 + 131.849 * t)
    a2 = norm360(53.09 + 479264.290 * t)
    ecc = 1.0 - 0.002516 * t - 0.0000074 * t * t

    total = 0.0
    for cd, cm, cmp_, cf, coeff in _MOON_LON_TERMS:
        arg = (cd * d + cm * m + cmp_ * mp + cf * f) * DEG
        term = coeff * math.sin(arg)
        if cm:
            term *= ecc ** abs(cm)
        total += term

    total += 3958.0 * math.sin(a1 * DEG)
    total += 1962.0 * math.sin((l1 - f) * DEG)
    total += 318.0 * math.sin(a2 * DEG)

    return norm360(l1 + total / 1e6)


def lahiri_ayanamsa(t: float) -> float:
    """Chitrapaksha (Lahiri) ayanamsa in degrees, for Julian centuries `t`.

    Anchored on 23.85229 deg at J2000 with the IAU general-precession rate.
    Good to a few arcseconds across the decades a daily brief will ever see --
    negligible against a nakshatra, which is 13 deg 20' wide.
    """
    return 23.85229 + 1.3969713 * t + 0.0003086 * t * t


def sidereal(tropical_longitude: float, t: float) -> float:
    """Convert a tropical (sayana) longitude to sidereal (nirayana)."""
    return norm360(tropical_longitude - lahiri_ayanamsa(t))


def sun_moon_longitudes(moment: datetime) -> tuple:
    """Return (sun, moon, ayanamsa) tropical longitudes in degrees at `moment`."""
    t = centuries_tt(julian_day(moment))
    return solar_longitude(t), lunar_longitude(t), lahiri_ayanamsa(t)


# --------------------------------------------------------------------------
# Rise and set
# --------------------------------------------------------------------------

#: Standard refraction-corrected altitude of the solar centre at rise/set.
SUNRISE_ALTITUDE = -0.8333
#: Civil twilight, used for the "first light" line.
CIVIL_TWILIGHT_ALTITUDE = -6.0


def _solar_declination_and_eot(t: float) -> tuple:
    """Solar declination (deg) and the equation of time (minutes)."""
    lam = solar_longitude(t)
    eps = obliquity(t) + 0.00256 * math.cos((125.04 - 1934.136 * t) * DEG)
    decl = math.asin(math.sin(eps * DEG) * math.sin(lam * DEG)) / DEG

    l0 = norm360(280.46646 + 36000.76983 * t + 0.0003032 * t * t)
    e = 0.016708634 - 0.000042037 * t - 0.0000001267 * t * t
    m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t
    y = math.tan(eps * DEG / 2.0) ** 2
    eot = (
        y * math.sin(2 * l0 * DEG)
        - 2 * e * math.sin(m * DEG)
        + 4 * e * y * math.sin(m * DEG) * math.cos(2 * l0 * DEG)
        - 0.5 * y * y * math.sin(4 * l0 * DEG)
        - 1.25 * e * e * math.sin(2 * m * DEG)
    )
    return decl, 4.0 * (eot / DEG)


def solar_event(
    day: date,
    latitude: float,
    longitude: float,
    rising: bool,
    altitude: float = SUNRISE_ALTITUDE,
):
    """UTC datetime of sunrise or sunset, or ``None`` in polar day/night.

    `day` is the local civil date at the given longitude.
    """
    jd = julian_day(datetime(day.year, day.month, day.day, 12, 0, tzinfo=timezone.utc))
    jd -= longitude / 360.0  # local noon rather than Greenwich noon

    for _ in range(3):
        t = centuries_tt(jd)
        decl, eot = _solar_declination_and_eot(t)
        cos_h = (
            math.sin(altitude * DEG)
            - math.sin(latitude * DEG) * math.sin(decl * DEG)
        ) / (math.cos(latitude * DEG) * math.cos(decl * DEG))
        if cos_h > 1.0 or cos_h < -1.0:
            return None
        hour_angle = math.acos(cos_h) / DEG
        solar_noon_utc = 720.0 - 4.0 * longitude - eot
        minutes_utc = solar_noon_utc + (-hour_angle if rising else hour_angle) * 4.0
        midnight = julian_day(
            datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        )
        jd = midnight + minutes_utc / 1440.0

    return julian_day_to_datetime(jd)
