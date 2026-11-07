#!/usr/bin/env python3
"""Feather isolated Myanmar royal garden tree WebPs without runtime GPU masks.

Inputs are the unchanged raw uploads on main; generated assets preserve the
1080x1920 sprite alignment. Script is idempotent because it reads originals.
"""
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
source=root/"New folder (3)"
destination=root/"assets/skins/myanmar-luxury"
destination.mkdir(parents=True,exist_ok=True)

def ramp(x):
    x=max(0.0,min(1.0,x))
    return x*x*(3-2*x)

for name in ("tree_l.webp","tree_r.webp"):
    image=Image.open(source/name).convert("RGBA")
    if image.size != (1080,1920):
        raise ValueError(f"{name} has changed geometry: {image.size}")
    # Raw artwork has hard horizontal cutouts close to top and bottom of the
    # isolated crown, plus a few detached white pixels outside the branch.
    # Preserve original subject in center and fade only the source edge zones.
    alpha=image.getchannel("A")
    mask=Image.new("L",image.size,0)
    for y in range(image.height):
        top=ramp((y-78)/112)
        bottom=1-ramp((y-565)/112)
        factor=min(top,bottom)
        if not factor: continue
        row=int(255*factor)
        # Alpha multiplier, applied after crop bounds below.
        from PIL import ImageDraw
        ImageDraw.Draw(mask).line((0,y,image.width,y),fill=row)
    from PIL import ImageChops
    alpha=ImageChops.multiply(alpha,mask)
    # Remove detached anti-aliased source slivers far away from the
    # tree's visible branch structure. Keep branch pixels near the edges.
    from PIL import ImageDraw
    da=ImageDraw.Draw(alpha)
    if name=="tree_l.webp":
        da.rectangle((875,0,1079,1920),fill=0)
    else:
        da.rectangle((0,0,105,1920),fill=0)
    image.putalpha(alpha)
    out=destination/name
    image.save(out,format="WEBP",quality=89,method=6)
    print(f"MYANMAR_TREE_RESULT {name} size={out.stat().st_size} dimensions={image.size}",flush=True)
