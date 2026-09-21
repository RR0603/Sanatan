"""Headlines from any RSS/Atom feed. Free, no key, works with any publisher."""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass

from ..http import HttpError, request
from ..telegram import escape
from .base import Context, Section, SectionError

ATOM = "{http://www.w3.org/2005/Atom}"
TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")


@dataclass
class Headline:
    title: str
    link: str
    source: str = ""


def parse_feed(xml_bytes: bytes) -> list[Headline]:
    """Parse RSS 2.0 or Atom into headlines, skipping malformed entries."""
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as exc:
        raise SectionError(f"Could not parse feed: {exc}") from exc

    headlines: list[Headline] = []
    for item in root.iter():
        tag = item.tag
        if tag not in ("item", f"{ATOM}entry"):
            continue
        title = _text(item.find("title")) or _text(item.find(f"{ATOM}title"))
        if not title:
            continue
        link = _text(item.find("link")) or _atom_link(item)
        source = _text(item.find("source")) or _text(item.find(f"{ATOM}source"))
        headlines.append(Headline(title=_clean(title), link=link.strip(), source=_clean(source)))
    return headlines


def _atom_link(item: ET.Element) -> str:
    for link in item.findall(f"{ATOM}link"):
        rel = link.get("rel", "alternate")
        if rel == "alternate" and link.get("href"):
            return link.get("href", "")
    return ""


def _text(element: ET.Element | None) -> str:
    if element is None or element.text is None:
        return ""
    return element.text


def _clean(text: str) -> str:
    """Strip stray markup and collapse whitespace."""
    return WHITESPACE_RE.sub(" ", TAG_RE.sub("", text)).strip()


def split_source_suffix(title: str) -> tuple[str, str]:
    """Google News appends ' - Publisher'; pull it out so it can be styled."""
    if " - " not in title:
        return title, ""
    head, _, tail = title.rpartition(" - ")
    # A real publisher name is short and has no sentence punctuation.
    if head and 0 < len(tail) <= 40 and not tail.endswith((".", "?", "!")):
        return head.strip(), tail.strip()
    return title, ""


def dedupe(headlines: list[Headline]) -> list[Headline]:
    seen: set[str] = set()
    unique: list[Headline] = []
    for headline in headlines:
        key = headline.title.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(headline)
    return unique


def format_headline(headline: Headline) -> str:
    title, suffix = split_source_suffix(headline.title)
    source = headline.source or suffix
    text = f"<a href=\"{escape(headline.link)}\">{escape(title)}</a>" if headline.link else escape(title)
    if source:
        text += f" <i>{escape(source)}</i>"
    return f"• {text}"


def build(ctx: Context) -> Section:
    cfg = ctx.config
    collected: list[Headline] = []
    failures: list[str] = []

    for feed_url in cfg.news_feeds:
        try:
            collected.extend(parse_feed(request(feed_url)))
        except (HttpError, SectionError) as exc:
            failures.append(str(exc))

    collected = dedupe(collected)
    if not collected:
        raise SectionError(failures[0] if failures else "No headlines in the configured feeds")

    lines = [format_headline(headline) for headline in collected[: cfg.news_limit]]
    return Section(key="news", title="Top stories", lines=lines)
