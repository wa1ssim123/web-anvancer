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
import subprocess,sys
root=Path(sys.argv[1])
a=[Image.open(x).convert('RGB') for x in sorted(root.glob('tourism-*.jpg'))]
b=[Image.open(x).convert('RGB') for x in sorted(root.glob('kitchen-*.jpg'))]
assert len(a)>=76 and len(b)>=76,(len(a),len(b))
n=10
frames=list(a[:-n])
for i in range(n):
 frames.append(Image.blend(a[-n+i],b[i],(i+1)/(n+1)))
frames+=b[n:-n]
for i in range(n):
 frames.append(Image.blend(b[-n+i],a[i],(i+1)/(n+1)))
assert len(frames)>140
out=Path('assets/horenova-cinema-mobile-hq.webp')
paths=[]
for i,frame in enumerate(frames):
 path=root/f'frame-{i:03d}.jpg'
 frame.save(path,quality=92,subsampling=0)
 paths.append(path)
# Encode each FULLY OPAQUE JPEG as a separate still WebP first, then mux
# independent frames using explicit NO_BLEND. This guarantees Safari never sees
# transparent partial-frame patches (the earlier iPhone split-screen defect).
import re
for quality in (84,80,76):
 static=[]
 for i,src in enumerate(paths):
  still=root/f'opaque-{i:03d}.webp'
  subprocess.run(['cwebp','-quiet','-q',str(quality),'-m','4','-mt',str(src),'-o',str(still)],
                 check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  static.append(still)
 mux=['webpmux']
 for still in static:
  mux.extend(['-frame',str(still),'+42+0+0+0-b'])
 mux.extend(['-loop','0','-bgcolor','255,255,255,255','-o',str(out)])
 subprocess.run(mux,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 if out.stat().st_size<26_000_000:break
assert out.stat().st_size<30_000_000,'HD animation exceeds 30MB mobile budget'
meta=subprocess.run(['webpmux','-info',str(out)],capture_output=True,text=True,check=True)
detail=meta.stdout+'\n'+meta.stderr
rows=[line for line in detail.splitlines() if re.match(r'^\s*\d+:',line)]
assert len(rows)==len(frames),(len(rows),len(frames),detail[:600])
for row in rows:
 assert re.match(r'^\s*\d+:\s+720\s+1280\s+no\s+0\s+0\s+42\s+none\s+no\s+',row),row
assert out.read_bytes().count(b'ANMF')==len(frames)
print('PASS no alpha, no blending, full-frame keyframe demux:',len(rows),'frames')
print(f'PASS HD WebP: {len(frames)} complete keyframes, 720x1280, {1000/42:.2f}fps, {out.stat().st_size} bytes, quality={quality}')
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
