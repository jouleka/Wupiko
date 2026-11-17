#!/bin/bash
# usage: build.sh <scratch dir containing node_modules (puppeteer-core)>
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$HERE/../.."; S="$1"
rm -rf "$S/frames"; node "$HERE/capture.js" "$S" "$S/frames" 30 15
OUT="$REPO/store-assets/promo"; mkdir -p "$OUT"
# daybreak looped from 2.5s, fades in 0.05s, fades out 7.3s..8.4s (warmth bar completes at 8.3s)
ffmpeg -y -v error -framerate 30 -i "$S/frames/f%04d.png" \
 -stream_loop -1 -t 5.9 -i "$REPO/modules/wupiko-alarm/ios/Sounds/daybreak.wav" \
 -filter_complex "[1:a]aresample=44100,volume=0.9,afade=t=in:st=0:d=0.05,afade=t=out:st=4.8:d=1.1,adelay=2500|2500,apad=whole_dur=15,aformat=channel_layouts=stereo[a]" \
 -map 0:v -map "[a]" -t 15 -c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart "$OUT/wupiko-promo.mp4"
# contact sheet: 10 evenly spaced frames
ffmpeg -y -v error -i "$OUT/wupiko-promo.mp4" -vf "fps=10/15,scale=324:-1,tile=5x2" -frames:v 1 -q:v 3 "$OUT/contact-sheet.jpg"
