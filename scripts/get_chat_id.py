#!/usr/bin/env python3
"""Print the chat id(s) your bot can send to.

Usage:
    1. Open Telegram, find your bot, and send it any message (e.g. "hi").
    2. TELEGRAM_BOT_TOKEN=... python3 scripts/get_chat_id.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from briefing import telegram  # noqa: E402


def main() -> int:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print("Set TELEGRAM_BOT_TOKEN first. Get one from @BotFather.", file=sys.stderr)
        return 2

    try:
        me = telegram.get_me(token)
        updates = telegram.get_updates(token)
    except telegram.TelegramError as exc:
        print(f"Telegram error: {exc}", file=sys.stderr)
        return 1

    print(f"Bot: @{me.get('username')}\n")

    seen: dict[str, str] = {}
    for update in updates:
        message = update.get("message") or update.get("channel_post") or {}
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if chat_id is None:
            continue
        label = chat.get("title") or " ".join(
            filter(None, [chat.get("first_name"), chat.get("last_name")])
        ) or chat.get("username") or chat.get("type", "chat")
        seen[str(chat_id)] = str(label)

    if not seen:
        print(
            "No messages found.\n"
            "Send your bot a message in Telegram, then run this again.\n"
            "(Telegram only keeps recent updates, and none are returned while a "
            "webhook is set.)"
        )
        return 1

    print("Set TELEGRAM_CHAT_ID to one of these:")
    for chat_id, label in seen.items():
        print(f"  {chat_id}  ({label})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
