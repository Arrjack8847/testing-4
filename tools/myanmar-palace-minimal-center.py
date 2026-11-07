#!/usr/bin/env python3
"""Read and minimally recenter the *original Myanmar palace pixels* in its canvas.

Strict Option A: no CSS, JS, camera, scale, crop, or other sprite changes.
Measure the narrow top roof spire's alpha silhouette rather than estimating a
visual offset from a screenshot. A correction is proposed only when warranted.
"""
import base64
import io
import json
import statistics
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "assets/skins/myanmar-luxury/palace.webp"
im = Image.open(PATH).convert("RGBA")
assert im.size == (1920,1920), f"Unexpected palace asset canvas {im.size}"
arr = np.asarray(im)
alpha = arr[:,:,3]
solid = alpha >= 96
ys, xs = np.nonzero(solid)
assert len(xs) > 100000, "Could not identify palace alpha"
top = int(ys.min())
# Inspect first 100-180 pixels of the actual central roof spire;
# row center estimates are less sensitive to isolated background noise than a
# full-image bounding box or global alpha centroid.
row_centers = []
for y in range(top + 18, min(top + 195, 1920)):
    xx = np.flatnonzero(solid[y])
    if len(xx) < 8 or len(xx) > 550:
        continue
    lo, hi = np.quantile(xx, (.06,.94))
    row_centers.append((float((lo+hi)/2),int(y),int(len(xx))))
assert len(row_centers) >= 40, "Insufficient roof spire observations"
apex_x = float(statistics.median(c[0] for c in row_centers))
dx = int(round(im.width/2 - apex_x))
assert abs(dx) <= 240, f"Measured offset unexpectedly large {dx}px"
# Changes smaller than 8px should be left untouched.
if abs(dx) < 8:
    dx = 0
bbox = im.getchannel("A").point(lambda x:255 if x>=24 else 0).getbbox()
assert bbox is not None
assert 0 <= bbox[0]+dx and bbox[2]+dx <= im.width, f"Center correction would crop palace: {bbox}, dx={dx}"
result = Image.new("RGBA", im.size, (0,0,0,0))
result.paste(im, (dx,0))
result.save(PATH,"WEBP",quality=91,method=6,exact=True)
with Image.open(PATH) as check:
    rgba = check.convert("RGBA")
    assert rgba.size == im.size
    new_bbox = rgba.getchannel("A").point(lambda x:255 if x>=24 else 0).getbbox()
    assert new_bbox[1] == bbox[1] and new_bbox[3] == bbox[3], "Vertical placement unexpectedly changed"
    assert new_bbox[0] == bbox[0]+dx and new_bbox[2] == bbox[2]+dx, "Horizontal alpha bounds changed unexpectedly"
metrics={
    "canvas":list(im.size), "apex_x_before_px":round(apex_x,1),
    "target_apex_x_px":960, "shift_right_px":dx,
    "roof_rows_measured":len(row_centers), "first_roof_y":top,
    "visible_bounds_before":list(bbox),"visible_bounds_after":list(new_bbox),
    "image_bytes":PATH.stat().st_size
}
print("MYANMAR_PALACE_CENTER="+json.dumps(metrics),flush=True)
print("MYANMAR_PALACE_B64="+base64.b64encode(PATH.read_bytes()).decode(),flush=True)
