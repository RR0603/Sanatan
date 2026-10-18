"""Build and send the morning brief.

    python3 -m brief.main              # build and send
    python3 -m brief.main --dry-run    # print to stdout, send nothing
    python3 -m brief.main --date 2026-11-08

Design rule: no single source can cost you the message. Each section is built
in isolation, a failure is recorded and reported inline, and the brief goes out
with whatever succeeded. A morning with no news is still worth a Panchang.
"""

from __future__ import annotations

import argparse
import html
import logging
import re
import sys
from datetime import date, datetime

from . import config as config_module
from . import render
from .panchang import calendar as panchang_calendar
from .sources import news as news_source
from .sources import shloka as shloka_source
from .sources import weather as weather_source
from .telegram import Telegram

log = logging.getLogger("brief")


def _plain_text(markup: str) -> str:
    """Strip the HTML markup, for previewing in a terminal."""
    text = re.sub(r"<a href=\"[^\"]*\">(.*?)</a>", r"\1", markup)
    text = re.sub(r"</?[bi]>", "", text)
    return html.unescape(text)


def _friendly_reason(exc: Exception) -> str:
    """A short, non-technical reason suitable for the message body."""
    text = str(exc).lower()
    if "timed out" in text or "timeout" in text:
        return "source timed out"
    if "403" in text or "forbidden" in text:
        return "source refused the request"
    if "401" in text or "unauthor" in text:
        return "credentials rejected \u2014 check your secrets"
    if "429" in text:
        return "rate limited"
    if "urlopen" in text or "tunnel" in text or "network" in text:
        return "network unreachable"
    if "json" in text:
        return "source returned an unexpected response"
    return "temporarily unavailable"


def build(cfg, day: date) -> str:
    """Render the whole brief for `day`, tolerating individual failures."""
    tz = cfg.tz
    sections: list = []
    failures: list = []

    for name in cfg.sections:
        try:
            if name == "greeting":
                sections.append(render.greeting_section(day, tz, cfg.name))

            elif name == "panchang":
                data = panchang_calendar.compute(
                    day, cfg.location.latitude, cfg.location.longitude, tz
                )
                sections.append(render.panchang_section(data, tz))

            elif name == "weather":
                data = weather_source.fetch_weather(
                    cfg.location.latitude,
                    cfg.location.longitude,
                    cfg.location.timezone,
                    day,
                )
                try:
                    weather_source.add_air_quality(
                        data,
                        cfg.location.latitude,
                        cfg.location.longitude,
                        cfg.location.timezone,
                    )
                except Exception as exc:
                    # Air quality is a bonus; a forecast without it is fine.
                    log.warning("air quality unavailable: %s", exc)
                sections.append(render.weather_section(data, cfg.location.name))

            elif name == "calendar":
                if not cfg.google_calendar_ready:
                    log.info("calendar section skipped: Google secrets not set")
                    continue
                from .sources import gcal

                events = gcal.fetch_events(
                    cfg.google_client_id,
                    cfg.google_client_secret,
                    cfg.google_refresh_token,
                    cfg.calendar_ids,
                    day,
                    tz,
                )
                sections.append(render.calendar_section(events, tz))

            elif name == "news":
                headlines = news_source.fetch_headlines(
                    cfg.news_feeds, cfg.news_limit
                )
                if headlines:
                    sections.append(render.news_section(headlines))
                else:
                    failures.append(("Headlines", "no feed responded"))

            elif name == "shloka":
                if not cfg.shloka_enabled:
                    continue
                verse = shloka_source.shloka_for(day)
                if verse:
                    sections.append(render.shloka_section(verse))

        except Exception as exc:
            # Log the full error for the workflow run, but keep the message
            # itself readable -- nobody wants a stack trace at breakfast.
            log.warning("section %s failed: %s", name, exc)
            failures.append((name.capitalize(), _friendly_reason(exc)))

    return render.compose(sections, failures)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Send the morning brief to Telegram.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="print the brief instead of sending it",
    )
    parser.add_argument(
        "--raw",
        action="store_true",
        help="with --dry-run, show the raw HTML markup",
    )
    parser.add_argument(
        "--date",
        help="build the brief for a specific date (YYYY-MM-DD), for testing",
    )
    parser.add_argument("--config", help="path to config.json")
    parser.add_argument(
        "--silent",
        action="store_true",
        help="send without a notification sound",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO, format="%(levelname)s %(name)s: %(message)s"
    )

    try:
        cfg = config_module.load(args.config)
    except config_module.ConfigError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 2

    if args.date:
        try:
            day = date.fromisoformat(args.date)
        except ValueError:
            print(f"--date must be YYYY-MM-DD, got {args.date!r}", file=sys.stderr)
            return 2
    else:
        day = datetime.now(cfg.tz).date()

    message = build(cfg, day)

    if args.dry_run:
        print(message if args.raw else _plain_text(message))
        return 0

    try:
        cfg.require_telegram()
    except config_module.ConfigError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 2

    bot = Telegram(cfg.bot_token)
    bot.send_message(cfg.chat_id, message, silent=args.silent)
    log.info("brief sent for %s", day.isoformat())
    return 0


if __name__ == "__main__":
    sys.exit(main())
