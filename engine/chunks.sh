#!/bin/sh
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
n=$1;T=$(python3 -c "import json;print(json.load(open('tl.json'))['TOTAL'])")
for c in $(python3 -c "import math;print(' '.join(str(i*30) for i in range(math.ceil($T/30))))"); do e=$((c+30)); f=c_${n}_$(printf %05d $c).mp4; if [ -s $f ] && ffprobe -v error -show_entries format=duration $f >/dev/null 2>&1 && [ "$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f | cut -d. -f1)" != "" ]; then continue; fi; E=$(python3 -c "print(min($e,$T))"); python3 "$(dirname "$0")"/render.py $n $c $E $PWD/$f >> render_$n.log 2>&1; done; echo DONE_$n >> render_$n.log
