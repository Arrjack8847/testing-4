#!/usr/bin/env python3
"""Derive an optional, cropped, soft-edged stone pathway from the user's master.
Original scene.webp is never overwritten. Source remains the sole art reference.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import base64

source=Path("assets/skins/myanmar-luxury/scene.webp")
target=Path("visual-myanmar/path.webp")
target.parent.mkdir(exist_ok=True,parents=True)
image=Image.open(source).convert("RGBA")
width,height=image.size
assert (width,height)==(1080,1920), f"Unexpected master dimensions: {image.size}"
# Same perspective polygon as the earlier browser clipping, in master
# painting coordinates. Feather edges to avoid a visible diagonal seam.
polygon=[(.44,.58),(.56,.58),(.69,.78),(.86,1),(.14,1),(.31,.78)]
mask=Image.new("L",(width,height),0)
ImageDraw.Draw(mask).polygon([(int(x*width),int(y*height)) for x,y in polygon],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(8))
# Permanently crop top 55.5% of painting; the base of the pavilion is
# deliberately placed below the sky, and sky never forms part of this layer.
crop_top=int(height*.555)
cut=image.crop((0,crop_top,width,height))
cut.putalpha(mask.crop((0,crop_top,width,height)))
cut.save(target,format="WEBP",quality=83,method=6)
print(f"PATH_EXPORT {target} dimensions={cut.size} bytes={target.stat().st_size}",flush=True)
print("PATH_WEBP_BASE64="+base64.b64encode(target.read_bytes()).decode("ascii"),flush=True)
