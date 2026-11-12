#!/usr/bin/env python3
"""Build matching HORENOVA browser, Google, and PWA icons from the brand SVG.

Run: python scripts/build_horenova_favicons.py
Requirements: pip install cairosvg pillow
"""
from pathlib import Path
from io import BytesIO
import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "assets" / "horenova-brand-mark.svg"
source = SVG.read_bytes()
master = Image.open(
    BytesIO(cairosvg.svg2png(bytestring=source, output_width=1024, output_height=1024))
).convert("RGB")
output = [
    ("favicon.png", 192),
    ("assets/horenova-icon-96.png", 96),
    ("assets/horenova-icon-180.png", 180),
    ("assets/horenova-icon-192.png", 192),
    ("assets/horenova-icon-512.png", 512),
]
for filename, size in output:
    path = ROOT / filename
    path.parent.mkdir(parents=True, exist_ok=True)
    master.resize((size,size), Image.Resampling.LANCZOS).save(path, format="PNG", optimize=True)
    with Image.open(path) as check:
        assert check.size == (size,size)
master.save(ROOT/"favicon.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64),(96,96)])
print("Generated HORENOVA theme favicon assets:", ", ".join(x[0] for x in output), "favicon.ico")
