#!/usr/bin/env python3
"""Numeric Section 6 source-vs-local screenshot difference.

This script reads reference/local Playwright screenshots privately on the CI
runner and publishes only numerical metrics. Reference screenshots are never
committed, uploaded, or embedded in the report.
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[1] / "artifacts" / "section6-compare"
OUTPUT = ROOT / "pixel-parity.json"
WIDTHS = (320, 360, 390, 430)
TOLERANCE = 6


def analyze(reference: Image.Image, local: Image.Image, *, name: str) -> dict:
    if reference.size != local.size:
        return {"error": "different image dimensions", "reference": reference.size, "local": local.size}
    ref = reference.convert("RGB")
    loc = local.convert("RGB")
    diff = ImageChops.difference(ref, loc)
    mean = ImageStat.Stat(diff).mean
    extrema = ImageStat.Stat(diff).extrema
    pixels = list(diff.getdata())
    same = sum(max(p) == 0 for p in pixels)
    near = sum(max(p) <= TOLERANCE for p in pixels)
    meaningful = sum(max(p) > 25 for p in pixels)
    total = len(pixels)
    blurred = ImageChops.difference(
        ref.filter(ImageFilter.GaussianBlur(radius=4)),
        loc.filter(ImageFilter.GaussianBlur(radius=4)),
    )
    blur_mean = ImageStat.Stat(blurred).mean
    return {
        "region": name,
        "width": ref.width, "height": ref.height,
        "meanAbsoluteRgb": round(sum(mean) / 3, 3),
        "meanAbsoluteRgbChannels": [round(x, 3) for x in mean],
        "blurredMeanAbsoluteRgb": round(sum(blur_mean) / 3, 3),
        "exactSamePixelsPct": round(100 * same / total, 3),
        "nearlySamePixelsPct": round(100 * near / total, 3),
        "pixelsDifferentByOver25Pct": round(100 * meaningful / total, 3),
        "maxChannelDifferences": [int(m[1]) for m in extrema],
    }


def main():
    report = {"description": "Frame-aligned source/local screenshot pixel audit, reduced-motion enabled.",
              "widths": {}, "tolerancePerChannel": TOLERANCE}
    for width in WIDTHS:
        ra = ROOT / f"reference-{width}.png"
        la = ROOT / f"local-{width}.png"
        if not ra.is_file() or not la.is_file():
            report["widths"][str(width)] = {"error": "missing source or local screenshot"}
            continue
        with Image.open(ra) as reference, Image.open(la) as local:
            w, h = reference.size
            if local.size != (w, h):
                report["widths"][str(width)] = {"error": "source/local resolution mismatch"}
                continue
            # Both screenshots are aligned by Dress Code heading in existing tool.
            # Full frame also captures section boundaries, which may differ.
            bands = [
                ("full", 0, h),
                ("upper-third", 0, h // 3),
                ("middle-third", h // 3, 2 * h // 3),
                ("lower-third", 2 * h // 3, h),
            ]
            rows = [analyze(reference.crop((0, top, w, bottom)),
                            local.crop((0, top, w, bottom)), name=name)
                    for name, top, bottom in bands]
            report["widths"][str(width)] = {
                "resolution": [w, h],
                "regions": rows,
                "pixelIdentical": rows[0].get("exactSamePixelsPct") == 100,
            }
            row = rows[0]
            print(f"PIXEL_PARITY {width}x{h}: "
                  f"identical={row['exactSamePixelsPct']}% "
                  f"near6={row['nearlySamePixelsPct']}% "
                  f"MAE={row['meanAbsoluteRgb']} "
                  f"diff>25={row['pixelsDifferentByOver25Pct']}% "
                  f"blurredMAE={row['blurredMeanAbsoluteRgb']}")
            for piece in rows[1:]:
                print("  ", piece["region"], "MAE", piece["meanAbsoluteRgb"],
                      "same", piece["exactSamePixelsPct"], "%")
    ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, indent=2) + "\n")
    if any("error" in v for v in report["widths"].values()):
        raise SystemExit("Some screenshot pairs were unavailable; pixel exactness cannot be established.")

if __name__ == "__main__":
    main()
