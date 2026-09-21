import unittest
from unittest import mock

import helpers  # noqa: F401  (puts the repo root on sys.path)

from briefing import telegram


class EscapeTests(unittest.TestCase):
    def test_escapes_html_control_characters(self):
        self.assertEqual(telegram.escape("Tata & Sons <b>"), "Tata &amp; Sons &lt;b&gt;")

    def test_leaves_quotes_alone(self):
        self.assertEqual(telegram.escape('say "hi"'), 'say "hi"')


class SplitMessageTests(unittest.TestCase):
    def test_short_message_is_untouched(self):
        self.assertEqual(telegram.split_message("hello"), ["hello"])

    def test_splits_on_blank_lines_within_limit(self):
        blocks = ["x" * 40 for _ in range(10)]
        chunks = telegram.split_message("\n\n".join(blocks), limit=100)
        self.assertGreater(len(chunks), 1)
        for chunk in chunks:
            self.assertLessEqual(len(chunk), 100)

    def test_never_splits_inside_a_line(self):
        text = "\n\n".join(f"<b>heading {i}</b>\nbody text here" for i in range(20))
        for chunk in telegram.split_message(text, limit=120):
            self.assertEqual(chunk.count("<b>"), chunk.count("</b>"))

    def test_single_oversized_line_is_hard_wrapped(self):
        chunks = telegram.split_message("y" * 250, limit=100)
        self.assertEqual(len(chunks), 3)
        self.assertEqual("".join(chunks), "y" * 250)

    def test_no_chunk_exceeds_telegram_hard_limit(self):
        text = "\n".join("z" * 500 for _ in range(50))
        for chunk in telegram.split_message(text):
            self.assertLessEqual(len(chunk), telegram.MAX_MESSAGE_CHARS)


class SendMessageTests(unittest.TestCase):
    def test_posts_once_per_chunk_and_returns_ids(self):
        calls = []

        def fake_post(url, payload, **kwargs):
            calls.append((url, payload))
            return {"ok": True, "result": {"message_id": len(calls)}}

        with mock.patch.object(telegram, "post_json", side_effect=fake_post):
            ids = telegram.send_message("tok", "99", "a" * 5000)

        self.assertEqual(ids, [1, 2])
        self.assertTrue(calls[0][0].endswith("/bottok/sendMessage"))
        self.assertEqual(calls[0][1]["chat_id"], "99")
        self.assertEqual(calls[0][1]["parse_mode"], "HTML")

    def test_api_level_failure_becomes_telegram_error(self):
        response = {"ok": False, "description": "chat not found"}
        with mock.patch.object(telegram, "post_json", return_value=response):
            with self.assertRaises(telegram.TelegramError) as ctx:
                telegram.send_message("tok", "99", "hi")
        self.assertIn("chat not found", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
