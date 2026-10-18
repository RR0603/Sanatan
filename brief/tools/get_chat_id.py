"""Find your Telegram chat id.

    TELEGRAM_BOT_TOKEN=... python3 -m brief.tools.get_chat_id

Message your bot first (send it "hi"), then run this. It prints the chat id to
store as the TELEGRAM_CHAT_ID repository secret.
"""

from __future__ import annotations

import os
import sys

from ..telegram import Telegram


def main() -> int:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print(
            "Set TELEGRAM_BOT_TOKEN first:\n"
            "  TELEGRAM_BOT_TOKEN=123:abc python3 -m brief.tools.get_chat_id",
            file=sys.stderr,
        )
        return 2

    bot = Telegram(token)
    try:
        me = bot.get_me()
    except Exception as exc:
        print(f"Could not reach Telegram with that token: {exc}", file=sys.stderr)
        return 1
    print(f"Bot: @{me.get('username')} ({me.get('first_name')})\n")

    updates = bot.get_updates()
    if not updates:
        print(
            "No messages yet.\n\n"
            f"Open Telegram, search @{me.get('username')}, press Start and send\n"
            "any message. Then run this again."
        )
        return 1

    seen = {}
    for update in updates:
        message = update.get("message") or update.get("edited_message") or {}
        chat = message.get("chat") or {}
        if chat.get("id") is not None:
            seen[chat["id"]] = chat

    print("Found these chats:\n")
    for chat_id, chat in seen.items():
        who = chat.get("username") or chat.get("title") or chat.get("first_name", "")
        print(f"  TELEGRAM_CHAT_ID = {chat_id}    ({chat.get('type')}: {who})")
    print("\nAdd that number as the TELEGRAM_CHAT_ID repository secret.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
