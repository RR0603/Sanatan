"""Tiny HTTP helpers built on urllib so the bot has zero dependencies."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

USER_AGENT = "morning-briefing-bot/1.0 (+https://github.com/)"
DEFAULT_TIMEOUT = 20
DEFAULT_RETRIES = 3


class HttpError(RuntimeError):
    """Any network or HTTP-level failure, after retries are exhausted."""


def request(
    url: str,
    *,
    params: dict[str, Any] | None = None,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = DEFAULT_TIMEOUT,
    retries: int = DEFAULT_RETRIES,
) -> bytes:
    """GET (or POST, when data is given) with exponential backoff."""
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    all_headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if headers:
        all_headers.update(headers)

    last_error: Exception | None = None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, headers=all_headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            body = exc.read(500).decode("utf-8", "replace")
            last_error = HttpError(f"HTTP {exc.code} from {_host(url)}: {body}")
            # 4xx other than rate limiting will not fix themselves.
            if exc.code < 500 and exc.code != 429:
                break
        except Exception as exc:  # timeouts, DNS, TLS, connection resets
            last_error = HttpError(f"{type(exc).__name__} calling {_host(url)}: {exc}")

        if attempt < retries - 1:
            time.sleep(2**attempt)

    raise last_error if last_error else HttpError(f"Request to {_host(url)} failed")


def get_json(url: str, **kwargs: Any) -> Any:
    raw = request(url, **kwargs)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HttpError(f"Malformed JSON from {_host(url)}: {exc}") from exc


def post_json(url: str, payload: dict[str, Any], **kwargs: Any) -> Any:
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    headers.update(kwargs.pop("headers", {}) or {})
    return get_json(url, data=body, headers=headers, **kwargs)


def _host(url: str) -> str:
    """Host only, so a token embedded in a URL never reaches the logs."""
    return urllib.parse.urlsplit(url).netloc or url
