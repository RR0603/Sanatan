import io
import os
import unittest
from contextlib import redirect_stdout
from unittest import mock

import helpers  # noqa: F401

from briefing import __main__ as cli


class CliTests(unittest.TestCase):
    def test_dry_run_prints_without_credentials(self):
        buffer = io.StringIO()
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch.object(cli.report, "build_message", return_value="BRIEFING"):
                with redirect_stdout(buffer):
                    code = cli.main(["--dry-run"])
        self.assertEqual(code, 0)
        self.assertIn("BRIEFING", buffer.getvalue())

    def test_dry_run_never_calls_telegram(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch.object(cli.report, "build_message", return_value="x"):
                with mock.patch.object(cli.telegram, "send_message") as send:
                    with redirect_stdout(io.StringIO()):
                        cli.main(["--dry-run"])
        send.assert_not_called()

    def test_missing_credentials_exit_code_is_two(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(cli.main([]), 2)

    def test_send_path_uses_configured_chat(self):
        env = {"TELEGRAM_BOT_TOKEN": "tok", "TELEGRAM_CHAT_ID": "77"}
        with mock.patch.dict(os.environ, env, clear=True):
            with mock.patch.object(cli.report, "build_message", return_value="hello"):
                with mock.patch.object(cli.telegram, "send_message", return_value=[1]) as send:
                    with redirect_stdout(io.StringIO()):
                        code = cli.main([])
        self.assertEqual(code, 0)
        send.assert_called_once_with("tok", "77", "hello")

    def test_send_failure_exits_nonzero(self):
        env = {"TELEGRAM_BOT_TOKEN": "tok", "TELEGRAM_CHAT_ID": "77"}
        error = cli.telegram.TelegramError("chat not found")
        with mock.patch.dict(os.environ, env, clear=True):
            with mock.patch.object(cli.report, "build_message", return_value="hello"):
                with mock.patch.object(cli.telegram, "send_message", side_effect=error):
                    self.assertEqual(cli.main([]), 1)

    def test_message_flag_skips_building_a_briefing(self):
        env = {"TELEGRAM_BOT_TOKEN": "tok", "TELEGRAM_CHAT_ID": "77"}
        with mock.patch.dict(os.environ, env, clear=True):
            with mock.patch.object(cli.report, "build_message") as build:
                with mock.patch.object(cli.telegram, "send_message", return_value=[1]):
                    with redirect_stdout(io.StringIO()):
                        cli.main(["--message", "ping"])
        build.assert_not_called()


if __name__ == "__main__":
    unittest.main()
