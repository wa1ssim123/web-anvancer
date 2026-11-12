#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
# Use the two original HD sources. Trim in real time; do not modify PTS or speed.
curl -fLsS --retry 3 --connect-timeout 15 --max-time 180 \
  'https://video.wixstatic.com/video/d0158d_93b5716ed6c849d28888a69876201330/1080p/mp4/file.mp4' -o "$work/tourism.mp4"
curl -fLsS --retry 3 --connect-timeout 15 --max-time 180 \
  'https://video.wixstatic.com/video/d0158d_bb7977abc0eb4a0dad0971e78f4a7ecb/1080p/mp4/file.mp4' -o "$work/kitchen.mp4"
# Two clips, 3.5 seconds each, full original temporal speed at 24 frames/second.
# Full-frame RGB animation keyframes avoid Safari's partial WebP tile artifacts.
for kind in tourism kitchen; do
 ffmpeg -hide_banner -loglevel error -y -ss 1 -t 3.5 -i "$work/$kind.mp4" \
  -vf 'fps=24,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1' \
  -frames:v 84 -q:v 3 "$work/${kind}-%03d.jpg"
done
python - "$work" <<'PY'
from PIL import Image, ImageChops, ImageStat
from pathlib import Path
import sys
root=Path(sys.argv[1])
a=[Image.open(x).convert('RGB') for x in sorted(root.glob('tourism-*.jpg'))]
b=[Image.open(x).convert('RGB') for x in sorted(root.glob('kitchen-*.jpg'))]
assert len(a)>=76 and len(b)>=76, (len(a),len(b))
# Smooth 0.42 second transition (10 real frames), no 9fps slow-motion simulation.
n=10
frames=list(a[:-n])
for i in range(n):
 frames.append(Image.blend(a[-n+i],b[i],(i+1)/(n+1)))
frames+=b[n:-n]
for i in range(n):
 frames.append(Image.blend(b[-n+i],a[i],(i+1)/(n+1)))
assert len(frames)>140
out=Path('assets/horenova-cinema-mobile-hq.webp')
for quality in (82,78,75):
 frames[0].save(out,format='WEBP',save_all=True,append_images=frames[1:],
  duration=42,loop=0,lossless=False,quality=quality,method=4,
  kmin=1,kmax=1,minimize_size=False,allow_mixed=False,
  background=(0,0,0,255))
 if out.stat().st_size < 26_000_000: break
assert out.stat().st_size < 30_000_000, 'HD asset too heavy for mobile'
with Image.open(out) as check:
 assert check.n_frames==len(frames), (check.n_frames,len(frames))
 assert check.size==(720,1280)
 for index in (0,20,len(a)-n-1,len(a)+10,len(frames)-1):
  check.seek(index)
  assert check.info.get('duration') in (41,42,43), (index,check.info.get('duration'))
  rendered=check.convert('RGB')
  stats=ImageStat.Stat(ImageChops.difference(rendered,frames[index]))
  assert max(stats.mean)<19, f'Frame {index} has compositing artifact: {stats.mean}'
# 42ms per frame gives ~23.8fps, NOT slow-motion or 9fps.
print(f'PASS HD animated WebP: {len(frames)} full-frame RGB keyframes, 720x1280, {1000/42:.2f}fps, {out.stat().st_size} bytes, quality={quality}')
PY
# Native hardware-decoded MP4 for iOS when muted autoplay is permitted. A
# hidden video is promoted ONLY once playback has actually started.
ffmpeg -hide_banner -loglevel error -y -ss 1 -t 3.5 -i "$work/tourism.mp4" \
  -ss 1 -t 3.5 -i "$work/kitchen.mp4" \
  -filter_complex "[0:v]fps=24,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p,setsar=1[a];[1:v]fps=24,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p,setsar=1[b];[a][b]xfade=transition=fade:duration=0.42:offset=3.08,format=yuv420p[out]" \
  -map '[out]' -an -c:v libx264 -preset fast -crf 23 -movflags +faststart -r 24 \
  -pix_fmt yuv420p assets/horenova-cinema-mobile-hq.mp4
test -s assets/horenova-cinema-mobile-hq.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate \
 -show_entries format=duration -of default=noprint_wrappers=1 assets/horenova-cinema-mobile-hq.mp4
