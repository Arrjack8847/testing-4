"""Compare real-photo source/local Gallery screenshots without publishing vendor artwork.

Inputs are generated ephemerally by tools/section7-method-audit.mjs.
Only JSON metrics, not copyrighted screenshots or WebPs, are uploaded.
"""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

root=Path("section7-method-evidence")
report=json.loads((root/"measurements.json").read_text("utf-8"))
result={"note":"Side-by-side browser render; local files downloaded into temporary runner only; no photos/screenshots are published.","viewports":[]}
for viewport in report["viewports"]:
    w,h=viewport["width"],viewport["height"]
    source=next((a for a in report["measurements"] if a["kind"]=="reference" and a["viewport"]["width"]==w),None)
    local=next((a for a in report["measurements"] if a["kind"]=="local" and a["viewport"]["width"]==w),None)
    if source is None or local is None or source.get("status")!="captured" or local.get("status")!="captured":
        result["viewports"].append({"width":w,"error":"incomplete browser capture"})
        continue
    sd,ld=source["data"],local["data"]
    local_images=ld["frames"]
    reference_images=sd["frames"]
    v={"width":w,"height":h,"referenceHeight":source["galleryHeight"],"localHeight":local["galleryHeight"],
       "galleryHeightDifference":round(local["galleryHeight"]-source["galleryHeight"],2),
       "allSourcePhotosLoaded":all(x.get("image") and x["image"]["natural"][0]>0 for x in reference_images),
       "allLocalPhotosLoaded":all(x.get("image") and x["image"]["natural"][0]>0 for x in local_images),
       "sourceBackgroundScene":next((m for m in sd["media"]["images"] if m["src"].endswith("/scene.webp")),None),
       "localBackgroundScene":next((m for m in ld["media"]["images"] if m["src"].endswith("/scene.webp")),None),
       "nextSource":sd["neighbors"]["next"]["heading"] if sd["neighbors"]["next"] else None,
       "nextLocal":ld["neighbors"]["next"]["heading"] if ld["neighbors"]["next"] else None,
       "frames":[],"screenshots":[]}
    for i,(sf,lf) in enumerate(zip(reference_images,local_images)):
        sbox,lbox=sf["frame"],lf["frame"]
        d={k:round(lbox[k]-sbox[k],2) for k in ("x","width","height","docY")}
        v["frames"].append({"label":sf["label"],"sourceNatural":sf["image"]["natural"] if sf.get("image") else None,
                            "localNatural":lf["image"]["natural"] if lf.get("image") else None,
                            "sameIntrinsic":bool(sf.get("image") and lf.get("image") and sf["image"]["natural"]==lf["image"]["natural"]),
                            "frameDelta":d})
    for stage in ("start","middle","end"):
        sr=root/f"reference-{w}-{stage}.png"
        lr=root/f"local-{w}-{stage}.png"
        if not sr.exists() or not lr.exists():
            v["screenshots"].append({"stage":stage,"error":"screenshot missing"})
            continue
        with Image.open(sr) as one,Image.open(lr) as two:
            a,b=one.convert("RGB"),two.convert("RGB")
        if a.size!=b.size: raise AssertionError(f"Screen dimensions differ: {a.size} != {b.size}")
        diff=ImageChops.difference(a,b)
        stat=ImageStat.Stat(diff)
        near=sum(1 for px in diff.getdata() if max(px)<=8)
        total=a.width*a.height
        shot={"stage":stage,"fullViewMeanAbsPixelDifference0to255":round(sum(stat.mean)/3,3),
              "fractionPixelsWithin8Of255":round(near/total,5),"framePhotoInteriors":[]}
        # Compare photo pixel interiors at equivalent *section-relative scrolls*
        # excluding frame borders and captions. If source/loc frame geometry is
        # matched and photos the same, these pixels should also match.
        sy=sd["section"]["box"]["docY"]+{"start":0,"middle":source["galleryHeight"]/2,"end":max(0,source["galleryHeight"]-h*.65)}[stage]
        ly=ld["section"]["box"]["docY"]+{"start":0,"middle":local["galleryHeight"]/2,"end":max(0,local["galleryHeight"]-h*.65)}[stage]
        for sf,lf in zip(reference_images,local_images):
            ss,ll=sf["frame"],lf["frame"]
            inner_width=min(ss["width"],ll["width"])-24
            inner_height=min(ss["height"],ll["height"])-65
            if inner_width<20 or inner_height<20:continue
            xs,ys=int(ss["x"]+12),int(ss["docY"]-sy+12)
            xl,yl=int(ll["x"]+12),int(ll["docY"]-ly+12)
            pw,ph=int(inner_width),int(inner_height)
            if min(ys,yl)<5 or max(ys+ph,yl+ph)>h-5:continue
            crop1=a.crop((xs,ys,xs+pw,ys+ph))
            crop2=b.crop((xl,yl,xl+pw,yl+ph))
            pixels=ImageChops.difference(crop1,crop2)
            photo_err=ImageStat.Stat(pixels)
            close=sum(1 for p in pixels.getdata() if max(p)<=8)
            shot["framePhotoInteriors"].append({"label":sf["label"],
                "meanAbsPixelDifference0to255":round(sum(photo_err.mean)/3,3),
                "fractionPixelsWithin8":round(close/(pw*ph),5),
                "region":[pw,ph]})
        v["screenshots"].append(shot)
    result["viewports"].append(v)
(root/"full-art-pixel-report.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
for x in result["viewports"]:
    if x.get("error"):
        print("SECTION7_REAL_ART_ERROR",x["width"],x["error"])
        continue
    print("SECTION7_REAL_ART_CHECK",json.dumps({"width":x["width"],"heightDifference":x["galleryHeightDifference"],
        "allSourcePhotosLoaded":x["allSourcePhotosLoaded"],"allLocalPhotosLoaded":x["allLocalPhotosLoaded"],
        "frames":[{"label":f["label"],"samePhotoDimensions":f["sameIntrinsic"],
                   "frameDelta":f["frameDelta"]} for f in x["frames"]],
        "shots":x["screenshots"],"nextSource":x["nextSource"],"nextLocal":x["nextLocal"]}))
if not all(x.get("allSourcePhotosLoaded") and x.get("allLocalPhotosLoaded") for x in result["viewports"]):
    raise RuntimeError("Incomplete real-photo comparison. Do not report visual match.")
