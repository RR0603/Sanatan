"""Weather and air quality from Open-Meteo.

Open-Meteo is free for non-commercial use and needs no API key or signup,
which is what makes the zero-cost version of this bot possible.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from ..http import fetch_json

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

#: WMO weather interpretation codes, condensed to something readable.
WMO_CODES = {
    0: ("Clear sky", "☀️"),
    1: ("Mainly clear", "\U0001f324️"),
    2: ("Partly cloudy", "⛅"),
    3: ("Overcast", "☁️"),
    45: ("Fog", "\U0001f32b️"),
    48: ("Freezing fog", "\U0001f32b️"),
    51: ("Light drizzle", "\U0001f326️"),
    53: ("Drizzle", "\U0001f326️"),
    55: ("Heavy drizzle", "\U0001f326️"),
    56: ("Freezing drizzle", "\U0001f327️"),
    57: ("Freezing drizzle", "\U0001f327️"),
    61: ("Light rain", "\U0001f327️"),
    63: ("Rain", "\U0001f327️"),
    65: ("Heavy rain", "\U0001f327️"),
    66: ("Freezing rain", "\U0001f327️"),
    67: ("Freezing rain", "\U0001f327️"),
    71: ("Light snow", "\U0001f328️"),
    73: ("Snow", "\U0001f328️"),
    75: ("Heavy snow", "\U0001f328️"),
    77: ("Snow grains", "\U0001f328️"),
    80: ("Light showers", "\U0001f326️"),
    81: ("Showers", "\U0001f326️"),
    82: ("Violent showers", "⛈️"),
    85: ("Snow showers", "\U0001f328️"),
    86: ("Snow showers", "\U0001f328️"),
    95: ("Thunderstorm", "⛈️"),
    96: ("Thunderstorm with hail", "⛈️"),
    99: ("Thunderstorm with hail", "⛈️"),
}

#: Indian National AQI bands (CPCB), which is what "AQI" means locally.
#: Open-Meteo reports both a European and an Indian AQI; we use the Indian one.
AQI_BANDS = (
    (50, "Good", "\U0001f7e2"),
    (100, "Satisfactory", "\U0001f7e1"),
    (200, "Moderate", "\U0001f7e0"),
    (300, "Poor", "\U0001f534"),
    (400, "Very Poor", "\U0001f7e3"),
    (10**9, "Severe", "⚫"),
)


def describe_code(code) -> tuple:
    """Map a WMO code to (description, emoji), tolerating unknown codes."""
    try:
        return WMO_CODES[int(code)]
    except (KeyError, TypeError, ValueError):
        return ("Unsettled", "\U0001f321️")


def aqi_band(value) -> tuple:
    """Map an AQI number to its (label, emoji) CPCB band."""
    try:
        value = float(value)
    except (TypeError, ValueError):
        return ("unknown", "❔")
    for ceiling, label, emoji in AQI_BANDS:
        if value <= ceiling:
            return (label, emoji)
    return ("Severe", "⚫")


@dataclass
class Weather:
    condition: str
    emoji: str
    temp_min: float | None
    temp_max: float | None
    feels_max: float | None
    precipitation_mm: float | None
    precipitation_chance: int | None
    wind_max: float | None
    uv_index: float | None
    aqi: float | None = None
    aqi_label: str | None = None
    aqi_emoji: str | None = None
    pm25: float | None = None


def _first(series, default=None):
    if isinstance(series, list) and series:
        return series[0]
    return default


def fetch_weather(latitude: float, longitude: float, timezone: str, day: date) -> Weather:
    """One day's forecast for a place. Raises on failure; callers fail soft."""
    payload = fetch_json(
        FORECAST_URL,
        params={
            "latitude": f"{latitude:.4f}",
            "longitude": f"{longitude:.4f}",
            "daily": ",".join(
                (
                    "weather_code",
                    "temperature_2m_min",
                    "temperature_2m_max",
                    "apparent_temperature_max",
                    "precipitation_sum",
                    "precipitation_probability_max",
                    "wind_speed_10m_max",
                    "uv_index_max",
                )
            ),
            "timezone": timezone,
            "start_date": day.isoformat(),
            "end_date": day.isoformat(),
        },
    )
    daily = payload.get("daily") or {}
    condition, emoji = describe_code(_first(daily.get("weather_code")))

    return Weather(
        condition=condition,
        emoji=emoji,
        temp_min=_first(daily.get("temperature_2m_min")),
        temp_max=_first(daily.get("temperature_2m_max")),
        feels_max=_first(daily.get("apparent_temperature_max")),
        precipitation_mm=_first(daily.get("precipitation_sum")),
        precipitation_chance=_first(daily.get("precipitation_probability_max")),
        wind_max=_first(daily.get("wind_speed_10m_max")),
        uv_index=_first(daily.get("uv_index_max")),
    )


def add_air_quality(weather: Weather, latitude: float, longitude: float, timezone: str):
    """Attach air quality to `weather`, leaving it untouched on failure."""
    payload = fetch_json(
        AIR_QUALITY_URL,
        params={
            "latitude": f"{latitude:.4f}",
            "longitude": f"{longitude:.4f}",
            "current": "indian_aqi,pm2_5",
            "timezone": timezone,
        },
    )
    current = payload.get("current") or {}
    aqi = current.get("indian_aqi")
    if aqi is not None:
        label, emoji = aqi_band(aqi)
        weather.aqi = aqi
        weather.aqi_label = label
        weather.aqi_emoji = emoji
    weather.pm25 = current.get("pm2_5")
    return weather
