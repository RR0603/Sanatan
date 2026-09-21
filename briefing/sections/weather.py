"""Today's weather from Open-Meteo (free, no API key, no sign-up)."""

from __future__ import annotations

from ..http import HttpError, get_json
from ..telegram import escape
from .base import Context, Section, SectionError

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather interpretation codes -> (emoji, description)
WEATHER_CODES: dict[int, tuple[str, str]] = {
    0: ("☀️", "Clear sky"),
    1: ("\U0001f324️", "Mainly clear"),
    2: ("⛅", "Partly cloudy"),
    3: ("☁️", "Overcast"),
    45: ("\U0001f32b️", "Fog"),
    48: ("\U0001f32b️", "Freezing fog"),
    51: ("\U0001f327️", "Light drizzle"),
    53: ("\U0001f327️", "Drizzle"),
    55: ("\U0001f327️", "Heavy drizzle"),
    56: ("\U0001f327️", "Freezing drizzle"),
    57: ("\U0001f327️", "Freezing drizzle"),
    61: ("\U0001f327️", "Light rain"),
    63: ("\U0001f327️", "Rain"),
    65: ("\U0001f327️", "Heavy rain"),
    66: ("\U0001f327️", "Freezing rain"),
    67: ("\U0001f327️", "Freezing rain"),
    71: ("\U0001f328️", "Light snow"),
    73: ("\U0001f328️", "Snow"),
    75: ("\U0001f328️", "Heavy snow"),
    77: ("\U0001f328️", "Snow grains"),
    80: ("\U0001f326️", "Rain showers"),
    81: ("\U0001f326️", "Rain showers"),
    82: ("\U0001f326️", "Violent rain showers"),
    85: ("\U0001f328️", "Snow showers"),
    86: ("\U0001f328️", "Heavy snow showers"),
    95: ("⛈️", "Thunderstorm"),
    96: ("⛈️", "Thunderstorm with hail"),
    99: ("⛈️", "Thunderstorm with hail"),
}


def describe_code(code: int | None) -> tuple[str, str]:
    if code is None:
        return ("\U0001f321️", "Weather")
    return WEATHER_CODES.get(int(code), ("\U0001f321️", "Mixed conditions"))


def advice(high: float | None, low: float | None, rain_chance: int | None, units: str) -> str:
    """One practical line: the only part of a forecast anyone acts on."""
    tips: list[str] = []
    if rain_chance is not None and rain_chance >= 40:
        tips.append("carry an umbrella")
    hot = 35 if units == "metric" else 95
    cold = 12 if units == "metric" else 54
    if high is not None and high >= hot:
        tips.append("stay hydrated, avoid midday sun")
    if low is not None and low <= cold:
        tips.append("layer up, it's cold out")
    return ", ".join(tips)


def build(ctx: Context) -> Section:
    cfg = ctx.config
    try:
        data = get_json(
            FORECAST_URL,
            params={
                "latitude": cfg.latitude,
                "longitude": cfg.longitude,
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,"
                "precipitation_probability_max,sunrise,sunset",
                "current": "temperature_2m,apparent_temperature,weather_code",
                "timezone": cfg.timezone,
                "temperature_unit": cfg.temperature_unit,
                "forecast_days": 1,
            },
        )
    except HttpError as exc:
        raise SectionError(str(exc)) from exc

    daily = (data or {}).get("daily") or {}
    current = (data or {}).get("current") or {}
    if not daily:
        raise SectionError("Open-Meteo returned no daily forecast")

    deg = cfg.degree_suffix
    high = _first(daily.get("temperature_2m_max"))
    low = _first(daily.get("temperature_2m_min"))
    rain = _first(daily.get("precipitation_probability_max"))
    emoji, description = describe_code(_first(daily.get("weather_code")))

    lines = [f"{emoji} {escape(description)}, {_temp(low, deg)} to {_temp(high, deg)}"]

    now_temp = current.get("temperature_2m")
    feels = current.get("apparent_temperature")
    if now_temp is not None:
        right_now = f"Right now {_temp(now_temp, deg)}"
        if feels is not None and abs(float(feels) - float(now_temp)) >= 2:
            right_now += f" (feels like {_temp(feels, deg)})"
        lines.append(right_now)

    if rain is not None:
        lines.append(f"Chance of rain {int(rain)}%")

    sunrise = _clock(_first(daily.get("sunrise")))
    sunset = _clock(_first(daily.get("sunset")))
    if sunrise and sunset:
        lines.append(f"Sunrise {sunrise} · Sunset {sunset}")

    tip = advice(_as_float(high), _as_float(low), _as_int(rain), cfg.units)
    if tip:
        lines.append(f"\U0001f4a1 {escape(tip.capitalize())}")

    return Section(key="weather", title=f"Weather in {cfg.place}", lines=lines)


def _first(values: object) -> object:
    if isinstance(values, list) and values:
        return values[0]
    return None


def _as_float(value: object) -> float | None:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _as_int(value: object) -> int | None:
    number = _as_float(value)
    return None if number is None else int(number)


def _temp(value: object, deg: str) -> str:
    number = _as_float(value)
    if number is None:
        return "?"
    return f"{round(number)}°{deg}"


def _clock(iso: object) -> str:
    """Open-Meteo returns local times as 'YYYY-MM-DDTHH:MM'."""
    if not isinstance(iso, str) or "T" not in iso:
        return ""
    return iso.split("T", 1)[1][:5]
