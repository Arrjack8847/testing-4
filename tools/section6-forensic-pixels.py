#!/usr/bin/env python3
"""Measure visual differences on isolated Dress Code section screenshots.

Reference pixels are kept in-memory and private on CI; output JSON reports
numbers and sampled colors only, not source images.
"""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]/"artifacts"/"section6-forensic"
WIDTHS=(320,360,390,430)
def stats(a,b,mask):
    d=np.abs(a.astype(np.int16)-b.astype(np.int16))
    vals=d[mask]
    if len(vals)==0: return {}
    max_channel=vals.max(axis=1)
    return {"mae":round(float(vals.mean()),3),
       "exactPixelPct":round(100*float(np.mean(max_channel==0)),3),
       "near6PixelPct":round(100*float(np.mean(max_channel<=6)),3),
       "differentOver25Pct":round(100*float(np.mean(max_channel>25)),3)}
def main():
    results={}
    dom_file=ROOT/"dom-geometry.json"
    dom=json.loads(dom_file.read_text())["results"]
    for w in WIDTHS:
        refs={x["version"]:x for x in dom if x["width"]==w}
        a=np.asarray(Image.open(ROOT/f"reference-section-{w}.png").convert("RGB"))
        b=np.asarray(Image.open(ROOT/f"local-section-{w}.png").convert("RGB"))
        if a.shape!=b.shape:
            results[str(w)]={"error":f"dimensions don't match: {a.shape} vs {b.shape}"}
            continue
        h,width,_=a.shape
        yy,xx=np.indices((h,width))
        masks={
            "full":np.ones((h,width),bool),
            "paperLeftEdge":xx<24,
            "paperRightEdge":xx>=width-24,
            "paperTopEdge":yy<70,
            "paperBottomEdge":yy>=h-70,
            "paperEdgesOnly":(xx<24)|(xx>=width-24),
            "topMiddle":(yy>=30)&(yy<95)&(xx>=40)&(xx<width-40),
            "middleLeft":(yy>=110)&(yy<h-110)&(xx<25),
            "middleRight":(yy>=110)&(yy<h-110)&(xx>=width-25)
        }
        r={name:stats(a,b,mask) for name,mask in masks.items()}
        edge=masks["paperEdgesOnly"]
        # Search for small relative drifts without pretending such a drift proves equality.
        best=None
        for dx in range(-12,13,2):
            for dy in range(-24,25,2):
                x0=max(0,dx);x1=min(width,width+dx)
                y0=max(0,dy);y1=min(h,h+dy)
                mask=edge[y0:y1,x0:x1]
                aa=a[y0:y1,x0:x1]
                bb=b[y0-dy:y1-dy,x0-dx:x1-dx]
                if mask.size==0 or not mask.any():continue
                mae=float(np.abs(aa.astype(np.int16)-bb.astype(np.int16))[mask].mean())
                if best is None or mae<best["mae"]:
                    best={"localShiftX":dx,"localShiftY":dy,"mae":round(mae,3)}
        pts=[(8,8),(w//2,20),(8,h//2),(w-8,h//2),
             (w//2,h-18),(w//2,85),(w//2,h-85)]
        samples=[{"x":x,"y":y,"source":a[y,x].tolist(),"local":b[y,x].tolist()}
                 for x,y in pts if 0<=y<h]
        results[str(w)]={
            "dimensions":[w,h],
            "regions":r,
            "bestPaperEdgeShift":best,
            "colorSamples":samples,
            "sourcePaperGeometry":refs.get("reference",{}).get("info",{}).get("paperHierarchy"),
            "localPaperGeometry":refs.get("local",{}).get("info",{}).get("paperHierarchy"),
            "sourceSection":refs.get("reference",{}).get("info",{}).get("section"),
            "localSection":refs.get("local",{}).get("info",{}).get("section")
        }
        print("FORENSIC_DIFF",w,"sectionHeight",h,
              "MAE",r["full"]["mae"],
              "paperEdgesMAE",r["paperEdgesOnly"]["mae"],
              "bestShift",json.dumps(best))
        print("FORENSIC_REGIONS",w,json.dumps({
             k:{"mae":v.get("mae"),"near6":v.get("near6PixelPct")}
             for k,v in r.items()
        }))
        print("FORENSIC_SAMPLES",w,json.dumps(samples))
    ROOT.joinpath("numeric-differences.json").write_text(json.dumps(results,indent=2)+"\n")
    if any("error" in r for r in results.values()):
        raise SystemExit("Incomplete source/local geometry")
if __name__=="__main__": main()
