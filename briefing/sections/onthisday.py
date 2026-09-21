"""'On this day' from Wikimedia's free feed API (no key required)."""

from __future__ import annotations

from ..http import HttpError, get_json
from ..telegram import escape
from .base import Context, Section, SectionError

FEED_URL = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected"
MAX_EVENTS = 2


def pick_events(payload: dict, limit: int = MAX_EVENTS) -> list[tuple[int, str]]:
    """Most recent events first — they tend to be the recognisable ones."""
    events = []
    for event in (payload or {}).get("selected", []):
        year = event.get("year")
        text = (event.get("text") or "").strip()
        if isinstance(year, int) and text:
            events.append((year, text))
    events.sort(key=lambda item: item[0], reverse=True)
    return events[:limit]


def build(ctx: Context) -> Section:
    url = f"{FEED_URL}/{ctx.now.month:02d}/{ctx.now.day:02d}"
    try:
        payload = get_json(url)
    except HttpError as exc:
        raise SectionError(str(exc)) from exc

    events = pick_events(payload)
    if not events:
        raise SectionError("No events listed for today")

    lines = [f"• <b>{year}</b> — {escape(text)}" for year, text in events]
    return Section(key="onthisday", title="On this day", lines=lines)
