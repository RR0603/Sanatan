"""The five limbs of the Panchang, plus day-timings, from local computation.

Everything here is derived from :mod:`brief.panchang.astro`; no network call is
involved, so this section of the brief can never fail because a service is down.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from . import names
from .astro import (
    CIVIL_TWILIGHT_ALTITUDE,
    centuries_tt,
    julian_day,
    lunar_longitude,
    norm360,
    sidereal,
    solar_event,
    solar_longitude,
)

TITHI_ARC = 12.0
KARANA_ARC = 6.0
NAKSHATRA_ARC = 360.0 / 27.0
YOGA_ARC = 360.0 / 27.0
RASHI_ARC = 30.0


# --------------------------------------------------------------------------
# Angle accessors -- each is monotonically increasing in time, which is what
# makes the bisection below safe. The Moon never retrogrades in longitude, and
# its mean motion (~13.2 deg/day) always exceeds the Sun's (~1 deg/day), so
# the elongation and the yoga sum both rise without turning back.
# --------------------------------------------------------------------------


def elongation(moment: datetime) -> float:
    """Moon minus Sun, degrees in [0, 360). Drives tithi and karana."""
    t = centuries_tt(julian_day(moment))
    return norm360(lunar_longitude(t) - solar_longitude(t))


def sidereal_moon(moment: datetime) -> float:
    """Nirayana lunar longitude, degrees. Drives nakshatra and moon sign."""
    t = centuries_tt(julian_day(moment))
    return sidereal(lunar_longitude(t), t)


def sidereal_sun(moment: datetime) -> float:
    """Nirayana solar longitude, degrees. Drives the solar month."""
    t = centuries_tt(julian_day(moment))
    return sidereal(solar_longitude(t), t)


def yoga_sum(moment: datetime) -> float:
    """Sum of nirayana solar and lunar longitudes, degrees. Drives yoga."""
    t = centuries_tt(julian_day(moment))
    total = sidereal(lunar_longitude(t), t) + sidereal(solar_longitude(t), t)
    return norm360(total)


def _signed_offset(value: float, target: float) -> float:
    """Map ``value - target`` into (-180, 180]; negative before the crossing."""
    return ((value - target + 180.0) % 360.0) - 180.0


def next_crossing(
    start: datetime,
    angle_fn,
    target: float,
    search_days: float = 3.0,
    tolerance_seconds: float = 2.0,
):
    """When does `angle_fn` next reach `target` degrees, at or after `start`?

    Relies on `angle_fn` increasing monotonically, which holds for every angle
    in this module. Returns ``None`` if no crossing falls inside `search_days`.
    """
    lo = start
    if _signed_offset(angle_fn(lo), target) >= 0:
        return lo

    hi = start + timedelta(days=search_days)
    if _signed_offset(angle_fn(hi), target) < 0:
        return None

    while (hi - lo).total_seconds() > tolerance_seconds:
        mid = lo + (hi - lo) / 2
        if _signed_offset(angle_fn(mid), target) < 0:
            lo = mid
        else:
            hi = mid
    return hi


@dataclass
class Limb:
    """One limb of the Panchang: which division is current, and until when."""

    index: int
    name: str
    ends_at: datetime | None = None
    #: The division that takes over, when this one ends during the day.
    next_name: str | None = None

    def describe(self, tz: ZoneInfo) -> str:
        if self.ends_at is None:
            return self.name
        local = self.ends_at.astimezone(tz)
        text = f"{self.name} till {local.strftime('%H:%M')}"
        if self.next_name:
            text += f", then {self.next_name}"
        return text


def _limb(
    moment: datetime,
    angle_fn,
    arc: float,
    name_table,
    index_offset: int = 0,
) -> Limb:
    """Resolve the current division of `angle_fn` and its end time."""
    value = angle_fn(moment)
    index = int(value // arc)
    boundary = (index + 1) * arc
    ends_at = next_crossing(moment, angle_fn, boundary % 360.0)
    count = len(name_table)
    name = name_table[(index + index_offset) % count]
    next_name = name_table[(index + 1 + index_offset) % count] if ends_at else None
    return Limb(index=index, name=name, ends_at=ends_at, next_name=next_name)


def karana_name(half_tithi_index: int) -> str:
    """Name the karana for a 0-based half-tithi index in [0, 60)."""
    i = half_tithi_index % 60
    if i == 0:
        return names.FIXED_KARANAS[0]          # Kimstughna
    if i >= 57:
        return names.FIXED_KARANAS[i - 56]     # Shakuni, Chatushpada, Naga
    return names.CHARA_KARANAS[(i - 1) % 7]


# --------------------------------------------------------------------------
# Day timings
# --------------------------------------------------------------------------


@dataclass
class Window:
    """A named span of the day."""

    label: str
    start: datetime
    end: datetime

    def describe(self, tz: ZoneInfo) -> str:
        return (
            f"{self.start.astimezone(tz).strftime('%H:%M')}"
            f"–{self.end.astimezone(tz).strftime('%H:%M')}"
        )

    def contains(self, moment: datetime) -> bool:
        return self.start <= moment < self.end


def _segment(sunrise: datetime, sunset: datetime, index_1based: int, parts: int):
    """The `index_1based`-th of `parts` equal divisions of the daylight span.

    Both edges are taken as a fraction of the whole span rather than by adding
    one segment width repeatedly, so the last division ends exactly at sunset
    instead of drifting past it by a few microseconds.
    """
    daylight = sunset - sunrise
    start = sunrise + daylight * ((index_1based - 1) / parts)
    end = sunrise + daylight * (index_1based / parts)
    return Window("", start, end)


@dataclass
class Panchang:
    """A full day's Panchang for one place."""

    day: date
    tz: ZoneInfo
    sunrise: datetime | None
    sunset: datetime | None
    first_light: datetime | None
    tithi: Limb
    paksha: str
    nakshatra: Limb
    yoga: Limb
    karana: Limb
    moon_sign: str
    sun_sign: str
    vara: str
    vara_english: str
    masa: str
    vikram_samvat: int
    shaka_samvat: int
    windows: list = field(default_factory=list)
    observances: list = field(default_factory=list)

    def window(self, label: str):
        for w in self.windows:
            if w.label == label:
                return w
        return None


def _lunar_month(reference: datetime) -> str:
    """Amanta lunar month: the solar sign occupied at the preceding new moon."""
    # Step back to the new moon that opened the current lunar month.
    elong = elongation(reference)
    days_since_new = elong / 360.0 * 29.530588
    approx_new = reference - timedelta(days=days_since_new)
    # Refine: walk back a little, then find the next 0 crossing.
    search_from = approx_new - timedelta(days=1.5)
    new_moon = next_crossing(search_from, elongation, 0.0, search_days=3.5)
    if new_moon is None:
        new_moon = approx_new
    rashi_at_new_moon = int(sidereal_sun(new_moon) // RASHI_ARC)
    return names.MASAS[rashi_at_new_moon % 12]


# IMPORTANT -- accuracy boundary.
#
# The five limbs and the day-timings above are computed from the ephemeris and
# are accurate to a couple of minutes. Named annual festivals are NOT in the
# same class. Which Gregorian day a festival lands on depends on per-festival
# "prevailing tithi" rules (sunrise vs dusk vs midnight) and on tie-breaks that
# differ between regional almanacs, so a purely tithi-matching table like this
# one can be a day out either way.
#
# We therefore apply one consistent, documented rule -- the tithi current at
# sunrise -- and label the output as indicative. Treat these as a prompt to
# check your own panchang, not as an authority. The recurring observances
# below (Ekadashi, Purnima, Amavasya, Pradosh, Sankashti) are exact, because
# they are nothing more than "which tithi is it today".
#
# The rule constants stay so a future change can refine individual festivals
# against a trusted reference almanac.
SUNRISE, PRADOSH, NISHITA = "sunrise", "pradosh", "nishita"

#: Major observances keyed by (masa, paksha, tithi name) -> (name, rule).
#: Paksha is "Shukla" (waxing) or "Krishna" (waning).
_FESTIVALS = {
    ("Chaitra", "Shukla", "Pratipada"): ("Gudi Padwa / Ugadi — Vikram Samvat new year", SUNRISE),
    ("Chaitra", "Shukla", "Navami"): ("Ram Navami", SUNRISE),
    ("Vaishakha", "Shukla", "Tritiya"): ("Akshaya Tritiya", SUNRISE),
    ("Vaishakha", "Shukla", "Purnima"): ("Buddha Purnima", SUNRISE),
    ("Ashadha", "Shukla", "Dwitiya"): ("Rath Yatra", SUNRISE),
    ("Ashadha", "Shukla", "Purnima"): ("Guru Purnima", SUNRISE),
    ("Shravana", "Shukla", "Panchami"): ("Naga Panchami", SUNRISE),
    ("Shravana", "Shukla", "Purnima"): ("Raksha Bandhan", SUNRISE),
    ("Shravana", "Krishna", "Ashtami"): ("Krishna Janmashtami", SUNRISE),
    ("Bhadrapada", "Shukla", "Chaturthi"): ("Ganesh Chaturthi", SUNRISE),
    ("Bhadrapada", "Shukla", "Purnima"): ("Anant Chaturdashi / Pitru Paksha begins", SUNRISE),
    ("Ashwina", "Shukla", "Pratipada"): ("Sharad Navaratri begins", SUNRISE),
    ("Ashwina", "Shukla", "Ashtami"): ("Durga Ashtami", SUNRISE),
    ("Ashwina", "Shukla", "Navami"): ("Maha Navami", SUNRISE),
    ("Ashwina", "Shukla", "Dashami"): ("Vijayadashami / Dussehra", SUNRISE),
    ("Ashwina", "Krishna", "Trayodashi"): ("Dhanteras", SUNRISE),
    ("Ashwina", "Krishna", "Amavasya"): ("Diwali — Lakshmi Puja", SUNRISE),
    ("Kartika", "Shukla", "Pratipada"): ("Govardhan Puja", SUNRISE),
    ("Kartika", "Shukla", "Dwitiya"): ("Bhai Dooj", SUNRISE),
    ("Kartika", "Shukla", "Shashthi"): ("Chhath Puja", SUNRISE),
    ("Kartika", "Shukla", "Purnima"): ("Kartik Purnima / Dev Diwali", SUNRISE),
    ("Margashirsha", "Shukla", "Ekadashi"): ("Mokshada Ekadashi", SUNRISE),
    ("Pausha", "Shukla", "Purnima"): ("Shakambhari Purnima", SUNRISE),
    ("Magha", "Shukla", "Panchami"): ("Vasant Panchami", SUNRISE),
    ("Magha", "Shukla", "Purnima"): ("Magha Purnima", SUNRISE),
    ("Phalguna", "Krishna", "Chaturdashi"): ("Maha Shivaratri", SUNRISE),
    ("Phalguna", "Shukla", "Purnima"): ("Holika Dahan / Holi", SUNRISE),
}


def _tithi_at(moment: datetime):
    """The (paksha, tithi name) running at `moment`."""
    index = int(elongation(moment) // TITHI_ARC)
    return ("Shukla" if index < 15 else "Krishna"), names.TITHIS[index % 30]


def _observances(masa: str, readings: dict, tithi_name: str, vara_index: int) -> list:
    """Recurring and annual observances that fall on this day.

    `readings` maps each rule (sunrise/pradosh/nishita) to the (paksha, tithi)
    running at that moment, so a festival is matched against the moment its
    tradition actually uses.
    """
    found = []
    for (f_masa, f_paksha, f_tithi), (label, rule) in _FESTIVALS.items():
        if f_masa != masa:
            continue
        if readings.get(rule) == (f_paksha, f_tithi):
            found.append(label)

    paksha = readings[SUNRISE][0]
    if tithi_name == "Ekadashi":
        found.append("Ekadashi — fasting day")
    elif tithi_name == "Purnima":
        found.append("Purnima — full moon")
    elif tithi_name == "Amavasya":
        found.append("Amavasya — new moon")
    elif tithi_name == "Chaturthi" and paksha == "Krishna":
        found.append("Sankashti Chaturthi")
    elif tithi_name == "Trayodashi":
        found.append("Pradosh Vrat")

    if tithi_name == "Chaturdashi" and paksha == "Krishna" and vara_index == 1:
        found.append("Somvati connection — Shiva observance")

    return found


def compute(
    day: date,
    latitude: float,
    longitude: float,
    tz: ZoneInfo,
    reference_time: datetime | None = None,
) -> Panchang:
    """Compute the Panchang for `day` at the given place.

    The Hindu day runs from sunrise to sunrise, so the limbs are read at
    sunrise unless `reference_time` says otherwise.
    """
    sunrise = solar_event(day, latitude, longitude, rising=True)
    sunset = solar_event(day, latitude, longitude, rising=False)
    first_light = solar_event(
        day, latitude, longitude, rising=True, altitude=CIVIL_TWILIGHT_ALTITUDE
    )

    moment = reference_time or sunrise
    if moment is None:  # polar day or night: fall back to local 06:00
        moment = datetime(day.year, day.month, day.day, 6, 0, tzinfo=tz)

    tithi = _limb(moment, elongation, TITHI_ARC, names.TITHIS)
    nakshatra = _limb(moment, sidereal_moon, NAKSHATRA_ARC, names.NAKSHATRAS)
    yoga = _limb(moment, yoga_sum, YOGA_ARC, names.YOGAS)

    karana_index = int(elongation(moment) // KARANA_ARC)
    karana_end = next_crossing(
        moment, elongation, ((karana_index + 1) * KARANA_ARC) % 360.0
    )
    karana = Limb(
        index=karana_index,
        name=karana_name(karana_index),
        ends_at=karana_end,
        next_name=karana_name(karana_index + 1) if karana_end else None,
    )

    paksha = "Shukla" if tithi.index < 15 else "Krishna"
    moon_sign_index = int(sidereal_moon(moment) // RASHI_ARC)
    sun_sign_index = int(sidereal_sun(moment) // RASHI_ARC)

    vara_index = datetime(day.year, day.month, day.day).isoweekday() % 7
    masa = _lunar_month(moment)

    # Vikram Samvat rolls over at Chaitra Shukla Pratipada; Shaka at the same
    # point. Before that the year is still the previous one.
    year_rolled = masa != "Chaitra" or paksha == "Krishna"
    vikram = day.year + 57 if year_rolled else day.year + 56
    shaka = day.year - 78 if year_rolled else day.year - 79

    # Read the tithi at the three moments different traditions key festivals to.
    local_midnight = datetime(day.year, day.month, day.day, 23, 59, tzinfo=tz)
    tithi_readings = {SUNRISE: (paksha, tithi.name)}
    if sunset is not None:
        tithi_readings[PRADOSH] = _tithi_at(sunset + timedelta(minutes=24))
    else:
        tithi_readings[PRADOSH] = tithi_readings[SUNRISE]
    tithi_readings[NISHITA] = _tithi_at(local_midnight)

    windows = []
    if sunrise and sunset:
        for label, table in (
            ("Rahu Kaal", names.RAHU_KAAL_SEGMENT),
            ("Yama Ganda", names.YAMA_GANDA_SEGMENT),
            ("Gulika Kaal", names.GULIKA_SEGMENT),
        ):
            seg = _segment(sunrise, sunset, table[vara_index], 8)
            windows.append(Window(label, seg.start, seg.end))

        abhijit = _segment(sunrise, sunset, 8, 15)
        windows.append(Window("Abhijit Muhurta", abhijit.start, abhijit.end))

        windows.append(
            Window(
                "Brahma Muhurta",
                sunrise - timedelta(minutes=96),
                sunrise - timedelta(minutes=48),
            )
        )

    return Panchang(
        day=day,
        tz=tz,
        sunrise=sunrise,
        sunset=sunset,
        first_light=first_light,
        tithi=tithi,
        paksha=paksha,
        nakshatra=nakshatra,
        yoga=yoga,
        karana=karana,
        moon_sign=f"{names.RASHIS[moon_sign_index]} ({names.RASHI_ENGLISH[moon_sign_index]})",
        sun_sign=f"{names.RASHIS[sun_sign_index]} ({names.RASHI_ENGLISH[sun_sign_index]})",
        vara=names.VARAS[vara_index],
        vara_english=names.VARA_ENGLISH[vara_index],
        masa=masa,
        vikram_samvat=vikram,
        shaka_samvat=shaka,
        windows=windows,
        observances=_observances(masa, tithi_readings, tithi.name, vara_index),
    )
