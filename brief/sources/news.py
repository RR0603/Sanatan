"""Headlines from RSS/Atom feeds, parsed with the standard library.

Any publisher's feed works, so you choose your own sources in ``config.json``
with no API key and no quota. Feeds are fetched independently and a dead feed
is skipped rather than failing the section.
"""

from __future__ import annotations

import html
import logging
import re
from dataclasses import dataclass
from xml.etree import ElementTree

from ..http import fetch

log = logging.getLogger(__name__)

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")

#: Atom uses its own namespace; RSS 2.0 does not.
_ATOM = "{http://www.w3.org/2005/Atom}"


@dataclass
class Headline:
    title: str
    url: str
    source: str


def clean_text(value: str) -> str:
    """Strip tags and collapse whitespace in feed-supplied text."""
    if not value:
        return ""
    text = html.unescape(value)
    text = _TAG_RE.sub("", text)
    return _WS_RE.sub(" ", text).strip()


def _feed_title(root, fallback: str) -> str:
    for path in ("channel/title", f"{_ATOM}title", "title"):
        node = root.find(path)
        if node is not None and node.text:
            return clean_text(node.text)
    return fallback


def _hostname(url: str) -> str:
    match = re.match(r"https?://([^/]+)", url)
    return match.group(1).replace("www.", "") if match else url


def parse_feed(raw: bytes, fallback_source: str, limit: int) -> list:
    """Pull up to `limit` headlines out of an RSS or Atom document."""
    try:
        root = ElementTree.fromstring(raw)
    except ElementTree.ParseError as exc:
        raise ValueError(f"unparseable feed: {exc}") from exc

    source = _feed_title(root, fallback_source)
    items = root.findall("channel/item") or root.findall(f"{_ATOM}entry")

    headlines = []
    for item in items[:limit]:
        title_node = item.find("title")
        if title_node is None:
            title_node = item.find(f"{_ATOM}title")
        title = clean_text(title_node.text if title_node is not None else "")
        if not title:
            continue

        url = ""
        link_node = item.find("link")
        if link_node is not None:
            url = clean_text(link_node.text or "")
        if not url:
            for candidate in item.findall(f"{_ATOM}link"):
                if candidate.get("rel", "alternate") == "alternate":
                    url = candidate.get("href", "")
                    break

        headlines.append(Headline(title=title, url=url, source=source))
    return headlines


def fetch_headlines(feeds, limit: int = 5) -> list:
    """Round-robin headlines across `feeds` so one source cannot dominate."""
    if not feeds or limit <= 0:
        return []

    per_feed: list = []
    for url in feeds:
        try:
            raw = fetch(url, timeout=10.0, retries=2)
            per_feed.append(parse_feed(raw, _hostname(url), limit))
        except Exception as exc:  # a dead feed must not kill the section
            log.warning("feed %s unavailable: %s", _hostname(url), exc)
            per_feed.append([])

    merged: list = []
    for rank in range(limit):
        for feed_items in per_feed:
            if rank < len(feed_items):
                merged.append(feed_items[rank])
            if len(merged) >= limit:
                return merged
    return merged[:limit]
