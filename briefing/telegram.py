"""Telegram Bot API client — just the two calls this project needs."""

from __future__ import annotations

import html
from typing import Any

from .http import HttpError, get_json, post_json

API_ROOT = "https://api.telegram.org"
# Telegram rejects anything longer; we split well below the limit.
MAX_MESSAGE_CHARS = 4096
SPLIT_TARGET = 3800


class TelegramError(RuntimeError):
    pass


def escape(text: str) -> str:
    """Escape for parse_mode=HTML (Telegram only cares about & < >)."""
    return html.escape(str(text), quote=False)


def _endpoint(token: str, method: str) -> str:
    return f"{API_ROOT}/bot{token}/{method}"


def _unwrap(response: Any) -> Any:
    if not isinstance(response, dict) or not response.get("ok"):
        description = ""
        if isinstance(response, dict):
            description = str(response.get("description", ""))
        raise TelegramError(f"Telegram rejected the request: {description or response}")
    return response.get("result")


def send_message(token: str, chat_id: str, text: str) -> list[int]:
    """Send text (HTML formatted), splitting it if it exceeds the limit.

    Returns the message ids Telegram assigned.
    """
    message_ids = []
    for chunk in split_message(text):
        payload = {
            "chat_id": chat_id,
            "text": chunk,
            "parse_mode": "HTML",
            "link_preview_options": {"is_disabled": True},
        }
        try:
            result = _unwrap(post_json(_endpoint(token, "sendMessage"), payload))
        except HttpError as exc:
            raise TelegramError(str(exc)) from exc
        if isinstance(result, dict) and "message_id" in result:
            message_ids.append(result["message_id"])
    return message_ids


def get_me(token: str) -> dict[str, Any]:
    try:
        return _unwrap(get_json(_endpoint(token, "getMe")))
    except HttpError as exc:
        raise TelegramError(str(exc)) from exc


def get_updates(token: str, timeout: int = 0) -> list[dict[str, Any]]:
    try:
        return _unwrap(get_json(_endpoint(token, "getUpdates"), params={"timeout": timeout}))
    except HttpError as exc:
        raise TelegramError(str(exc)) from exc


def split_message(text: str, limit: int = SPLIT_TARGET) -> list[str]:
    """Split on blank lines, then newlines, then hard-wrap as a last resort.

    Splitting mid-tag would break HTML parsing, so we only ever cut on
    line boundaries unless a single line is itself oversized.
    """
    if len(text) <= limit:
        return [text]

    chunks: list[str] = []
    current = ""
    for block in text.split("\n\n"):
        candidate = f"{current}\n\n{block}" if current else block
        if len(candidate) <= limit:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if len(block) <= limit:
            current = block
        else:
            lines = _split_oversized_block(block, limit)
            chunks.extend(lines[:-1])
            current = lines[-1]
    if current:
        chunks.append(current)
    return chunks


def _split_oversized_block(block: str, limit: int) -> list[str]:
    chunks: list[str] = []
    current = ""
    for line in block.split("\n"):
        while len(line) > limit:
            if current:
                chunks.append(current)
                current = ""
            chunks.append(line[:limit])
            line = line[limit:]
        candidate = f"{current}\n{line}" if current else line
        if len(candidate) <= limit:
            current = candidate
        else:
            chunks.append(current)
            current = line
    chunks.append(current)
    return chunks
