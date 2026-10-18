"""One-time helper: turn a Google OAuth client into a refresh token.

Run this once on your own machine:

    python3 -m brief.tools.google_auth

It prints a refresh token to store as the GOOGLE_REFRESH_TOKEN repository
secret. Uses the loopback redirect flow, so nothing is sent anywhere except
Google. Nothing is written to disk.
"""

from __future__ import annotations

import http.server
import json
import secrets
import socketserver
import sys
import threading
import time
import urllib.parse
import urllib.request
import webbrowser

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/calendar.readonly"
PORT = 8765
REDIRECT = f"http://localhost:{PORT}/"

_received: dict = {}


class _Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802 - name fixed by BaseHTTPRequestHandler
        query = urllib.parse.urlparse(self.path).query
        _received.update(urllib.parse.parse_qs(query))
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(
            b"<h2>Done.</h2><p>You can close this tab and return to the terminal.</p>"
        )

    def log_message(self, *args):  # silence the default request logging
        pass


def main() -> int:
    print("Google Calendar -> Telegram brief: one-time authorisation\n")
    client_id = input("GOOGLE_CLIENT_ID: ").strip()
    client_secret = input("GOOGLE_CLIENT_SECRET: ").strip()
    if not client_id or not client_secret:
        print("Both values are required. See README.md -> Google Calendar.")
        return 1

    state = secrets.token_urlsafe(16)
    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"

    with socketserver.TCPServer(("localhost", PORT), _Handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        print(f"\nOpening your browser. If it does not open, visit:\n\n{url}\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        print("Waiting for you to approve access...")
        deadline = time.monotonic() + 300.0
        while not _received and time.monotonic() < deadline:
            time.sleep(0.4)
        server.shutdown()

    if not _received:
        print("Timed out after 5 minutes without a response from Google.")
        return 1

    if "error" in _received:
        print(f"Authorisation failed: {_received['error'][0]}")
        return 1
    if _received.get("state", [None])[0] != state:
        print("State mismatch -- aborting rather than trusting this response.")
        return 1

    code = _received["code"][0]
    body = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        TOKEN_URL,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = json.loads(response.read())

    refresh = payload.get("refresh_token")
    if not refresh:
        print("No refresh token returned. Re-run and make sure you approve consent.")
        return 1

    print("\n" + "=" * 62)
    print("Add these three as GitHub repository secrets:\n")
    print(f"  GOOGLE_CLIENT_ID      {client_id}")
    print(f"  GOOGLE_CLIENT_SECRET  {client_secret}")
    print(f"  GOOGLE_REFRESH_TOKEN  {refresh}")
    print("=" * 62)
    print("\nKeep these private -- they grant read access to your calendar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
