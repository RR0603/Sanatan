"""Configuration: a JSON file for preferences, environment for secrets.

Secrets never belong in the repository, so the bot token and chat id are read
from the environment (GitHub Actions injects them from repository secrets).
Everything else -- where you are, what sections you want, how they are worded
-- lives in ``config.json`` so you can change it without touching code.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = REPO_ROOT / "config.json"

#: Sections rendered, in order. Unknown names in config.json are rejected
#: loudly rather than silently dropped -- a typo should not quietly cost you
#: a section of your brief.
KNOWN_SECTIONS = (
    "greeting",
    "panchang",
    "weather",
    "calendar",
    "news",
    "shloka",
)


class ConfigError(RuntimeError):
    """Raised when configuration is missing or self-contradictory."""


@dataclass
class Location:
    name: str = "Delhi"
    latitude: float = 28.6139
    longitude: float = 77.2090
    timezone: str = "Asia/Kolkata"

    @property
    def tz(self) -> ZoneInfo:
        try:
            return ZoneInfo(self.timezone)
        except ZoneInfoNotFoundError as exc:
            raise ConfigError(f"unknown timezone {self.timezone!r}") from exc

    def validate(self) -> None:
        if not -90.0 <= self.latitude <= 90.0:
            raise ConfigError(f"latitude {self.latitude} is out of range")
        if not -180.0 <= self.longitude <= 180.0:
            raise ConfigError(f"longitude {self.longitude} is out of range")
        self.tz  # raises if the zone name is bad


@dataclass
class Config:
    location: Location = field(default_factory=Location)
    sections: tuple = KNOWN_SECTIONS
    #: Display name used in the greeting.
    name: str = ""
    #: Hacker News / RSS feeds to pull headlines from.
    news_feeds: tuple = ()
    news_limit: int = 5
    #: Include a Bhagavad Gita verse.
    shloka_enabled: bool = True
    #: Telegram credentials, from the environment.
    bot_token: str = ""
    chat_id: str = ""
    #: Google Calendar credentials, from the environment. All three or none.
    google_client_id: str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""
    calendar_ids: tuple = ("primary",)

    @property
    def tz(self) -> ZoneInfo:
        return self.location.tz

    @property
    def google_calendar_ready(self) -> bool:
        return bool(
            self.google_client_id
            and self.google_client_secret
            and self.google_refresh_token
        )

    def require_telegram(self) -> None:
        missing = [
            env
            for env, value in (
                ("TELEGRAM_BOT_TOKEN", self.bot_token),
                ("TELEGRAM_CHAT_ID", self.chat_id),
            )
            if not value
        ]
        if missing:
            raise ConfigError(
                "missing required environment variable(s): "
                + ", ".join(missing)
                + ". See README.md -> Setup."
            )


DEFAULT_FEEDS = (
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.thehindu.com/news/national/feeder/default.rss",
)


def load(path: Path | None = None, env: dict | None = None) -> Config:
    """Build a :class:`Config` from `path` (JSON) overlaid with `env` secrets."""
    env = os.environ if env is None else env
    path = DEFAULT_CONFIG_PATH if path is None else Path(path)

    raw: dict = {}
    if path.exists():
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ConfigError(f"{path} is not valid JSON: {exc}") from exc
        if not isinstance(raw, dict):
            raise ConfigError(f"{path} must contain a JSON object")

    loc_raw = raw.get("location", {}) or {}
    if not isinstance(loc_raw, dict):
        raise ConfigError("config 'location' must be an object")
    location = Location(
        name=str(loc_raw.get("name", Location.name)),
        latitude=float(loc_raw.get("latitude", Location.latitude)),
        longitude=float(loc_raw.get("longitude", Location.longitude)),
        timezone=str(loc_raw.get("timezone", Location.timezone)),
    )
    location.validate()

    sections = tuple(raw.get("sections", KNOWN_SECTIONS))
    unknown = [s for s in sections if s not in KNOWN_SECTIONS]
    if unknown:
        raise ConfigError(
            f"unknown section(s) in config: {', '.join(unknown)}. "
            f"Valid sections: {', '.join(KNOWN_SECTIONS)}"
        )

    feeds = tuple(raw.get("news_feeds", DEFAULT_FEEDS))
    news_limit = int(raw.get("news_limit", Config.news_limit))
    if news_limit < 0:
        raise ConfigError("news_limit cannot be negative")

    calendar_ids = tuple(raw.get("calendar_ids", ("primary",)))

    return Config(
        location=location,
        sections=sections,
        name=str(raw.get("name", "")),
        news_feeds=feeds,
        news_limit=news_limit,
        shloka_enabled=bool(raw.get("shloka_enabled", True)),
        bot_token=env.get("TELEGRAM_BOT_TOKEN", "").strip(),
        chat_id=env.get("TELEGRAM_CHAT_ID", "").strip(),
        google_client_id=env.get("GOOGLE_CLIENT_ID", "").strip(),
        google_client_secret=env.get("GOOGLE_CLIENT_SECRET", "").strip(),
        google_refresh_token=env.get("GOOGLE_REFRESH_TOKEN", "").strip(),
        calendar_ids=calendar_ids,
    )
