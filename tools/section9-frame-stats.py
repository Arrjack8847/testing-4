"""Quantify approximate frame differences; a zero score alone would establish pixel equality."""
from PIL import Image,ImageChops,ImageStat
from pathlib import Path
import json
p=Path("section9-frame-audit")
frames=json.loads((p/"frames.json").read_text())
results=[]
for record in frames["frames"]:
    a,b=[Image.open(p/name).convert("RGB") for name in record["files"]]
    if a.size!=b.size:
        raise RuntimeError("Viewport size differs")
    diff=ImageChops.difference(a,b)
    target=p/("difference-"+record["files"][0].removeprefix("reference-"))
    diff.save(target)
    means=ImageStat.Stat(diff).mean
    mae=round(sum(means)/3,3)
    results.append({"checkpoint":record["checkpoint"],"elapsedMs":record["elapsedMs"],
                    "rgbMeanAbsoluteError":mae,"pixelPerfect":mae==0})
summary={"totalFrames":len(results),"allPixelIdentical":bool(results) and all(r["pixelPerfect"] for r in results),
         "frames":results,"meanMAE":round(sum(x["rgbMeanAbsoluteError"] for x in results)/max(1,len(results)),3)}
(p/"results.json").write_text(json.dumps(summary,indent=2))
print("S9_FRAME_PARITY "+json.dumps({"count":summary["totalFrames"],"meanMAE":summary["meanMAE"],
    "allPixelIdentical":summary["allPixelIdentical"],
    "byCheckpoint":{name:round(sum(r["rgbMeanAbsoluteError"] for r in results if r["checkpoint"]==name)/max(1,sum(r["checkpoint"]==name for r in results)),3)
                    for name in ("entry","middle","exit")}}))
