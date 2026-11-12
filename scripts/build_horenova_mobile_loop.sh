#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl --fail --silent --show-error --location --retry 2 --connect-timeout 15 --max-time 180  'https://video.wixstatic.com/video/d0158d_93b5716ed6c849d28888a69876201330/1080p/mp4/file.mp4' -o "$tmp/tourism.mp4"
curl --fail --silent --show-error --location --retry 2 --connect-timeout 15 --max-time 180  'https://video.wixstatic.com/video/d0158d_bb7977abc0eb4a0dad0971e78f4a7ecb/1080p/mp4/file.mp4' -o "$tmp/cuisine.mp4"
# These are real frames from the HORENOVA tourism and cooking videos, not
# a fake static image. Animated WebP remains in motion even in iOS Low Power Mode.
ffmpeg -hide_banner -loglevel error -y  -ss 1 -t 4 -i "$tmp/tourism.mp4"  -ss 1 -t 4 -i "$tmp/cuisine.mp4"  -filter_complex "[0:v]fps=10,scale=540:960:force_original_aspect_ratio=increase,crop=540:960,setsar=1,format=yuva420p[a];[1:v]fps=10,scale=540:960:force_original_aspect_ratio=increase,crop=540:960,setsar=1,format=yuva420p[b];[a][b]concat=n=2:v=1:a=0[out]"  -map '[out]' -an -c:v libwebp_anim -lossless 0 -quality 65 -compression_level 4 -loop 0  assets/horenova-cinema-mobile.webp
test -s assets/horenova-cinema-mobile.webp
file assets/horenova-cinema-mobile.webp
stat -c 'Animated image bytes: %s' assets/horenova-cinema-mobile.webp
