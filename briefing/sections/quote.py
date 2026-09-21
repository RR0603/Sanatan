"""A thought for the day, picked locally so this section can never fail."""

from __future__ import annotations

from ..telegram import escape
from .base import Context, Section

QUOTES: list[tuple[str, str]] = [
    ("You have a right to your actions, but never to your actions' fruits.", "Bhagavad Gita 2.47"),
    ("The mind is restless, but it can be trained by practice and detachment.", "Bhagavad Gita 6.35"),
    ("Arise, awake, and stop not till the goal is reached.", "Katha Upanishad"),
    ("What we think, we become.", "Dhammapada"),
    ("He who is not satisfied with what he has would not be satisfied with what he wants.", "Socrates"),
    ("It is not that we have a short time to live, but that we waste much of it.", "Seneca"),
    ("The impediment to action advances action. What stands in the way becomes the way.", "Marcus Aurelius"),
    ("Well begun is half done.", "Aristotle"),
    ("Discipline equals freedom.", "Jocko Willink"),
    ("The best time to plant a tree was twenty years ago. The second best time is now.", "Proverb"),
    ("Do not wait for extraordinary circumstances to do good.", "Jean Paul"),
    ("Simplicity is the ultimate sophistication.", "Leonardo da Vinci"),
    ("A journey of a thousand miles begins with a single step.", "Lao Tzu"),
    ("Nature does not hurry, yet everything is accomplished.", "Lao Tzu"),
    ("The obstacle is the path.", "Zen proverb"),
    ("Fall seven times, stand up eight.", "Japanese proverb"),
    ("Knowing yourself is the beginning of all wisdom.", "Aristotle"),
    ("Small deeds done are better than great deeds planned.", "Peter Marshall"),
    ("Truth alone triumphs.", "Mundaka Upanishad"),
    ("You are what your deep, driving desire is.", "Brihadaranyaka Upanishad"),
    ("Action is the foundational key to all success.", "Pablo Picasso"),
    ("Perfection is achieved when there is nothing left to take away.", "Antoine de Saint-Exupery"),
    ("The quieter you become, the more you can hear.", "Ram Dass"),
    ("Slow is smooth, smooth is fast.", "Proverb"),
    ("Patience is bitter, but its fruit is sweet.", "Rousseau"),
    ("Where attention goes, energy flows.", "Proverb"),
    ("Make each day your masterpiece.", "John Wooden"),
    ("We suffer more in imagination than in reality.", "Seneca"),
    ("An unexamined life is not worth living.", "Socrates"),
    ("Let go, or be dragged.", "Zen proverb"),
    ("The only way out is through.", "Robert Frost"),
]


def pick(day_of_year: int) -> tuple[str, str]:
    """Deterministic rotation: same quote for everyone on a given day."""
    return QUOTES[(day_of_year - 1) % len(QUOTES)]


def build(ctx: Context) -> Section:
    text, author = pick(ctx.now.timetuple().tm_yday)
    return Section(
        key="quote",
        title="Thought for the day",
        lines=[f"<i>“{escape(text)}”</i>", f"— {escape(author)}"],
    )
