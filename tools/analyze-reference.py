"""Inspect source WebP dimensions and painted alpha bounding boxes.

Downloads into a temporary working directory; does not commit reference images.
Use only when the artwork owner has authorized this inspection.
"""
from __future__ import annotations
from pathlib import Path
from urllib.request import Request, urlopen
from io import BytesIO
import re, sys
from PIL import Image

base = "https://undangankahwin.com/images/concierge/packs/tasik-kayangan/"
root = Path(__file__).resolve().parents[1]
files = re.findall(r"^([a-z0-9_]+\.webp)$", (root / "ASSET-MANIFEST.txt").read_text(), re.M)
if len(files) != 25:
    sys.exit(f"Expected 25 assets; got {len(files)}")
print("File | canvas W x H | alpha bbox x0 y0 x1 y1 | painted percentage | bytes", flush=True)
for name in files:
    target = root / "assets" / name
    if target.is_file():
        raw = target.read_bytes()
    else:
        req = Request(base + name, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=40) as response:
            raw = response.read()
    if raw[:4] != b"RIFF" or raw[8:12] != b"WEBP":
        raise RuntimeError(f"Not a WebP file: {name}")
    im = Image.open(BytesIO(raw)).convert("RGBA")
    alpha = im.getchannel("A")
    bbox = alpha.getbbox()
    w,h = im.size
    coverage = 0 if not bbox else round((bbox[2]-bbox[0])*(bbox[3]-bbox[1])/(w*h)*100,2)
    print(f"{name:15} | {w:4} x {h:4} | {str(bbox):26} | {coverage:6.2f}% | {len(raw):8}", flush=True)
