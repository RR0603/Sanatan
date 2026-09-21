"""Understanding the many ways a person says 'when'."""

from __future__ import annotations

import re
import time
from datetime import datetime

# Longest unit first: otherwise "2 minutes" matches the bare "m" branch and
# leaves "inutes" behind.
DURATION_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*"
    r"(seconds?|secs|sec|s|minutes?|mins|min|m|hours?|hrs|hr|h|days?|d|weeks?|w)"
    r"(?![a-z])",
    re.I)
UNIT_SECONDS = {
    "s": 1, "sec": 1, "secs": 1, "second": 1, "seconds": 1,
    "m": 60, "min": 60, "mins": 60, "minute": 60, "minutes": 60,
    "h": 3600, "hr": 3600, "hrs": 3600, "hour": 3600, "hours": 3600,
    "d": 86400, "day": 86400, "days": 86400,
    "w": 604800, "week": 604800, "weeks": 604800,
}

DATE_FORMATS = [
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%dT%H:%M",
    "%Y-%m-%d",
    "%H:%M:%S",
    "%H:%M",
]


class WhenError(ValueError):
    pass


def parse_duration(text: str) -> float | None:
    """'90s', '10m', '1h30m', '2 days' -> seconds. ``None`` if not a duration."""
    text = text.strip().lower()
    if not text:
        return None
    matches = list(DURATION_RE.finditer(text))
    if not matches:
        return None
    # Guard against '2026-09-21' being read as '2026 seconds'.
    if "".join(m.group(0).replace(" ", "") for m in matches) != text.replace(" ", ""):
        return None
    total = 0.0
    for match in matches:
        total += float(match.group(1)) * UNIT_SECONDS[match.group(2).lower()]
    return total


def parse_when(spec: str, now: float | None = None) -> tuple[str, float]:
    """Classify a 'when' argument.

    Returns ``("frame", seq)``, ``("time", epoch)`` or ``("steps", n)``.
    """
    now = time.time() if now is None else now
    text = spec.strip()
    if not text:
        raise WhenError("say when: a duration like '10m', a frame like 'f00012', "
                        "a time like '2026-09-21 14:00', or 'start'")

    lowered = text.lower()
    if lowered in ("start", "beginning", "first", "oldest"):
        return "frame", 1
    if lowered in ("now", "latest", "end", "newest", "live"):
        return "frame", -1

    # -3 means "three frames back".
    if re.fullmatch(r"-\d+", text):
        return "steps", int(text[1:])

    # f00012 or a bare frame number.
    match = re.fullmatch(r"f?(\d+)", text, re.I)
    if match and (text.lower().startswith("f") or len(match.group(1)) <= 6):
        seconds = parse_duration(text)
        if seconds is None or text.lower().startswith("f"):
            return "frame", int(match.group(1))

    seconds = parse_duration(text)
    if seconds is not None:
        if seconds <= 0:
            raise WhenError(f"'{spec}' is not a length of time you can go back")
        return "time", now - seconds

    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(text, fmt)
        except ValueError:
            continue
        if "%Y" not in fmt:
            today = datetime.fromtimestamp(now)
            parsed = parsed.replace(year=today.year, month=today.month, day=today.day)
        return "time", parsed.timestamp()

    raise WhenError(
        f"'{spec}' is not a moment I recognise. Try '10m', '2h30m', 'f00012', "
        f"'2026-09-21 14:00', or 'start'.")


def ago(ts: float, now: float | None = None) -> str:
    """'3 minutes ago', the way a person would say it."""
    now = time.time() if now is None else now
    delta = max(0.0, now - ts)
    if delta < 10:
        return "just now"
    for limit, unit, name in ((60, 1, "second"), (3600, 60, "minute"),
                              (86400, 3600, "hour"), (604800, 86400, "day"),
                              (2629800, 604800, "week")):
        if delta < limit:
            value = int(delta // unit)
            return f"{value} {name}{'s' if value != 1 else ''} ago"
    value = int(delta // 2629800)
    return f"{value} month{'s' if value != 1 else ''} ago"


def stamp(ts: float) -> str:
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")
