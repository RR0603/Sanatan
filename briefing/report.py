"""Builds the whole briefing: runs every configured section, then renders."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Callable

from . import digest
from .config import Config
from .sections import news, onthisday, quote, weather
from .sections.base import Context, Section, SectionError
from .telegram import escape

LOG = logging.getLogger(__name__)

Builder = Callable[[Context], Section]

REGISTRY: dict[str, Builder] = {
    "weather": weather.build,
    "news": news.build,
    "onthisday": onthisday.build,
    "quote": quote.build,
}

# Headings used when a section fails before it can name itself.
FALLBACK_TITLES: dict[str, str] = {
    "weather": "Weather",
    "news": "Top stories",
    "onthisday": "On this day",
    "quote": "Thought for the day",
}


def _fallback_title(key: str) -> str:
    return FALLBACK_TITLES.get(key, key.replace("_", " ").title())


def local_now(tz_name: str) -> datetime:
    """Current time in the configured zone, falling back to UTC if unknown."""
    try:
        from zoneinfo import ZoneInfo

        return datetime.now(ZoneInfo(tz_name))
    except Exception:  # unknown zone, or no tzdata on the host
        LOG.warning("Unknown timezone %r, falling back to UTC", tz_name)
        return datetime.now(timezone.utc)


def build_sections(ctx: Context) -> list[Section]:
    """Run each section in order. A failure degrades that section only."""
    built: list[Section] = []
    for key in ctx.config.sections:
        builder = REGISTRY.get(key)
        if builder is None:
            LOG.warning("Ignoring unknown section %r", key)
            continue
        try:
            built.append(builder(ctx))
        except SectionError as exc:
            LOG.warning("Section %s failed: %s", key, exc)
            built.append(Section(key=key, title=_fallback_title(key), error=str(exc)))
        except Exception as exc:  # a bug in one section must not kill the send
            LOG.exception("Section %s crashed", key)
            built.append(
                Section(
                    key=key,
                    title=_fallback_title(key),
                    error=f"{type(exc).__name__}: {exc}",
                )
            )
    return built


def greeting(now: datetime, name: str = "") -> str:
    hour = now.hour
    if hour < 12:
        word = "Good morning"
    elif hour < 17:
        word = "Good afternoon"
    else:
        word = "Good evening"
    return f"{word}, {name}" if name else word


def render(sections: list[Section], now: datetime, name: str = "", intro: str = "") -> str:
    parts = [
        f"\U0001f305 <b>{escape(greeting(now, name))}</b>",
        escape(now.strftime("%A, %d %B %Y")),
    ]
    head = "\n".join(parts)
    blocks = [head]

    if intro:
        blocks.append(digest.render(intro))

    for section in sections:
        if section.error:
            blocks.append(
                f"<b>{escape(section.title)}</b>\n<i>Unavailable right now.</i>"
            )
            continue
        if not section.lines:
            continue
        body = "\n".join(section.lines)
        blocks.append(f"<b>{escape(section.title)}</b>\n{body}")

    return "\n\n".join(blocks)


def build_message(config: Config, now: datetime | None = None) -> str:
    moment = now or local_now(config.timezone)
    ctx = Context(config=config, now=moment)
    sections = build_sections(ctx)
    intro = digest.summarise(config, sections)
    return render(sections, moment, config.owner_name, intro)
