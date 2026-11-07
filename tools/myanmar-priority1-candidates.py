#!/usr/bin/env python3
"""Option A exploratory IMAGE-ONLY transformations, with no geometry/CSS/JS edits.

The painted Myanmar art is the source. No reference-provider pixels are used.
Outputs are test candidates, not final approved artwork. The gateway uses
piecewise vertical interpolation to extend its *existing* columns; trees
get clean feathered lower cutouts but cannot magically regain missing trunks.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import base64
import io
import sys

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"assets/skins/myanmar-luxury"
def saved(name, im):
    path=DIR/name
    im.save(path,"WEBP",quality=90,method=6)
    buf=path.read_bytes()
    print("MYANMAR_CANDIDATE "+name+" "+str(len(buf))+" bytes",flush=True)
    print("MYANMAR_CANDIDATE_B64_"+name+"="+base64.b64encode(buf).decode(),flush=True)

def arch_reposition():
    image=Image.open(DIR/"arch.webp").convert("RGBA")
    assert image.size==(1080,1920), image.size
    # Piecewise height mapping: preserve upper carved gable, lengthen column
    # shafts, and preserve the original ornamental plinth at the bottom.
    # Unlike globally stretching the image, this keeps capital and plinth
    # proportions close to their original shape while preserving the 9:16 slot.
    # Structural bands overlap by 8px; blend their joins on output.
    bands=[(240,585,0,480),(585,995,480,1720),(995,1145,1720,1920)]
    dest=Image.new("RGBA",(1080,1920),(0,0,0,0))
    for source_top,source_bottom,target_top,target_bottom in bands:
        tile=image.crop((0,source_top,1080,source_bottom))
        tile=tile.resize((1080,target_bottom-target_top),Image.Resampling.LANCZOS)
        dest.alpha_composite(tile,(0,target_top))
    # Keep source horizontal proportion. No arch/image CSS transform changes.
    # Remove isolated source speckles below the foot arches inside empty center
    # by rejecting near-transparent pixels; retain soft alpha on the carvings.
    r,g,b,a=dest.split()
    a=a.point(lambda x: 0 if x<14 else x)
    dest=Image.merge("RGBA",(r,g,b,a))
    return dest

def feather_upper_tree(name):
    img=Image.open(DIR/name).convert("RGBA")
    assert img.size==(1080,1920),img.size
    # The original uploaded canvas has two abrupt boundaries: the topmost
    # leaves start at y~120 along a perfectly straight horizontal row, while
    # branch ends / detached pixels form an abrupt lower cutoff at y~760.
    # Feather BOTH seams in the exported alpha (no browser mask/filter).
    # Missing full-length trunks are NOT generated or faked here.
    from PIL import ImageChops, ImageDraw
    a=img.getchannel("A")
    atten=Image.new("L",img.size,255)
    pen=ImageDraw.Draw(atten)
    pen.rectangle((0,0,1079,117),fill=0)
    for y in range(118,228):
        t=max(0,min(1,(y-118)/110))
        factor=t*t*(3-2*t)
        pen.line((0,y,1079,y),fill=round(255*factor))
    for y in range(670,790):
        t=max(0,min(1,(y-670)/120))
        factor=(1-t*t*(3-2*t))
        pen.line((0,y,1079,y),fill=round(255*factor))
    pen.rectangle((0,790,1079,1919),fill=0)
    alpha=ImageChops.multiply(a,atten)
    img.putalpha(alpha)
    return img

if __name__=="__main__":
    saved("arch.webp",arch_reposition())
    saved("tree_l.webp",feather_upper_tree("tree_l.webp"))
    saved("tree_r.webp",feather_upper_tree("tree_r.webp"))
