"""Section contract.

A section is a small function that turns config + date into a few lines of
the briefing. Sections are independent: one failing never stops the others,
it just renders as a short "unavailable" note.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from ..config import Config


@dataclass
class Section:
    """One block of the briefing.

    title: shown as a bold heading (already plain text, escaped at render time)
    lines: body lines, which MAY contain Telegram-safe HTML tags
    error: set when the section could not be built
    """

    key: str
    title: str
    lines: list[str] = field(default_factory=list)
    error: str = ""

    @property
    def ok(self) -> bool:
        return not self.error and bool(self.lines)


@dataclass
class Context:
    """Everything a section is allowed to depend on."""

    config: Config
    now: datetime


class SectionError(RuntimeError):
    """Raised by a section when it cannot produce content."""
