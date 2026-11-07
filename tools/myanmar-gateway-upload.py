#!/usr/bin/env python3
"""Prepare the owner's uploaded original Myanmar gateway for the frozen arch.webp slot.

No outside artwork. Never modify the uploaded PNG. The existing Javascript,
camera curves and CSS geometry are intentionally untouched (Option A).
"""
import base64
import io
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
PNG=ROOT/"assets/skins/myanmar-luxury/bea1db68-4afc-4d72-ae54-d137c40f7299.png"
TARGET=ROOT/"assets/skins/myanmar-luxury/arch.webp"
with Image.open(PNG) as source:
    input_size=source.size
    input_mode=source.mode
    rgba=source.convert("RGBA")
    alpha=rgba.getchannel("A")
    # The arch is only valid as an overlay when the center is transparent.
    test_points=[(.5,.45),(.5,.6),(.5,.8)]
    center=[alpha.getpixel((int(rgba.width*x),int(rgba.height*y))) for x,y in test_points]
    alpha_hist=alpha.histogram()
    transparent=sum(alpha_hist[:16])/(rgba.width*rgba.height)
    opaque=sum(alpha_hist[240:])/(rgba.width*rgba.height)
    print("MYANMAR_UPLOADED_PNG "+json.dumps({
        "dimensions":input_size, "mode":input_mode, "transparent_ratio":round(transparent,4),
        "opaque_ratio":round(opaque,4), "center_alpha":center,
        "bytes":PNG.stat().st_size,
    }),flush=True)
    if max(center)>20:
        raise RuntimeError("Upload is not transparent through the gateway opening")
    if transparent<.25:
        raise RuntimeError("Upload has unexpectedly little alpha transparency")
    # Original PNG ratio is near 9:16. Fit exactly to the old arch slot.
    output=rgba.resize((1080,1920),Image.Resampling.LANCZOS)
    # Image only, same original 9:16 slot. Preserve full-size architecture.
    # RGB under invisible pixels is retained; never introduce a black matte.
    output.save(TARGET,format="WEBP",quality=87,method=6,exact=True)
with Image.open(TARGET) as check:
    check=check.convert("RGBA")
    oa=check.getchannel("A")
    center_after=[oa.getpixel((int(check.width*x),int(check.height*y))) for x,y in test_points]
    if max(center_after)>20:
        raise RuntimeError("WebP export lost center transparency")
    bbox=oa.point(lambda a:255 if a>=24 else 0).getbbox()
    metrics={
        "source_dimensions":input_size,"output_dimensions":check.size,
        "center_alpha":center_after,
        "alpha_bounds":bbox,"bytes":TARGET.stat().st_size,
        "format":"WEBP",
    }
    print("MYANMAR_GATEWAY_WEBP_CHECK "+json.dumps(metrics),flush=True)
print("MYANMAR_GATEWAY_WEBP_B64="+base64.b64encode(TARGET.read_bytes()).decode(),flush=True)
