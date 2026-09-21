"""Configuration, read entirely from environment variables.

Nothing here is secret except the bot token, which never gets logged or
rendered into a message.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

DEFAULT_SECTIONS = ("weather", "news", "onthisday", "quote")
DEFAULT_FEEDS = ("https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",)


class ConfigError(RuntimeError):
    """Raised when a required setting is missing or unusable."""


def _clean(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _float(name: str, default: float) -> float:
    raw = _clean(name)
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} must be a number, got {raw!r}") from exc


def _list(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw = _clean(name)
    if not raw:
        return tuple(default)
    return tuple(item.strip() for item in raw.split(",") if item.strip())


@dataclass(frozen=True)
class Config:
    bot_token: str
    chat_id: str
    timezone: str = "Asia/Kolkata"
    place: str = "Delhi"
    latitude: float = 28.6139
    longitude: float = 77.2090
    units: str = "metric"
    sections: tuple[str, ...] = DEFAULT_SECTIONS
    news_feeds: tuple[str, ...] = DEFAULT_FEEDS
    news_limit: int = 5
    owner_name: str = ""
    # Optional LLM digest. Empty api_key means the section is skipped.
    llm_provider: str = "openai"  # "openai" (any compatible endpoint) or "anthropic"
    llm_api_key: str = field(default="", repr=False)
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"

    @property
    def temperature_unit(self) -> str:
        return "fahrenheit" if self.units == "imperial" else "celsius"

    @property
    def degree_suffix(self) -> str:
        return "F" if self.units == "imperial" else "C"


def load(require_telegram: bool = True) -> Config:
    """Build a Config from the environment.

    With require_telegram=False the token and chat id may be blank, which is
    what --dry-run uses so the briefing can be previewed without credentials.
    """
    token = _clean("TELEGRAM_BOT_TOKEN")
    chat_id = _clean("TELEGRAM_CHAT_ID")
    if require_telegram:
        missing = [
            name
            for name, value in (("TELEGRAM_BOT_TOKEN", token), ("TELEGRAM_CHAT_ID", chat_id))
            if not value
        ]
        if missing:
            raise ConfigError(
                "Missing required environment variable(s): "
                + ", ".join(missing)
                + ". See README.md for how to get them."
            )

    units = _clean("BRIEFING_UNITS", "metric").lower()
    if units not in {"metric", "imperial"}:
        raise ConfigError("BRIEFING_UNITS must be 'metric' or 'imperial'")

    try:
        news_limit = int(_clean("NEWS_LIMIT", "5"))
    except ValueError as exc:
        raise ConfigError("NEWS_LIMIT must be a whole number") from exc
    news_limit = max(1, min(news_limit, 15))

    return Config(
        bot_token=token,
        chat_id=chat_id,
        timezone=_clean("BRIEFING_TZ", "Asia/Kolkata"),
        place=_clean("BRIEFING_PLACE", "Delhi"),
        latitude=_float("BRIEFING_LAT", 28.6139),
        longitude=_float("BRIEFING_LON", 77.2090),
        units=units,
        sections=_list("BRIEFING_SECTIONS", DEFAULT_SECTIONS),
        news_feeds=_list("NEWS_FEEDS", DEFAULT_FEEDS),
        news_limit=news_limit,
        owner_name=_clean("BRIEFING_NAME"),
        llm_provider=_clean("LLM_PROVIDER", "openai").lower(),
        llm_api_key=_clean("LLM_API_KEY"),
        llm_base_url=_clean("LLM_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/"),
        llm_model=_clean("LLM_MODEL", "llama-3.3-70b-versatile"),
    )
