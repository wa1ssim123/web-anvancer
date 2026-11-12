#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fLsS --retry 3 --connect-timeout 15 --max-time 180   'https://video.wixstatic.com/video/d0158d_93b5716ed6c849d28888a69876201330/1080p/mp4/file.mp4' -o "$tmp/tourism.mp4"
curl -fLsS --retry 3 --connect-timeout 15 --max-time 180   'https://video.wixstatic.com/video/d0158d_bb7977abc0eb4a0dad0971e78f4a7ecb/1080p/mp4/file.mp4' -o "$tmp/kitchen.mp4"
# Generate FULL-OPAQUE, FULL-CANVAS frames: never WebP delta tiles/patches,
# which can display visible split frames in Mobile Safari.
for kind in tourism kitchen; do
  ffmpeg -hide_banner -loglevel error -y -ss 1 -t 3.6 -i "$tmp/$kind.mp4"     -vf 'fps=9,scale=432:768:force_original_aspect_ratio=increase,crop=432:768,setsar=1'     -q:v 4 "$tmp/${kind}-%03d.jpg"
done
python - "$tmp" <<'PY'
from PIL import Image
from pathlib import Path
import sys
root=Path(sys.argv[1])
a=[Image.open(x).convert('RGB') for x in sorted(root.glob('tourism-*.jpg'))]
b=[Image.open(x).convert('RGB') for x in sorted(root.glob('kitchen-*.jpg'))]
assert len(a)>=25 and len(b)>=25, f'Missing frames: {len(a)}, {len(b)}'
count=5
# Fade over 5 full frames in both directions, without partial-image patches.
frames=a[:-count]
for i in range(count):
    frames.append(Image.blend(a[-count+i],b[i],(i+1)/(count+1)))
frames+=b[count:-count]
for i in range(count):
    frames.append(Image.blend(b[-count+i],a[i],(i+1)/(count+1)))
# Full-frame, opaque GIF palette per frame; disposal clears the whole canvas.
pal=[frame.quantize(colors=112,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
     for frame in frames]
out=Path('assets/horenova-cinema-mobile.gif')
pal[0].save(out,format='GIF',save_all=True,append_images=pal[1:],
            duration=110,loop=0,disposal=2,optimize=False)
with Image.open(out) as im:
    assert im.n_frames>=45, im.n_frames
    assert im.size==(432,768), im.size
    for index in range(im.n_frames):
        im.seek(index)
        bbox=im.tile[0][1]
        assert bbox==(0,0,432,768), f'Partial image frame {index}: {bbox}'
        assert im.info.get('duration',0)>0, f'No frame duration {index}'
print('PASS full-frame opaque moving GIF:',out.stat().st_size,'bytes,',len(pal),'frames')
assert out.stat().st_size<=14_000_000, 'GIF too large for mobile'
PY
