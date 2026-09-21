"""Terminal output. The film strip, the diffs, the reports."""

from __future__ import annotations

import os
import sys

from .timeparse import ago, stamp

COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _c(code: str, text: str) -> str:
    return f"\033[{code}m{text}\033[0m" if COLOR else text


def dim(t: str) -> str:    return _c("2", t)
def bold(t: str) -> str:   return _c("1", t)
def green(t: str) -> str:  return _c("32", t)
def red(t: str) -> str:    return _c("31", t)
def yellow(t: str) -> str: return _c("33", t)
def cyan(t: str) -> str:   return _c("36", t)

OP_STYLE = {
    "add": (green, "+"),
    "modify": (yellow, "~"),
    "delete": (red, "-"),
    "retype": (yellow, "%"),
    "chmod": (dim, "m"),
}

KIND_SUFFIX = {"d": "/", "l": "@", "f": ""}


def human_bytes(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(n) < 1024 or unit == "TB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def change_line(change: dict) -> str:
    style, glyph = OP_STYLE.get(change["op"], (dim, "?"))
    suffix = KIND_SUFFIX.get(change.get("kind", "f"), "")
    detail = f"  {dim(change['detail'])}" if change.get("detail") else ""
    return f"  {style(glyph)} {change['path']}{suffix}{detail}"


def frame_line(frame, is_head: bool, width: int = 0) -> str:
    """One frame of the strip."""
    marker = cyan("▶") if is_head else dim("·")
    counts = []
    if frame.added:
        counts.append(green(f"+{frame.added}"))
    if frame.modified:
        counts.append(yellow(f"~{frame.modified}"))
    if frame.deleted:
        counts.append(red(f"-{frame.deleted}"))
    count_text = " ".join(counts) if counts else dim("no change")
    # Pad first, colour second: ANSI codes are invisible but still count as
    # characters to str.format, which would knock every column out of line.
    label = f"{frame.label:<13}"
    if frame.label == "auto":
        label = dim(label)
    elif frame.label in ("pre-rewind", "folder-rewind"):
        label = yellow(label)
    else:
        label = cyan(label)
    note = f"  {dim(frame.note)}" if frame.note else ""
    when = f"{stamp(frame.ts)}  {dim(f'{ago(frame.ts):>18}')}"
    head_tag = bold(cyan("  <- you are here")) if is_head else ""
    return f"{marker} {bold(frame.id)}  {when}  {label} {count_text}{note}{head_tag}"


def plan_report(plan, title: str = "This rewind would:") -> str:
    lines = [bold(title)]
    for path, kind in plan.removals[:200]:
        lines.append(f"  {red('-')} remove   {path}{KIND_SUFFIX.get(kind, '')}")
    for path in plan.makedirs[:200]:
        lines.append(f"  {green('+')} folder   {path}/")
    for path, record in plan.writes[:200]:
        lines.append(f"  {green('+')} restore  {path}{KIND_SUFFIX.get(record['t'], '')}")
    for path, mode in plan.chmods[:50]:
        lines.append(f"  {dim('m')} chmod    {path} -> {mode:o}")
    hidden = (max(0, len(plan.removals) - 200) + max(0, len(plan.makedirs) - 200)
              + max(0, len(plan.writes) - 200) + max(0, len(plan.chmods) - 50))
    if hidden:
        lines.append(dim(f"  ... and {hidden} more"))
    for warning in plan.warnings:
        lines.append(f"  {yellow('!')} {warning}")
    if plan.empty:
        lines.append(dim("  nothing - the files already look exactly like that"))
    return "\n".join(lines)


def apply_report(report) -> str:
    bits = []
    if report.restored:
        bits.append(green(f"{report.restored} restored"))
    if report.removed:
        bits.append(red(f"{report.removed} removed"))
    if report.chmodded:
        bits.append(dim(f"{report.chmodded} permission change(s)"))
    lines = ["  " + (", ".join(bits) if bits else dim("nothing needed changing"))]
    for warning in report.warnings:
        lines.append(f"  {yellow('!')} {warning}")
    for path, error in report.failures:
        lines.append(f"  {red('x')} {path}: {error}")
    return "\n".join(lines)
