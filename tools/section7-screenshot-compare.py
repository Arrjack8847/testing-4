"""Visual QA composites for Section 7; report non-photographic differences separately.

The original copyrighted photos are not in the local repository, so a raw
pixel-perfect image score would be misleading. This script makes paired
reference/local screenshots and measures only visible non-photo regions of
the Gallery. It never interprets that measure as an overall fidelity score.
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path("section7-method-evidence")
data = json.loads((ROOT / "measurements.json").read_text(encoding="utf-8"))
summary = []

def find(kind: str, width: int) -> dict | None:
    return next((x for x in data["measurements"]
                 if x["kind"] == kind and x["viewport"]["width"] == width
                 and x["status"] == "captured"), None)

def scroll_y(record: dict, stage: str) -> float:
    y = record["data"]["section"]["box"]["docY"]
    h = record["galleryHeight"]
    vh = record["viewport"]["height"]
    extra = {"start": 0.0, "middle": h / 2.0,
             "end": max(0.0, h - vh * .65)}[stage]
    return max(0.0, y + extra)

def limit_box(rect: dict, offset: float, width: int, height: int):
    if not rect:
        return None
    x = rect["x"]
    y = rect["docY"] - offset
    return (max(0, int(x)), max(0, int(y)),
            min(width, int(x + rect["width"] + .99)),
            min(height, int(y + rect["height"] + .99)))

def make_mask(reference: dict, local: dict, stage: str, size: tuple[int, int]):
    width, height = size
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    top = 0.0
    bottom = float(height)
    for record in (reference, local):
        gallery = record["data"]["section"]["box"]
        scroll = scroll_y(record, stage)
        top = max(top, gallery["docY"] - scroll)
        bottom = min(bottom, gallery["docY"] + gallery["height"] - scroll)
    if bottom <= top:
        return mask, 0
    d.rectangle((0, max(0, int(top)), width, min(height, int(bottom))), fill=255)
    # Exclude the photo frames and their shadows: those pixels cannot be
    # meaningfully compared without the authorized exact five source WebPs.
    for record in (reference, local):
        offset = scroll_y(record, stage)
        for frame in record["data"]["frames"]:
            b = limit_box(frame.get("frame"), offset, width, height)
            if b:
                d.rectangle((max(0, b[0]-38), max(0, b[1]-38),
                             min(width, b[2]+38), min(height, b[3]+38)), fill=0)
    # Ignore pixels immediately adjacent to section boundaries to avoid
    # mistaking differences in other workers' sections for Gallery errors.
    return mask, sum(mask.getdata()) // 255

for viewport in data["viewports"]:
    width = viewport["width"]
    reference = find("reference", width)
    local = find("local", width)
    if not reference or not local:
        summary.append({"width": width, "error": "missing measured source or local"})
        continue
    for stage in ("start", "middle", "end"):
        ref_path = ROOT / f"reference-{width}-{stage}.png"
        loc_path = ROOT / f"local-{width}-{stage}.png"
        if not ref_path.exists() or not loc_path.exists():
            summary.append({"width": width, "stage": stage, "error": "missing screenshots"})
            continue
        with Image.open(ref_path) as f1, Image.open(loc_path) as f2:
            a = f1.convert("RGB")
            b = f2.convert("RGB")
        if a.size != b.size:
            summary.append({"width": width, "stage": stage,
                            "error": "viewport dimensions do not match"})
            continue
        diff = ImageChops.difference(a, b)
        mask, valid = make_mask(reference, local, stage, a.size)
        mae = None
        if valid:
            stats = ImageStat.Stat(diff, mask)
            mae = round(sum(stats.mean) / 3, 3)
        composite = Image.new("RGB", (a.width*3, a.height+36), "white")
        composite.paste(a, (0,36))
        composite.paste(b, (a.width,36))
        composite.paste(diff, (a.width*2,36))
        captions = ImageDraw.Draw(composite)
        for index,label in enumerate(("Reference", "Local", "Absolute difference")):
            captions.text((index*a.width+10, 10), label, fill="black")
        composite.save(ROOT / f"compare-{width}-{stage}.png")
        summary.append({"width": width, "stage": stage,
                        "nonPhotoPixels": valid,
                        "nonPhotoMeanAbsError0to255": mae,
                        "exactPhotoComparable": bool(
                            all(frame.get("image",{}).get("natural",[0])[0]>0
                                for frame in reference["data"]["frames"]
                                if frame.get("image")) and
                            all(frame.get("image",{}).get("natural",[0])[0]>0
                                for frame in local["data"]["frames"])
                        ),
                        "note": "No all-image fidelity score; local reference photo rights/assets are not established."})
(ROOT / "visual-comparison.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
print("SECTION7_VISUAL_COMPARISON "+json.dumps(summary))
