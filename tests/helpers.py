import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from briefing.config import Config  # noqa: E402


def make_config(**overrides) -> Config:
    defaults = dict(bot_token="test-token", chat_id="12345")
    defaults.update(overrides)
    return Config(**defaults)
