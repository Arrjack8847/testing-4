#!/usr/bin/env python3
"""Option A: make only two small artwork refinements to user-uploaded gateway.

Immutable source: the owner's own gateway PNG committed to GitHub.
1) ~2.5% (48 px) alpha breathing space above crown, shrinking just the upper
   spire zone; the carved arch opening / all pillars below y=275 remain at
   exactly the original canvas coordinates.
2) Tone down the brightest gold highlights by up to 8%; preserve carved
   detail, ivory surfaces and the original alpha mask elsewhere.

No CSS, HTML, JS, camera, scroll, mirroring or animations are touched.
Creates a candidate arch.webp; the original user PNG remains untouched.
"""
from pathlib import Path
import base64
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"assets/skins/myanmar-luxury/bea1db68-4afc-4d72-ae54-d137c40f7299.png"
DEST=ROOT/"assets/skins/myanmar-luxury/arch.webp"
with Image.open(SRC) as input_image:
    assert "A" in input_image.getbands(), "Source PNG must contain alpha"
    im=input_image.convert("RGBA").resize((1080,1920),Image.Resampling.LANCZOS)

assert im.size==(1080,1920)
# Gently shorten only the upper finial. The ornate arch and all two pillars
# below y=275 keep their exact original pixel geometry.
margin=48   # 2.5% of image height
anchor=275
original_top=im.crop((0,0,1080,anchor))
shortened=original_top.resize((1080,anchor-margin),Image.Resampling.LANCZOS)
canvas=Image.new("RGBA",(1080,1920),(0,0,0,0))
canvas.paste(shortened,(0,margin))
canvas.paste(im.crop((0,anchor,1080,1920)),(0,anchor))

# Preserve transparency; adjust warm, high-luminance gold only. The
# brightest gold pixels get ~8% less RGB intensity, less for soft mids.
pixels=np.asarray(canvas,dtype=np.uint8).copy()
rgb=pixels[:,:,:3].astype(np.float32)
alpha=pixels[:,:,3].astype(np.float32)
r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
lum=.2126*r+.7152*g+.0722*b
warm_gold=(r>g*1.07)&(g>b*1.18)&(r>145)&(alpha>16)
highlight=np.clip((lum-154)/76,0,1)
y=np.arange(1920,dtype=np.float32)[:,None]
crowning=np.where(y<670,1.0,.35)
strength=.08*highlight*crowning*warm_gold
rgb*=1.0-strength[:,:,None]
pixels[:,:,:3]=np.clip(rgb,0,255).astype(np.uint8)
final=Image.fromarray(pixels,mode="RGBA")
# WebP lossy preserves alpha; no implicit black/white matte.
final.save(DEST,format="WEBP",quality=88,method=6,exact=True)
with Image.open(DEST) as out_image:
    out=out_image.convert("RGBA")
    a=out.getchannel("A")
    bbox=a.point(lambda x:255 if x>=24 else 0).getbbox()
    centers=[a.getpixel((540,y)) for y in (600,900,1400)]
    assert out.size==(1080,1920)
    assert bbox is not None and bbox[1]>=40 and bbox[1]<=53,bbox
    assert max(centers)<=20,centers
    assert bbox[3]==1920,bbox
    summary={
        "canvas":out.size,"bytes":DEST.stat().st_size,"alpha_bounds":bbox,
        "center_alpha":centers,"crown_top_margin_pct":round(bbox[1]/1920*100,2),
        "old_pillar_geometry_below_px":anchor,
        "gold_highlight_max_dimming_pct":8
    }
print("MYANMAR_GATEWAY_POLISH="+json.dumps(summary),flush=True)
print("MYANMAR_GATEWAY_POLISH_B64="+base64.b64encode(DEST.read_bytes()).decode(),flush=True)
