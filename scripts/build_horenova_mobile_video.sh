#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
for spec in 'tourism:d0158d_93b5716ed6c849d28888a69876201330' 'kitchen:d0158d_bb7977abc0eb4a0dad0971e78f4a7ecb'; do
  name="${spec%%:*}"
  id="${spec#*:}"
  # Prefer original high-bitrate master; fall back to 1080p rendition.
  if ! curl -fLsS --retry 2 --connect-timeout 15 --max-time 180 \
    "https://video.wixstatic.com/video/${id}/file" -o "$work/${name}.mp4"; then
    curl -fLsS --retry 2 --connect-timeout 15 --max-time 180 \
      "https://video.wixstatic.com/video/${id}/1080p/mp4/file.mp4" -o "$work/${name}.mp4"
  fi
  echo "$name source:"
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate \
    -of default=noprint_wrappers=1 "$work/${name}.mp4"
done
# Portrait 1080x1920, 30 frames per second, H.264: hardware-decoded on iPhones.
# Normal scene duration, no setpts/slow motion.
ffmpeg -hide_banner -loglevel error -y \
  -ss 0.5 -t 4.6 -i "$work/tourism.mp4" \
  -ss 0.5 -t 4.6 -i "$work/kitchen.mp4" \
  -filter_complex "[0:v]fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p[a];[1:v]fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p[b];[a][b]xfade=transition=fade:duration=0.45:offset=4.15,format=yuv420p[out]" \
  -map '[out]' -an -c:v libx264 -preset medium -crf 21 \
  -pix_fmt yuv420p -profile:v high -level:v 4.2 -r 30 -movflags +faststart \
  assets/horenova-mobile-cinema-1080p30.mp4
ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$work/tourism.mp4" \
  -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920' \
  -frames:v 1 -q:v 2 assets/horenova-mobile-tourism-poster.jpg
ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$work/kitchen.mp4" \
  -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920' \
  -frames:v 1 -q:v 2 assets/horenova-mobile-kitchen-poster.jpg
python - <<'PY'
import json,subprocess
from pathlib import Path
from PIL import Image
path=Path('assets/horenova-mobile-cinema-1080p30.mp4')
p=subprocess.run(['ffprobe','-v','error','-of','json','-show_entries',
  'stream=width,height,avg_frame_rate,codec_name:format=duration',str(path)],capture_output=True,text=True,check=True)
info=json.loads(p.stdout)
stream=info['streams'][0]
assert (stream['width'],stream['height'])==(1080,1920),stream
assert stream['avg_frame_rate']=='30/1',stream
assert stream['codec_name']=='h264',stream
assert 8<=float(info['format']['duration'])<=10,info
assert path.stat().st_size<25_000_000, path.stat().st_size
for poster in ['assets/horenova-mobile-tourism-poster.jpg','assets/horenova-mobile-kitchen-poster.jpg']:
 with Image.open(poster) as im:
  assert im.size==(1080,1920),poster
  assert im.format=='JPEG',poster
print('PASS iPhone HD movie:',path.stat().st_size,'bytes, 1080x1920 30fps H264, original speed; two full-resolution posters')
PY
