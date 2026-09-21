#!/bin/sh
# A two-minute tour. Creates a throwaway folder, makes a mess, reverses it.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
REWIND="$HERE/bin/rewind"
DEMO=${1:-$(mktemp -d)}

say() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

mkdir -p "$DEMO/notes/deep"
echo "the original"      > "$DEMO/notes/a.txt"
echo "buried treasure"   > "$DEMO/notes/deep/b.txt"
echo "untouched"         > "$DEMO/readme.md"
cd "$DEMO"

say "Start recording"
$REWIND init .

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

printf '\nDemo folder: %s\n' "$DEMO"
