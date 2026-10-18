"""Today's Google Calendar events.

Uses an OAuth refresh token stored as a repository secret. A refresh token is
long-lived, so the one-time browser consent in ``brief/tools/google_auth.py``
is the only interactive step; after that the bot mints its own short-lived
access tokens. Google's Calendar API is free at this volume.
"""

from __future__ import annotations

import logging
import urllib.parse
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from ..http import fetch, fetch_json

log = logging.getLogger(__name__)

TOKEN_URL = "https://oauth2.googleapis.com/token"
EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/{cal}/events"

#: Read-only is all this bot ever needs.
SCOPE = "https://www.googleapis.com/auth/calendar.readonly"


@dataclass
class Event:
    summary: str
    start: datetime | None
    end: datetime | None
    all_day: bool
    location: str = ""
    calendar: str = ""

    def describe(self, tz: ZoneInfo) -> str:
        if self.all_day or self.start is None:
            return f"all day — {self.summary}"
        label = self.start.astimezone(tz).strftime("%H:%M")
        if self.end is not None:
            label += f"–{self.end.astimezone(tz).strftime('%H:%M')}"
        return f"{label} — {self.summary}"


def access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    """Exchange a refresh token for a short-lived access token."""
    body = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
    ).encode("utf-8")

    import urllib.request

    request = urllib.request.Request(
        TOKEN_URL,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    import json as _json

    with urllib.request.urlopen(request, timeout=15.0) as response:
        payload = _json.loads(response.read())

    token = payload.get("access_token")
    if not token:
        raise RuntimeError("Google did not return an access token")
    return token


def _parse_moment(node: dict, tz: ZoneInfo):
    """Parse a Calendar API start/end node into (datetime, all_day)."""
    if "dateTime" in node:
        raw = node["dateTime"].replace("Z", "+00:00")
        return datetime.fromisoformat(raw), False
    if "date" in node:
        day = date.fromisoformat(node["date"])
        return datetime.combine(day, time(0, 0), tzinfo=tz), True
    return None, False


def fetch_events(
    client_id: str,
    client_secret: str,
    refresh_token: str,
    calendar_ids,
    day: date,
    tz: ZoneInfo,
    limit: int = 12,
) -> list:
    """Today's events across `calendar_ids`, sorted by start time."""
    token = access_token(client_id, client_secret, refresh_token)
    headers = {"Authorization": f"Bearer {token}"}

    window_start = datetime.combine(day, time(0, 0), tzinfo=tz)
    window_end = window_start + timedelta(days=1)

    events: list = []
    for calendar_id in calendar_ids:
        url = EVENTS_URL.format(cal=urllib.parse.quote(calendar_id, safe=""))
        try:
            payload = fetch_json(
                url,
                params={
                    "timeMin": window_start.isoformat(),
                    "timeMax": window_end.isoformat(),
                    "singleEvents": "true",
                    "orderBy": "startTime",
                    "maxResults": str(limit),
                },
                headers=headers,
                retries=2,
            )
        except Exception as exc:
            # One unreadable calendar should not cost you the others.
            log.warning("calendar %s unavailable: %s", calendar_id, exc)
            continue

        label = payload.get("summary", calendar_id)
        for item in payload.get("items", []):
            if item.get("status") == "cancelled":
                continue
            start, all_day = _parse_moment(item.get("start", {}), tz)
            end, _ = _parse_moment(item.get("end", {}), tz)
            events.append(
                Event(
                    summary=item.get("summary", "(no title)"),
                    start=start,
                    end=end,
                    all_day=all_day,
                    location=item.get("location", ""),
                    calendar=label,
                )
            )

    events.sort(key=lambda e: (not e.all_day, e.start or window_start))
    return events[:limit]
