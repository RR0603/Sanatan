#!/bin/sh
# A two-minute tour. Creates a throwaway folder, makes a mess, reverses it.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
REWIND="$HERE/bin/rewind"
DEMO=${1:-$(mktemp -d)}
# Keep the demo's registry and vaults to itself.
export REWIND_HOME="$DEMO/.rewind-home"

say() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

mkdir -p "$DEMO/notes/deep"
echo "the original"      > "$DEMO/notes/a.txt"
echo "buried treasure"   > "$DEMO/notes/deep/b.txt"
echo "untouched"         > "$DEMO/readme.md"
cd "$DEMO"

say "Protect the folder - from now on it is reversible at any time"
$REWIND protect "$DEMO" --no-start
$REWIND list

say "Do some work"
echo "the edited version" > notes/a.txt
echo "a new file"         > notes/c.txt
$REWIND snap -m "a good moment"

say "Make a terrible mistake"
rm -rf notes
ls

say "Reverse it"
$REWIND undo -y
find . -path ./.rewind -prune -o -type f -print | sort

say "Reverse the reverse"
$REWIND redo -y
ls

say "And back again, then wreck one folder only"
$REWIND undo -y >/dev/null
echo "wrecked" > notes/a.txt
echo "also wrecked" > readme.md
$REWIND snap -m "wrecked both" >/dev/null

say "Rewind notes/ alone - readme.md keeps its new content"
$REWIND restore notes --at f00002 -y
echo "notes/a.txt  -> $(cat notes/a.txt)"
echo "readme.md    -> $(cat readme.md)"

say "The film strip"
$REWIND timeline

say "Reverse the whole folder from somewhere else entirely"
cd /
$REWIND back f00002 --in "$DEMO" -y
echo "notes/a.txt  -> $(cat "$DEMO/notes/a.txt")"
echo "readme.md    -> $(cat "$DEMO/readme.md")   (the good version is back too)"

say "Stop protecting it (its history is kept)"
$REWIND forget "$DEMO"

printf '\nDemo folder: %s\n' "$DEMO"
