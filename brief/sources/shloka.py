"""A verse a day, from a small bundled collection.

Bundled rather than fetched so this section never depends on a service, and
selected by day-of-year so the whole collection cycles instead of repeating.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "shlokas.json"


@dataclass
class Shloka:
    reference: str
    sanskrit: str
    translation: str


def load_collection(path: Path | None = None) -> list:
    path = DATA_PATH if path is None else Path(path)
    entries = json.loads(path.read_text(encoding="utf-8"))
    return [
        Shloka(
            reference=e["reference"],
            sanskrit=e["sanskrit"],
            translation=e["translation"],
        )
        for e in entries
    ]


def shloka_for(day: date, collection: list | None = None) -> Shloka | None:
    """Pick the verse for `day`, cycling deterministically through the set."""
    verses = load_collection() if collection is None else collection
    if not verses:
        return None
    # Day-of-year keeps it stable for a given date and advances every morning.
    index = (day.toordinal()) % len(verses)
    return verses[index]
