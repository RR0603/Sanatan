"""CLI entry point: python -m briefing [--dry-run] [--check]"""

from __future__ import annotations

import argparse
import logging
import sys

from . import config as config_module
from . import report, telegram


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m briefing",
        description="Build the morning briefing and send it to Telegram.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="print the briefing instead of sending it (no credentials needed)",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify the bot token and chat id work, then exit",
    )
    parser.add_argument(
        "--message",
        help="send this text instead of building a briefing (useful for testing)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
        stream=sys.stderr,
    )

    try:
        cfg = config_module.load(require_telegram=not args.dry_run)
    except config_module.ConfigError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 2

    if args.check:
        try:
            me = telegram.get_me(cfg.bot_token)
            telegram.send_message(
                cfg.bot_token, cfg.chat_id, "✅ Briefing bot is wired up correctly."
            )
        except telegram.TelegramError as exc:
            print(f"Telegram check failed: {exc}", file=sys.stderr)
            return 1
        print(f"OK: connected as @{me.get('username')} and delivered a test message.")
        return 0

    text = args.message or report.build_message(cfg)

    if args.dry_run:
        print(text)
        return 0

    try:
        message_ids = telegram.send_message(cfg.bot_token, cfg.chat_id, text)
    except telegram.TelegramError as exc:
        print(f"Send failed: {exc}", file=sys.stderr)
        return 1

    print(f"Sent {len(message_ids)} message(s) to chat {cfg.chat_id}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
