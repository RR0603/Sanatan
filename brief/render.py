"""Turn the gathered data into the Telegram message.

Every value that reaches the message goes through :func:`telegram.escape`,
because a headline containing ``<`` or ``&`` would otherwise make Telegram
reject the whole message with a parse error.
"""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from .telegram import escape, link


def _bold(text: str) -> str:
    return f"<b>{escape(text)}</b>"


def _italic(text: str) -> str:
    return f"<i>{escape(text)}</i>"


def _time(moment: datetime | None, tz: ZoneInfo) -> str:
    return moment.astimezone(tz).strftime("%H:%M") if moment else "—"


def _num(value, unit: str = "", digits: int = 0) -> str:
    """Format a number that may be ``None``."""
    if value is None:
        return "—"
    try:
        if digits:
            return f"{float(value):.{digits}f}{unit}"
        return f"{round(float(value))}{unit}"
    except (TypeError, ValueError):
        return "—"


def greeting_section(day: date, tz: ZoneInfo, name: str = "") -> str:
    """The header: who, what day, in both reckonings."""
    who = f", {escape(name)}" if name else ""
    weekday = day.strftime("%A")
    pretty = day.strftime("%d %B %Y")
    return f"\U0001f549️ {_bold('Good morning' + (who if name else ''))}\n{escape(weekday)}, {escape(pretty)}"


def panchang_section(panchang, tz: ZoneInfo) -> str:
    """The five limbs, the day's timings, and anything observed today."""
    p = panchang
    lines = [_bold("\U0001f4dc Panchang")]

    lines.append(
        f"{escape(p.vara)} · {escape(p.masa)} {escape(p.paksha)} · "
        f"VS {p.vikram_samvat}"
    )
    lines.append(f"• Tithi: {escape(p.tithi.describe(tz))}")
    lines.append(f"• Nakshatra: {escape(p.nakshatra.describe(tz))}")
    lines.append(f"• Yoga: {escape(p.yoga.describe(tz))}")
    lines.append(f"• Karana: {escape(p.karana.describe(tz))}")
    lines.append(f"• Moon: {escape(p.moon_sign)} · Sun: {escape(p.sun_sign)}")

    if p.sunrise and p.sunset:
        lines.append(
            f"\n\U0001f305 Sunrise {_time(p.sunrise, tz)} · "
            f"Sunset {_time(p.sunset, tz)}"
        )

    rahu = p.window("Rahu Kaal")
    abhijit = p.window("Abhijit Muhurta")
    brahma = p.window("Brahma Muhurta")
    if brahma:
        lines.append(f"• Brahma Muhurta: {escape(brahma.describe(tz))}")
    if abhijit:
        lines.append(f"• Abhijit (auspicious): {escape(abhijit.describe(tz))}")
    if rahu:
        lines.append(f"• Rahu Kaal (avoid): {escape(rahu.describe(tz))}")

    if p.observances:
        lines.append("")
        for item in p.observances:
            lines.append(f"✨ {escape(item)}")

    return "\n".join(lines)


def weather_section(weather, location_name: str) -> str:
    """Forecast and air quality."""
    w = weather
    lines = [_bold(f"{w.emoji} Weather — {location_name}")]
    lines.append(
        f"{escape(w.condition)}, {_num(w.temp_min, '°')}–"
        f"{_num(w.temp_max, '°C')}"
    )
    if w.feels_max is not None:
        lines.append(f"• Feels like up to {_num(w.feels_max, '°C')}")
    if w.precipitation_chance is not None:
        rain = f"• Rain {_num(w.precipitation_chance, '%')} chance"
        if w.precipitation_mm:
            rain += f", {_num(w.precipitation_mm, ' mm', 1)}"
        lines.append(rain)
    if w.wind_max is not None:
        lines.append(f"• Wind up to {_num(w.wind_max, ' km/h')}")
    if w.uv_index is not None:
        lines.append(f"• UV index {_num(w.uv_index, '', 1)}")
    if w.aqi is not None:
        aqi = f"• AQI {_num(w.aqi)} {w.aqi_emoji} {escape(str(w.aqi_label))}"
        if w.pm25 is not None:
            aqi += f" (PM2.5 {_num(w.pm25, '', 1)})"
        lines.append(aqi)
    return "\n".join(lines)


def calendar_section(events, tz: ZoneInfo) -> str:
    """Today's calendar, or an explicit note that it is clear."""
    lines = [_bold("\U0001f4c5 Today")]
    if not events:
        lines.append(_italic("Nothing on the calendar."))
        return "\n".join(lines)
    for event in events:
        row = f"• {escape(event.describe(tz))}"
        if event.location:
            row += f" {_italic('@ ' + event.location)}"
        lines.append(row)
    return "\n".join(lines)


def news_section(headlines) -> str:
    """Headlines, each linked to its article."""
    lines = [_bold("\U0001f4f0 Headlines")]
    if not headlines:
        lines.append(_italic("No headlines available."))
        return "\n".join(lines)
    for item in headlines:
        if item.url:
            lines.append(f"• {link(item.url, item.title)}")
        else:
            lines.append(f"• {escape(item.title)}")
    return "\n".join(lines)


def shloka_section(shloka) -> str:
    """The verse of the day."""
    lines = [_bold("\U0001f3b4 Verse of the day")]
    lines.append(escape(shloka.sanskrit))
    lines.append(_italic(shloka.translation))
    lines.append(f"— {escape(shloka.reference)}")
    return "\n".join(lines)


def failure_note(failures) -> str:
    """Tell the reader which sections could not be built, and why.

    Silently dropping a section would leave you wondering whether there is
    genuinely no news today or the feed is broken.
    """
    if not failures:
        return ""
    lines = [_italic("Some sections were unavailable:")]
    for name, reason in failures:
        lines.append(_italic(f"• {name}: {reason}"))
    return "\n".join(lines)


def compose(sections, failures=()) -> str:
    """Join the rendered sections into one message."""
    blocks = [block for block in sections if block]
    note = failure_note(failures)
    if note:
        blocks.append(note)
    return "\n\n".join(blocks)
