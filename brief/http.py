"""A small HTTP helper: timeouts, retries, and JSON -- standard library only.

Keeping this dependency-free is deliberate. The whole bot runs on a GitHub
Actions runner with no `pip install` step, so a cold start is a few seconds and
there is no third-party supply chain in the path of your morning message.
"""

from __future__ import annotations

import gzip
import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request

log = logging.getLogger(__name__)

USER_AGENT = "sanatan-morning-brief/1.0 (+https://github.com/rr0603/sanatan)"
DEFAULT_TIMEOUT = 12.0
DEFAULT_RETRIES = 3


class HttpError(RuntimeError):
    """Raised when a request fails after exhausting its retries."""


def _open(request: urllib.request.Request, timeout: float) -> bytes:
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = response.read()
        if response.headers.get("Content-Encoding") == "gzip":
            payload = gzip.decompress(payload)
        return payload


def fetch(
    url: str,
    *,
    params: dict | None = None,
    data: dict | None = None,
    headers: dict | None = None,
    timeout: float = DEFAULT_TIMEOUT,
    retries: int = DEFAULT_RETRIES,
    method: str | None = None,
) -> bytes:
    """GET or POST `url`, retrying transient failures with a backoff.

    4xx responses other than 429 are not retried -- they will not fix
    themselves, and a morning brief should not sit there re-asking.
    """
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    body = None
    request_headers = {"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    if headers:
        request_headers.update(headers)

    request = urllib.request.Request(
        url, data=body, headers=request_headers, method=method
    )

    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            return _open(request, timeout)
        except urllib.error.HTTPError as exc:
            last_error = exc
            retryable = exc.code == 429 or exc.code >= 500
            detail = ""
            try:
                detail = exc.read().decode("utf-8", "replace")[:400]
            except Exception:  # pragma: no cover - best effort only
                pass
            log.warning(
                "HTTP %s from %s (attempt %d/%d): %s",
                exc.code,
                url.split("?")[0],
                attempt + 1,
                retries,
                detail,
            )
            if not retryable:
                raise HttpError(f"HTTP {exc.code} from {url.split('?')[0]}: {detail}")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = exc
            log.warning(
                "network error for %s (attempt %d/%d): %s",
                url.split("?")[0],
                attempt + 1,
                retries,
                exc,
            )

        if attempt < retries - 1:
            time.sleep(2.0**attempt)

    raise HttpError(f"{url.split('?')[0]} failed after {retries} attempts: {last_error}")


def fetch_json(url: str, **kwargs):
    """Same as :func:`fetch`, decoded as JSON."""
    raw = fetch(url, **kwargs)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HttpError(f"invalid JSON from {url.split('?')[0]}: {exc}") from exc
