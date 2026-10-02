# Rewind

**A time machine for your files.** Protect any folder and it becomes reversible
at any time. Rewind records what you do as a film, so when you make a mistake
you can simply play it backwards.

```console
$ rm -rf notes/            # the mistake

$ rewind undo
Rewinding to f00014  (2026-09-21 20:34:41, 12 seconds ago)
  kept what was on disk first as f00015 - 'rewind redo' comes back to it
  5 restored
  playhead: f00014 (14 of 15)

$ ls notes/
a.txt  c.txt  deep/
```

No dialog boxes, no "are you sure you want to permanently delete". You go back.

---

## Pick your folders once

```console
$ rewind protect ~/Documents
Protected /home/you/Documents
  f00001: 2,418 files, 184.2 MB
  history kept in /home/you/.local/share/rewind/vaults/Documents-11464d3b
  recorder running (pid 4471) - this folder is now reversible at any time

$ rewind protect ~/code/app
$ rewind autostart --install        # and it comes back after a reboot
```

From then on those folders are always being recorded, and either one can be
reversed whenever you want — from inside it, or from anywhere else:

```console
$ rewind list
Folders you can reverse at any time
  /home/you/Documents
        412 frames     18.2 MB  recording  last frame 2 minutes ago
  /home/you/code/app
         88 frames      4.1 MB  recording  last frame 1 hour ago

  recorder running (pid 4471)

$ rewind undo --in ~/Documents     # from wherever you happen to be
```

Running `rewind protect` with no folder offers a list to choose from. One
recorder process handles every protected folder, so twenty folders cost one
sleeping process rather than twenty.

Reversing does not depend on the recorder having been running. Rewind always
compares the frame you asked for against what is *actually on disk now*, so a
folder is reversible even if the recorder was off when the mistake happened —
the last frame it managed to take is still there, and your unrecorded work is
captured before anything is undone.

---

## The idea

Rewind records your folder as a sequence of **frames**. Each frame is a complete
picture of the tree at one moment. A **playhead** marks the frame you are living
in. Move it backwards and the files on disk are rewound to match; move it
forwards and they play again.

```
  f00011      f00012      f00013      f00014      f00015
    ·───────────·───────────·───────────▶───────────·
  9:01        9:04        9:12        9:20        9:21
                                        ▲
                                   playhead
             ◀── rewind undo                rewind redo ──▶
```

Three things make it safe to use without thinking:

**Nothing is ever deleted.** Rewinding does not discard the future. Before every
rewind, whatever is on disk is recorded as its own frame. The state you rewound
away from is still there, one `rewind redo` away.

**The reverse can be reversed.** Because a rewind is itself recorded, you can
undo an undo, as many times as you like, in either direction.

**Folders are first class.** You can rewind a single folder and leave everything
else exactly as it is, or bring back a folder you deleted an hour ago without
touching the work you have done since.

## Install

Rewind is pure Python 3.9+ with no dependencies at all.

```sh
pip install .            # installs the 'rewind' command
```

Or just run it out of the checkout, with nothing installed:

```sh
./bin/rewind --help
```

## Two ways to record

**Protected folders** (recommended) are listed centrally and recorded by one
always-on service, so any of them can be reversed at any time:

```sh
rewind protect ~/Documents     # or bare 'rewind protect' to choose from a list
rewind autostart --install     # start recording again after a reboot
rewind list                    # what is protected, and its state
rewind forget ~/Documents      # stop protecting it (history is kept)
```

Their history lives in `$REWIND_HOME` (normally `~/.local/share/rewind`), so
protecting a folder does not add anything to it.

**A single folder**, with its history kept inside it so it travels when you move
or copy the folder:

```sh
cd ~/important-project
rewind init                    # history goes in ./.rewind
rewind watch                   # record this one folder in the background
```

Either way the recorder watches for changes (via inotify on Linux, polling
everywhere else) and cuts a frame each time a burst of edits settles. Save a
file forty times and you get one frame, not forty. `rewind protect --inside`
gives you both: central listing, in-folder history.

To have every frame labelled with the shell command that caused it — so your
timeline reads `rm -rf notes/` instead of `auto` — add the shell hook:

```sh
eval "$(rewind hook bash)"      # or: zsh, fish
```

## Going back

All of these act on the protected folder you are standing in, or on the one you
name with `--in <folder>`.

| You want to | Command |
| --- | --- |
| Undo the last thing | `rewind undo` |
| Undo the last three things | `rewind undo 3` |
| Take the undo back | `rewind redo` |
| Go back ten minutes | `rewind back 10m` |
| Go back to 2pm today | `rewind back 14:00` |
| Go back to a particular frame | `rewind back f00012` |
| Go back to the very start | `rewind back start` |
| Bring back one deleted folder | `rewind restore notes/` |
| Bring back a file as it was an hour ago | `rewind restore src/app.py --at 1h` |
| Rewind one folder, leave the rest alone | `rewind back 1h --path src/` |
| Reverse a folder you are not standing in | add `--in ~/Documents` |
| See what would happen, change nothing | add `--dry-run` |

Every one of these prints exactly what it is about to do, and asks before
removing anything that exists right now.

## Looking around

```sh
rewind status                    # where the playhead is, what has changed since
rewind timeline                  # the film strip
rewind timeline --path src/api   # only the frames that touched this path
rewind show f00012               # what changed in one frame
rewind diff f00010 f00014        # compare two moments
```

```console
$ rewind timeline
· f00011  2026-09-21 09:01:22        20 minutes ago  auto      +1
· f00012  2026-09-21 09:04:09        17 minutes ago  command   ~3        npm install
· f00013  2026-09-21 09:12:47         9 minutes ago  snapshot  +2 ~1     before refactor
▶ f00014  2026-09-21 09:20:03         1 minute ago   command   -5        rm -rf notes/   <- you are here
```

## Housekeeping

```sh
rewind verify              # check every frame can still be restored
rewind gc                  # drop old automatic frames and the data nothing needs
rewind service status      # is the always-on recorder running?
rewind service restart     # restart it
rewind stop --all          # stop recording everything
```

Frames are cheap: file contents are stored once, content-addressed and
compressed, and shared between every frame that contains them. A thousand frames
of a tree where one file keeps changing cost one tree plus a thousand versions of
that one file. `rewind gc` keeps the first frame, the playhead, the newest
frames, and everything you named yourself.

One caveat on disk usage: like git's loose objects, each stored version is its
own file, so it occupies at least one filesystem block. A tree of 2,000 tiny
source files holds about 58 KB of compressed content but takes roughly 9 MB of
blocks. That overhead is per *distinct version*, not per frame, and it only
matters for trees made of very small files.

## What it records, and what it does not

Rewind is about **the folders you point it at** — a project, a documents folder,
`~/.config`, a whole home directory. It is deliberately not a whole-machine
snapshotter, and being honest about the edges matters more than a nice pitch:

- **Files, folders, symlinks and permission bits** are recorded and restored.
  Ownership and extended attributes are not.
- **Untracked things are never touched.** Anything matched by the ignore list
  (see `.rewind/config.json`) is invisible to Rewind, so a rewind will not delete
  your `node_modules` or `.git` — and will not bring them back either. A folder
  that still holds ignored files is kept rather than removed, and Rewind says so.
- **Very large files** (over 64 MB by default) are tracked by name and size but
  not by content, so their contents cannot be restored. Rewind tells you when a
  rewind hits one instead of silently skipping it. Raise `max_file_size` if you
  want them included.
- **A file created and deleted between two frames** was never recorded, so it
  cannot come back. With the recorder running this window is small; without it,
  it is however long you went between commands.
- **Running programs, databases mid-write, installed packages and system
  services** are outside the model. Rewinding a folder under a running service is
  as safe — and as unsafe — as editing those files by hand.
- **The system itself cannot be protected.** `/`, `/proc`, `/sys`, `/dev`,
  `/run` and `/boot` are refused: recording those would mean recording the
  machine, which this is not. Your home directory is fine.
- **This is not a backup.** It lives on the same disk as the thing it protects.
  It saves you from *you*, not from a failing drive.

## How it works

```
~/.local/share/rewind/            $REWIND_HOME
  registry.json                   which folders are protected
  service.pid, service.log        the always-on recorder
  vaults/Documents-11464d3b/      one vault per protected folder
    config.json                   what to record, what to leave alone
    objects/                      every distinct file version, once, compressed
    frames/                       one gzipped manifest per frame
    timeline.jsonl                the frame index, append-only
    HEAD                          where the playhead is
```

A folder recorded with `rewind init` (or `protect --inside`) keeps that same
layout in its own `.rewind/` instead. Either way, Rewind's own storage is pruned
while scanning, so protecting a folder that happens to contain the vault — your
home directory, say — does not make the recording record itself.

Cutting a frame means walking the tree, storing any contents not already in
`objects/`, and appending a manifest. Unchanged files are recognised by size and
mtime and are not re-read, except while they are still warm — a file touched in
the last couple of seconds is always re-read, so a change inside a single
filesystem timestamp tick cannot slip past.

Rewinding means: scan what is actually on disk *right now*, compare it to the
frame you asked for, and apply the difference — restore what is missing, remove
what should not be there, fix permissions. Rewind never assumes the disk still
matches its own records, which is what lets it recover from changes made while
it was not running.

Each frame records the playhead it was cut from, so history is a tree rather
than a line. Rewind, work on something else, rewind again: every branch stays
reachable, and `undo` always means "the state this one came from".

## Tests

```sh
python3 -m unittest discover -s tests -v
```

158 tests covering the store, the scanner, diffing, planning, time parsing, the
folder registry, protecting and forgetting folders, reversing a folder from
outside it, the single-folder recorder, the multi-folder service and both daemon
lifecycles.

## License

MIT.
