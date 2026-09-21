"""Command line interface for Rewind."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

from . import __version__, render, watcher
from .config import find_repo
from .engine import Repo, RewindError, build_plan, diff_manifests
from .timeparse import ago, parse_when, stamp


# -- plumbing ---------------------------------------------------------------

def _repo(args) -> Repo:
    if getattr(args, "root", None):
        root = Path(args.root).resolve()
    else:
        found = find_repo()
        if found is None:
            raise RewindError(
                "nothing here is being recorded. Run 'rewind init' in the folder "
                "you want to be able to reverse.")
        root = found
    return Repo.open(root)


def _rel(repo: Repo, path: str) -> str:
    """Turn any path the user typed into a repo-relative one."""
    full = Path(path).expanduser()
    if not full.is_absolute():
        full = Path.cwd() / full
    try:
        rel = full.resolve().relative_to(repo.root)
    except ValueError:
        raise RewindError(f"{path} is outside {repo.root}, which is what is being recorded")
    return "" if str(rel) == "." else str(rel).replace(os.sep, "/")


def _resolve_when(repo: Repo, spec: str) -> int:
    kind, value = parse_when(spec)
    frames = repo.timeline.frames
    if not frames:
        raise RewindError("this timeline has no frames yet")
    if kind == "frame":
        if value == -1:
            return frames[-1].seq
        frame = repo.timeline.get(int(value))
        if frame is None:
            raise RewindError(
                f"there is no frame f{int(value):05d} - 'rewind timeline' shows what exists")
        return frame.seq
    if kind == "steps":
        return repo.step(-1, int(value))
    frame = repo.frame_at_time(value)
    if frame is None:
        raise RewindError(f"nothing was recorded at or before {stamp(value)}")
    return frame.seq


def _confirm(plan, assume_yes: bool) -> bool:
    """Ask before removing things, unless there is nobody to ask."""
    if assume_yes or not plan.removals or not sys.stdin.isatty():
        return True
    count = len(plan.removals)
    answer = input(
        f"This removes {count} file(s)/folder(s) that exist now. "
        f"They stay recoverable. Continue? [y/N] ").strip().lower()
    return answer in ("y", "yes")


def _apply_and_report(repo: Repo, plan, report, safety, target_frame, header: str) -> None:
    print(header)
    if safety:
        print(render.dim(f"  kept what was on disk first as {safety.id} - "
                         f"'rewind redo' comes back to it"))
    print(render.apply_report(report))
    position, total = repo.timeline.position()
    print(render.dim(f"  playhead: {target_frame.id} ({position} of {total})"))


# -- commands ----------------------------------------------------------------

def cmd_init(args) -> int:
    root = Path(args.path or ".").resolve()
    if not root.is_dir():
        raise RewindError(f"{root} is not a folder")
    repo = Repo.init(root, ignore=args.ignore)
    frame = repo.timeline.latest()
    print(f"Recording {render.bold(str(root))}")
    print(f"  first frame {frame.id}: {frame.files} files, "
          f"{render.human_bytes(frame.bytes)}")
    print()
    print("  " + render.dim("rewind watch") + "    keep recording in the background")
    print("  " + render.dim("rewind undo") + "     step back one frame")
    print("  " + render.dim("rewind back 10m") + " go back ten minutes")
    return 0


def cmd_snap(args) -> int:
    repo = _repo(args)
    frame = repo.commit(label=args.label or "snapshot", note=args.message or "",
                        force=args.force)
    if frame is None:
        print(render.dim("nothing has changed since the last frame"))
        return 0
    print(f"{render.bold(frame.id)}  +{frame.added} ~{frame.modified} -{frame.deleted}"
          + (f"  {frame.note}" if frame.note else ""))
    return 0


def cmd_status(args) -> int:
    repo = _repo(args)
    changes, result = repo.pending_changes()
    head = repo.head_frame()
    position, total = repo.timeline.position()
    pid = watcher.running_pid(repo)

    if args.json:
        print(json.dumps({
            "root": str(repo.root),
            "head": head.id if head else None,
            "position": position,
            "frames": total,
            "recording": bool(pid),
            "pid": pid,
            "pending": [c.to_dict() for c in changes],
        }, indent=2))
        return 0

    print(f"{render.bold('Recording')} {repo.root}")
    if head:
        print(f"  playhead  {render.bold(head.id)} ({position} of {total})  "
              f"{stamp(head.ts)}  {render.dim(ago(head.ts))}")
    if position < total:
        print(render.yellow(f"  you are {total - position} frame(s) back in the past - "
                            f"'rewind redo' plays forward"))
    print(f"  recorder  " + (render.green(f"running (pid {pid})") if pid
                             else render.dim("not running - 'rewind watch' starts it")))
    print(f"  store     {total} frames, {render.human_bytes(repo.store.disk_usage())} on disk")
    if result.errors:
        print(render.yellow(f"  {len(result.errors)} path(s) could not be read "
                            f"(first: {result.errors[0][0]})"))

    if not changes:
        print(f"\n  {render.dim('nothing has changed since that frame')}")
        return 0
    print(f"\n  {len(changes)} change(s) not yet in a frame:")
    for change in changes[:40]:
        print(render.change_line(change.to_dict()))
    if len(changes) > 40:
        print(render.dim(f"  ... and {len(changes) - 40} more"))
    return 0


def cmd_timeline(args) -> int:
    repo = _repo(args)
    frames = repo.timeline.frames
    head = repo.timeline.head()

    if args.path:
        rel = _rel(repo, args.path)
        entries = repo.path_history(rel)
        if args.json:
            print(json.dumps([{"frame": f.id, "ts": f.ts, "what": what}
                              for f, what in entries], indent=2))
            return 0
        if not entries:
            print(render.dim(f"{rel or '.'} has never changed in this timeline"))
            return 0
        print(render.bold(f"History of {rel or '.'}"))
        for frame, what in entries[-args.number:]:
            print(f"  {render.bold(frame.id)}  {stamp(frame.ts)}  "
                  f"{render.dim(ago(frame.ts)):>18}  {what}")
        return 0

    shown = frames if args.all else frames[-args.number:]
    if args.json:
        print(json.dumps([{"id": f.id, "seq": f.seq, "ts": f.ts, "label": f.label,
                           "note": f.note, "prev": f.prev, "added": f.added,
                           "modified": f.modified, "deleted": f.deleted,
                           "head": f.seq == head} for f in shown], indent=2))
        return 0

    if len(shown) < len(frames):
        print(render.dim(f"... {len(frames) - len(shown)} older frame(s), "
                         f"use --all to see them"))
    for frame in shown:
        print(render.frame_line(frame, frame.seq == head))
    changes, _ = repo.pending_changes()
    if changes:
        print(render.dim(f"\n  {len(changes)} change(s) since {shown[-1].id if shown else ''} "
                         f"are not in a frame yet"))
    return 0


def cmd_show(args) -> int:
    repo = _repo(args)
    seq = _resolve_when(repo, args.frame)
    frame = repo.timeline.get(seq)
    changes = repo.timeline.load_changes(seq)
    print(render.frame_line(frame, frame.seq == repo.timeline.head()))
    if not changes:
        print(render.dim("  (this frame recorded no changes)"))
    for change in changes[:args.number]:
        print(render.change_line(change))
    if len(changes) > args.number:
        print(render.dim(f"  ... and {len(changes) - args.number} more"))
    return 0


def cmd_diff(args) -> int:
    repo = _repo(args)
    if args.b:
        left = repo.timeline.load_manifest(_resolve_when(repo, args.a))
        right = repo.timeline.load_manifest(_resolve_when(repo, args.b))
        title = f"{args.a} -> {args.b}"
    elif args.a:
        left = repo.timeline.load_manifest(_resolve_when(repo, args.a))
        right = repo.scan_disk().manifest
        title = f"{args.a} -> now"
    else:
        left = repo.head_manifest()
        right = repo.scan_disk().manifest
        title = "playhead -> now"

    changes = diff_manifests(left, right)
    if args.json:
        print(json.dumps([c.to_dict() for c in changes], indent=2))
        return 0
    print(render.bold(title))
    if not changes:
        print(render.dim("  identical"))
        return 0
    for change in changes[:args.number]:
        print(render.change_line(change.to_dict()))
    if len(changes) > args.number:
        print(render.dim(f"  ... and {len(changes) - args.number} more"))
    return 0


def _travel(repo: Repo, target_seq: int, args, verb: str) -> int:
    subtree = _rel(repo, args.path) if getattr(args, "path", None) else None
    target_frame = repo.timeline.get(target_seq)
    if target_frame is None:
        raise RewindError(f"there is no frame f{target_seq:05d}")

    if target_seq == repo.timeline.head() and not subtree:
        changes, _ = repo.pending_changes()
        if not changes:
            print(render.dim(f"already at {target_frame.id} - nothing to {verb}"))
            return 0

    if args.dry_run:
        plan, _, _ = repo.seek(target_seq, subtree=subtree, dry_run=True)
        print(render.bold(f"{verb} to {target_frame.id}  "
                          f"({stamp(target_frame.ts)}, {ago(target_frame.ts)})"))
        print(render.plan_report(plan, "Would:"))
        print(render.dim("\n  nothing was changed - drop --dry-run to do it"))
        return 0

    preview, _, _ = repo.seek(target_seq, subtree=subtree, dry_run=True, safety=False)
    if not _confirm(preview, args.yes):
        print(render.dim("left everything as it is"))
        return 1

    plan, report, safety = repo.seek(target_seq, subtree=subtree)
    scope = f" [{subtree}/ only]" if subtree else ""
    _apply_and_report(
        repo, plan, report, safety, target_frame,
        render.bold(f"{verb} to {target_frame.id}{scope}  "
                    f"({stamp(target_frame.ts)}, {ago(target_frame.ts)})"))
    if report.failures:
        return 1
    return 0


def cmd_undo(args) -> int:
    repo = _repo(args)
    changes, result = repo.pending_changes()
    if changes:
        # The mistake may not be in a frame yet, so the first step back is to
        # the playhead: it undoes the work that was never recorded.
        if args.dry_run:
            target = repo.step(-1, args.count - 1)
            return _travel(repo, target, args, "Rewinding")
        frame = repo.commit(label="pre-rewind", note="state before undo",
                            scan_result=result)
        if frame:
            print(render.dim(f"recorded the current state as {frame.id} first"))
    target = repo.step(-1, args.count)
    if target == repo.timeline.head():
        print(render.dim("this is the oldest frame - there is nothing before it"))
        return 0
    return _travel(repo, target, args, "Rewinding")


def cmd_redo(args) -> int:
    repo = _repo(args)
    target = repo.step(+1, args.count)
    if target == repo.timeline.head():
        print(render.dim("this is the newest frame - there is nothing after it"))
        return 0
    return _travel(repo, target, args, "Playing forward")


def cmd_back(args) -> int:
    repo = _repo(args)
    return _travel(repo, _resolve_when(repo, args.when), args, "Rewinding")


def cmd_goto(args) -> int:
    repo = _repo(args)
    return _travel(repo, _resolve_when(repo, args.when), args, "Jumping")


def cmd_restore(args) -> int:
    repo = _repo(args)
    rel = _rel(repo, args.path)
    if not rel:
        raise RewindError("to rewind the whole tree use 'rewind back', not 'restore'")

    if args.at:
        seq = _resolve_when(repo, args.at)
    else:
        seq = _last_seq_containing(repo, rel)
        if seq is None:
            raise RewindError(
                f"{rel} does not appear anywhere in this timeline - "
                f"check the path, or 'rewind timeline --path {rel}'")

    frame = repo.timeline.get(seq)
    manifest = repo.timeline.load_manifest(seq)
    if rel not in manifest:
        raise RewindError(f"{rel} did not exist at {frame.id} "
                          f"({stamp(frame.ts)}) - try a different --at")

    current = repo.scan_disk().manifest
    plan = build_plan(current, manifest, subtree=rel)
    kind = "folder" if manifest[rel]["t"] == "d" else "file"

    if args.dry_run:
        print(render.bold(f"Restoring {kind} {rel} from {frame.id} "
                          f"({ago(frame.ts)})"))
        print(render.plan_report(plan, "Would:"))
        print(render.dim("\n  nothing was changed - drop --dry-run to do it"))
        return 0
    if not _confirm(plan, args.yes):
        print(render.dim("left everything as it is"))
        return 1

    safety = repo.commit(label="pre-rewind", note=f"state before restoring {rel}")
    report = repo.apply(plan)
    repo.commit(label="restore", note=f"{rel} restored from {frame.id}")
    print(render.bold(f"Restored {kind} {render.bold(rel)} as it was at "
                      f"{frame.id} ({stamp(frame.ts)}, {ago(frame.ts)})"))
    if safety:
        print(render.dim(f"  kept what was on disk first as {safety.id}"))
    print(render.apply_report(report))
    return 1 if report.failures else 0


def _last_seq_containing(repo: Repo, rel: str) -> int | None:
    """The newest frame in which this path still existed."""
    for frame in reversed(repo.timeline.frames):
        try:
            manifest = repo.timeline.load_manifest(frame.seq)
        except KeyError:
            continue
        if rel in manifest:
            return frame.seq
    return None


def cmd_watch(args) -> int:
    repo = _repo(args)
    if args.foreground:
        instance = watcher.Watcher(repo, args.interval, args.settle)
        import signal
        signal.signal(signal.SIGINT, instance.request_stop)
        signal.signal(signal.SIGTERM, instance.request_stop)
        instance.run(once=args.once)
        return 0
    try:
        pid = watcher.start_daemon(repo, args.interval, args.settle)
    except RuntimeError as exc:
        print(render.yellow(str(exc)))
        return 1
    print(f"Recording {repo.root} in the background (pid {pid})")
    print(render.dim(f"  log: {watcher.log_file(repo)}"))
    print(render.dim("  stop with 'rewind stop'"))
    return 0


def cmd_stop(args) -> int:
    repo = _repo(args)
    if watcher.stop_daemon(repo):
        print("Recorder stopped.")
        frame = repo.commit(label="auto", note="recorded on stop")
        if frame:
            print(render.dim(f"  cut {frame.id} for changes that were still pending"))
        return 0
    print(render.dim("the recorder was not running"))
    return 0


def cmd_gc(args) -> int:
    repo = _repo(args)
    stats = repo.gc(keep_days=args.days, keep_last=args.keep, dry_run=args.dry_run)
    word = "would drop" if stats["dry_run"] else "dropped"
    print(f"{word} {stats['frames_pruned']} frame(s), kept {stats['frames_kept']}")
    if not stats["dry_run"]:
        print(f"  freed {render.human_bytes(stats['bytes_freed'])} "
              f"from {stats['blobs_pruned']} unused blob(s)")
    return 0


def cmd_verify(args) -> int:
    repo = _repo(args)
    problems = repo.verify()
    if not problems:
        print(render.green(f"All {len(repo.timeline.frames)} frame(s) can be restored."))
        return 0
    print(render.red(f"{len(problems)} frame(s) are incomplete:"))
    for problem in problems[:20]:
        print(f"  {problem}")
    return 1


def cmd_mark(args) -> int:
    """Leave a note for the next frame. Used by the shell hook."""
    root = find_repo()
    if root is None:
        return 0
    words = list(args.text)
    while words and words[0] == "--":
        words.pop(0)
    text = " ".join(words).strip()
    if not text or text.startswith("rewind ") or text == "rewind":
        return 0
    try:
        (root / ".rewind" / "next-note").write_text(text[:300], encoding="utf-8")
    except OSError:
        pass
    return 0


HOOKS = {
    "bash": """# Rewind shell integration - add to ~/.bashrc:
#   eval "$(rewind hook bash)"
_rewind_mark() {
  [ -n "$COMP_LINE" ] && return
  rewind mark -- "$BASH_COMMAND" >/dev/null 2>&1
}
trap '_rewind_mark' DEBUG
""",
    "zsh": """# Rewind shell integration - add to ~/.zshrc:
#   eval "$(rewind hook zsh)"
autoload -Uz add-zsh-hook
_rewind_mark() { rewind mark -- "$1" >/dev/null 2>&1 }
add-zsh-hook preexec _rewind_mark
""",
    "fish": """# Rewind shell integration - add to ~/.config/fish/config.fish:
#   rewind hook fish | source
function _rewind_mark --on-event fish_preexec
    rewind mark -- $argv >/dev/null 2>&1
end
""",
}


def cmd_hook(args) -> int:
    print(HOOKS[args.shell], end="")
    return 0


# -- argument parsing ---------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="rewind",
        description="A time machine for your files. Record your work as a film, "
                    "then play it backwards when you make a mistake.",
        epilog="Try: rewind init  ->  rewind watch  ->  rewind undo")
    parser.add_argument("--version", action="version", version=f"rewind {__version__}")
    parser.add_argument("--root", help="act on this recorded folder instead of "
                                       "searching upwards from here")
    subparsers = parser.add_subparsers(dest="command", metavar="<command>")

    def add(name, func, help_text, **kwargs):
        sub = subparsers.add_parser(name, help=help_text, description=help_text, **kwargs)
        sub.set_defaults(func=func)
        return sub

    p = add("init", cmd_init, "start recording a folder")
    p.add_argument("path", nargs="?", help="folder to record (default: here)")
    p.add_argument("--ignore", action="append", default=[],
                   help="extra pattern to leave untracked (repeatable)")

    p = add("watch", cmd_watch, "keep recording in the background")
    p.add_argument("--foreground", "-f", action="store_true", help="do not detach")
    p.add_argument("--once", action="store_true",
                   help="cut one frame if anything changed, then exit")
    p.add_argument("--interval", type=float, help="seconds between scans")
    p.add_argument("--settle", type=float,
                   help="seconds of quiet before a burst of edits becomes a frame")

    add("stop", cmd_stop, "stop the background recorder")

    p = add("snap", cmd_snap, "cut a frame right now, with a name")
    p.add_argument("-m", "--message", help="what this moment is")
    p.add_argument("--label", help="label instead of 'snapshot'")
    p.add_argument("--force", action="store_true", help="even if nothing changed")

    p = add("status", cmd_status, "where the playhead is and what has changed since")
    p.add_argument("--json", action="store_true")

    p = add("timeline", cmd_timeline, "show the film strip")
    p.add_argument("-n", "--number", type=int, default=25, help="how many frames")
    p.add_argument("--all", action="store_true", help="every frame")
    p.add_argument("--path", help="only frames that touched this path")
    p.add_argument("--json", action="store_true")

    p = add("show", cmd_show, "what changed in one frame")
    p.add_argument("frame", help="a frame id, or a time like '2h'")
    p.add_argument("-n", "--number", type=int, default=200)

    p = add("diff", cmd_diff, "compare two moments")
    p.add_argument("a", nargs="?", help="from (default: the playhead)")
    p.add_argument("b", nargs="?", help="to (default: the files as they are now)")
    p.add_argument("-n", "--number", type=int, default=200)
    p.add_argument("--json", action="store_true")

    def travel_args(sub):
        sub.add_argument("--dry-run", "-n", action="store_true",
                         help="show what would change, change nothing")
        sub.add_argument("--yes", "-y", action="store_true", help="do not ask")
        sub.add_argument("--path", help="rewind only this file or folder")
        return sub

    p = travel_args(add("undo", cmd_undo, "step back one frame - the mistake button"))
    p.add_argument("count", nargs="?", type=int, default=1,
                   help="how many frames to step back")

    p = travel_args(add("redo", cmd_redo, "play forward again"))
    p.add_argument("count", nargs="?", type=int, default=1)

    p = travel_args(add("back", cmd_back,
                        "go back to how things were ('10m', '2h', 'f00012', 'start')"))
    p.add_argument("when", help="a duration, a time, or a frame id")

    p = travel_args(add("goto", cmd_goto, "move the playhead to an exact frame"))
    p.add_argument("when", help="a frame id, duration or time")

    p = add("restore", cmd_restore, "bring back one file or folder, leaving the rest alone")
    p.add_argument("path", help="the file or folder to bring back")
    p.add_argument("--at", help="from when (default: the last frame it existed in)")
    p.add_argument("--dry-run", "-n", action="store_true")
    p.add_argument("--yes", "-y", action="store_true")

    p = add("gc", cmd_gc, "drop old automatic frames and unused data")
    p.add_argument("--days", type=float, help="keep frames newer than this many days")
    p.add_argument("--keep", type=int, default=20, help="always keep the newest N frames")
    p.add_argument("--dry-run", "-n", action="store_true")

    add("verify", cmd_verify, "check every frame can still be restored")

    p = add("mark", cmd_mark, "label the next frame (used by the shell hook)")
    p.add_argument("text", nargs=argparse.REMAINDER)

    p = add("hook", cmd_hook, "print shell integration to eval")
    p.add_argument("shell", choices=sorted(HOOKS))

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "command", None):
        parser.print_help()
        return 0
    try:
        return args.func(args)
    except (RewindError, ValueError) as exc:
        print(render.red("rewind: ") + str(exc), file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        return 130
    except BrokenPipeError:
        return 0


if __name__ == "__main__":
    sys.exit(main())
