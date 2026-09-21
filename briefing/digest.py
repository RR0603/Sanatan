"""Optional one-paragraph intro written by an LLM.

Disabled unless LLM_API_KEY is set. Works with any OpenAI-compatible
endpoint (Groq and OpenRouter both have free tiers) or with Anthropic.
If the call fails the briefing still goes out without the intro.
"""

from __future__ import annotations

import logging
import re

from .config import Config
from .http import HttpError, post_json
from .sections.base import Section
from .telegram import escape

LOG = logging.getLogger(__name__)
MAX_TOKENS = 200

SYSTEM_PROMPT = (
    "You write the opening line of someone's daily morning briefing. "
    "Given the raw briefing data, write 1-2 short sentences (max 40 words) that "
    "tell them what actually matters today and what to do about it. "
    "Be direct and specific, reference the real details, and never invent facts "
    "that are not in the data. No greeting, no sign-off, no markdown, no emoji."
)


def summarise(config: Config, sections: list[Section]) -> str:
    """Return a plain-text intro, or '' if unavailable or not configured."""
    if not config.llm_api_key:
        return ""

    facts = _facts(sections)
    if not facts:
        return ""

    try:
        if config.llm_provider == "anthropic":
            text = _call_anthropic(config, facts)
        else:
            text = _call_openai_compatible(config, facts)
    except (HttpError, KeyError, TypeError, IndexError) as exc:
        LOG.warning("Skipping AI intro: %s", exc)
        return ""

    return " ".join(text.split()).strip()


def _facts(sections: list[Section]) -> str:
    blocks = []
    for section in sections:
        if not section.ok:
            continue
        body = "\n".join(_strip_tags(line) for line in section.lines)
        blocks.append(f"{section.title}:\n{body}")
    return "\n\n".join(blocks)


TAG_RE = re.compile(r"<[^>]+>")


def _strip_tags(line: str) -> str:
    return TAG_RE.sub("", line).strip()


def _call_openai_compatible(config: Config, facts: str) -> str:
    payload = {
        "model": config.llm_model,
        "max_tokens": MAX_TOKENS,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": facts},
        ],
    }
    response = post_json(
        f"{config.llm_base_url}/chat/completions",
        payload,
        headers={"Authorization": f"Bearer {config.llm_api_key}"},
        retries=2,
    )
    return response["choices"][0]["message"]["content"]


def _call_anthropic(config: Config, facts: str) -> str:
    payload = {
        "model": config.llm_model,
        "max_tokens": MAX_TOKENS,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": facts}],
    }
    response = post_json(
        "https://api.anthropic.com/v1/messages",
        payload,
        headers={
            "x-api-key": config.llm_api_key,
            "anthropic-version": "2023-06-01",
        },
        retries=2,
    )
    return response["content"][0]["text"]


def render(text: str) -> str:
    return f"<i>{escape(text)}</i>"
