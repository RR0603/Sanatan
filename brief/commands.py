"""Answer Telegram commands, without a server and without stored state.

Telegram keeps undelivered updates for 24 hours and treats a ``getUpdates``
call with an ``offset`` as an acknowledgement of everything before it. So we
read the backlog, act on it, then acknowledge it -- which means consecutive
workflow runs never re-answer the same message, with nothing persisted
between runs.

    python3 -m brief.commands
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime

from . import config as config_module
from . import main as main_module
from .telegram import Telegram, escape

log = logging.getLogger("brief.commands")

HELP = (
    "<b>Morning brief bot</b>\n\n"
    "/brief — send today's brief now\n"
    "/panchang — just the Panchang\n"
    "/weather — just the forecast\n"
    "/help — this message\n\n"
    "<i>The full brief arrives automatically each morning.</i>"
)


def _authorised(chat_id, allowed: str) -> bool:
    """Only answer the configured chat.

    Anyone who finds the bot's username can message it, so without this check
    a stranger could make the workflow do work on their behalf.
    """
    return str(chat_id) == str(allowed)


def handle(cfg, bot: Telegram, text: str) -> str | None:
    """Produce a reply for `text`, or ``None`` if it is not a command."""
    command = text.strip().split()[0].lower() if text.strip() else ""
    command = command.split("@")[0]  # /brief@MyBot in groups
    day = datetime.now(cfg.tz).date()

    if command in ("/start", "/help"):
        return HELP

    if command == "/brief":
        return main_module.build(cfg, day)

    if command == "/panchang":
        sub = config_module.Config(
            location=cfg.location, sections=("greeting", "panchang"), name=cfg.name
        )
        return main_module.build(sub, day)

    if command == "/weather":
        sub = config_module.Config(
            location=cfg.location, sections=("weather",), name=cfg.name
        )
        return main_module.build(sub, day)

    if command.startswith("/"):
        return f"Unknown command {escape(command)}. Try /help."

    return None


def run(cfg) -> int:
    """Drain and answer the pending command backlog."""
    cfg.require_telegram()
    bot = Telegram(cfg.bot_token)

    updates = bot.get_updates()
    if not updates:
        log.info("no pending updates")
        return 0

    highest = max(u["update_id"] for u in updates)
    answered = 0

    for update in updates:
        message = update.get("message") or update.get("edited_message") or {}
        chat_id = (message.get("chat") or {}).get("id")
        text = message.get("text", "")
        if not text or chat_id is None:
            continue

        if not _authorised(chat_id, cfg.chat_id):
            log.warning("ignoring message from unauthorised chat %s", chat_id)
            continue

        reply = handle(cfg, bot, text)
        if reply:
            bot.send_message(str(chat_id), reply)
            answered += 1

    # Acknowledge the whole batch so the next run starts clean.
    bot.get_updates(offset=highest + 1)
    log.info("answered %d command(s)", answered)
    return 0


def main(argv=None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    try:
        cfg = config_module.load()
        return run(cfg)
    except config_module.ConfigError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
