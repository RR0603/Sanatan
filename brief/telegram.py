"""Telegram Bot API client -- just the few calls this bot needs.

Telegram's `sendMessage` caps a message at 4096 UTF-16 code units, so long
briefs are split on paragraph boundaries rather than being truncated or
rejected. We use ``parse_mode=HTML`` because its escaping rules are far less
error-prone than MarkdownV2's (which requires escaping 18 different
characters, any one of which will 400 the whole request).
"""

from __future__ import annotations

import logging

from .http import HttpError, fetch_json

log = logging.getLogger(__name__)

API_BASE = "https://api.telegram.org"

#: Telegram's hard limit. We leave headroom for the continuation marker.
MESSAGE_LIMIT = 4096
SPLIT_TARGET = 3900


def escape(text: str) -> str:
    """Escape text for Telegram's HTML parse mode.

    Only these three characters are special, and they must be escaped in this
    order so an ampersand introduced by a later replacement is not re-escaped.
    """
    return (
        str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )


def link(url: str, label: str) -> str:
    """An HTML anchor with both parts escaped."""
    return f'<a href="{escape(url)}">{escape(label)}</a>'


def split_message(text: str, limit: int = SPLIT_TARGET) -> list:
    """Split `text` into chunks under `limit`, preferring paragraph breaks.

    Falls back to line breaks, then to a hard character cut, so a single
    enormous unbroken line still gets delivered rather than dropped.
    """
    if len(text) <= limit:
        return [text] if text else []

    chunks: list = []
    remaining = text
    while len(remaining) > limit:
        window = remaining[:limit]
        cut = window.rfind("\n\n")
        if cut < limit // 2:
            cut = window.rfind("\n")
        if cut < limit // 2:
            cut = limit
        chunks.append(remaining[:cut].rstrip())
        remaining = remaining[cut:].lstrip("\n")
    if remaining:
        chunks.append(remaining)
    return chunks


class Telegram:
    """Minimal Telegram bot client."""

    def __init__(self, token: str, timeout: float = 15.0):
        if not token:
            raise ValueError("a Telegram bot token is required")
        self.token = token
        self.timeout = timeout

    def _call(self, method: str, payload: dict | None = None, **kwargs):
        url = f"{API_BASE}/bot{self.token}/{method}"
        result = fetch_json(url, data=payload or {}, timeout=self.timeout, **kwargs)
        if not result.get("ok"):
            raise HttpError(
                f"Telegram {method} failed: "
                f"{result.get('description', 'no description')}"
            )
        return result.get("result")

    def get_me(self) -> dict:
        """Identify the bot. Useful as a token smoke test."""
        return self._call("getMe")

    def send_message(
        self,
        chat_id: str,
        text: str,
        *,
        parse_mode: str = "HTML",
        disable_preview: bool = True,
        silent: bool = False,
    ) -> list:
        """Send `text`, splitting it across messages if necessary."""
        sent = []
        for chunk in split_message(text):
            sent.append(
                self._call(
                    "sendMessage",
                    {
                        "chat_id": chat_id,
                        "text": chunk,
                        "parse_mode": parse_mode,
                        "link_preview_options": {"is_disabled": disable_preview},
                        "disable_notification": silent,
                    },
                )
            )
        return sent

    def get_updates(self, offset: int | None = None, timeout: int = 0) -> list:
        """Fetch pending updates.

        Passing an `offset` also tells Telegram those updates are handled, so
        they are not served again -- which is how the command handler stays
        stateless between workflow runs.
        """
        payload: dict = {"timeout": timeout}
        if offset is not None:
            payload["offset"] = offset
        return self._call("getUpdates", payload, timeout=self.timeout + timeout) or []
