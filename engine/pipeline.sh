#!/bin/sh
# usage: SLUG=living-sanatan-xyz /path/engine/pipeline.sh   (run inside the video folder)
mkdir -p out
T=$(python3 -c "import json;print(json.load(open('tl.json'))['TOTAL'])")
N=$(python3 -c "import math;print(math.ceil($T/30))")
ok(){ c=0; for f in c_$1_*.mp4; do d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f 2>/dev/null); [ -n "$d" ] && c=$((c+1)); done; echo $c; }
fin(){ n=$1; o=$2; for i in $(seq 0 $((N-1))); do echo "file '$PWD/c_${n}_$(printf %05d $((i*30))).mp4'"; done > list_$n.txt
 ffmpeg -y -loglevel error -f concat -safe 0 -i list_$n.txt -i sound.wav -map 0:v -map 1:a -c:v libx264 -preset medium -tune animation -crf 20 -maxrate 8M -bufsize 16M -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out/$o && echo FIN_$n >> pipe.log; }
for n in port land; do
  for k in 1 2 3; do [ "$(ok $n)" -ge "$N" ] && break; "$(dirname "$0")"/chunks.sh $n; done
  echo "$n chunks $(ok $n)/$N" >> pipe.log
  [ $n = port ] && fin port ${SLUG}-vertical-1080x1920.mp4 || fin land ${SLUG}-1920x1080.mp4
done
echo ALLDONE >> pipe.log
