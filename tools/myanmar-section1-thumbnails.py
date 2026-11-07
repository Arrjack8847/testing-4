#!/usr/bin/env python3
"""Print deliberately low-resolution QA thumbnails to CI logs for review."""
import base64
import io
from pathlib import Path
from PIL import Image

root=Path("visual-myanmar")
for size,checkpoint in (("iphone-390","cover"),("iphone-390","opened"),("iphone-390","scroll-045"),("iphone-390","scroll-150"),("iphone-390","scroll-215"),("small-phone","cover"),("small-phone","scroll-150")):
    name=f"{size}-{checkpoint}"
    image=Image.open(root/f"{name}.png").convert("RGB")
    image.thumbnail((270,600),Image.Resampling.LANCZOS)
    buf=io.BytesIO()
    image.save(buf,format="JPEG",quality=62,optimize=True)
    encoded=base64.b64encode(buf.getvalue()).decode("ascii")
    print(f"MYANMAR_VISUAL_{name}={encoded}",flush=True)
