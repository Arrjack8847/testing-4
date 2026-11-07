#!/usr/bin/env python3
"""Read-only audit of all 27 Section 1 artwork slots against the original geometry.

Only Pillow is required. Never modifies assets or scene code. With --reference-dir
it compares decoded reference artwork; without it dimensions are reported but
no unverified compatibility is claimed.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SKIN = ROOT / "assets/skins/myanmar-luxury"
MANIFEST = ROOT / "ASSET-MANIFEST.txt"
SOURCE = ROOT / "scene.js"

ROLES = {
    "scene.webp": ("master scene", "9:16 complete cover/fallback; object registration reference"),
    "sky.webp": ("background", "full 9:16 stage; no separate parallax canvas padding"),
    "palace.webp": ("architecture", "bottom-centered square canvas; image scales .66 -> .99 on opening"),
    "reeds.webp": ("foreground ground", "bottom-aligned; translates 40%, fades out by .40H scrolling"),
    "arch.webp": ("foreground gateway", "bottom-aligned 9:16 frame; scales 1 -> 2.6 on opening"),
    "tree_l.webp": ("left tree", "transparent 9:16 canvas; 70lvh height, bottom 4lvh, sway pivot 18% 12%"),
    "tree_r.webp": ("right tree", "transparent 9:16 canvas; 70lvh height, bottom 4lvh, sway pivot 82% 12%"),
    "drape.webp": ("upper canopy", "centered, top -11lvh, 104vw wide, top-pivot floral sway"),
    "peacock.webp": ("mirrored birds", "same file at x20 and x80; opposite mirrored; appears by 1.44H"),
    "bfly_1.webp": ("butterfly wing", "52 x 41 CSS butterfly; mirrored half-wings; violet route"),
    "bfly_white.webp": ("butterfly wing", "44 x 34 CSS butterfly; mirrored half-wings; ivory route"),
}
for kind, files in {
    "hanging flower": ("hang_1.webp","hang_2.webp","hang_3.webp","hang_4.webp"),
    "ground plant": ("spike_3.webp","spike_4.webp","spike_5.webp","stem_1.webp","stem_2.webp"),
    "lower leaf": ("leaf_4.webp","leaf_5.webp","leaf_6.webp"),
    "lower bloom": ("bloom_1.webp","bloom_2.webp","bloom_5.webp","bloom_6.webp"),
}.items():
    for name in files:
        ROLES[name] = (kind, "existing per-instance CSS geometry, bottom pivot except hanging flower (top)")

def definitions(js: str):
    entries=defaultdict(list)
    for line in js.splitlines():
        line=line.strip().rstrip(",")
        if not line.startswith('["') or ".webp" not in line:
            continue
        try:
            name, css, props = json.loads(line)
        except (ValueError, TypeError):
            continue
        if not isinstance(props, dict):
            continue
        entries[name].append({
            "class": css, "x":props.get("--x"), "y":props.get("--y"),
            "h":props.get("--h"), "flipped":"flipped" in css.split(),
            "anchor":"top" if "hanging" in css.split() else "bottom",
            "sway_degrees":props.get("--sa"), "duration":props.get("--sd"),
            "delay":props.get("--sl"), "z":props.get("--z")
        })
    return entries

def measures(path: Path):
    if not path.exists():
        return {"error": "missing"}
    try:
        with Image.open(path) as img:
            image_format = img.format
            mode = img.mode
            w, h = img.size
            has_alpha = "A" in img.getbands()
            rgba = img.convert("RGBA")
            alpha = rgba.getchannel("A")
            bounds = alpha.point(lambda x: 255 if x >= 24 else 0).getbbox()
            bbox = None if not bounds else [round(bounds[0]/w,4),round(bounds[1]/h,4),round(bounds[2]/w,4),round(bounds[3]/h,4)]
            hist = alpha.histogram()
            pixels = w*h
            coverage = sum(hist[24:])/pixels
            def edge(y0,y1):
                band=alpha.crop((0,y0,w,y1))
                return round(sum(band.histogram()[64:])/(w*(y1-y0)),4)
            return {
                "size":[w,h], "format":image_format,"mode":mode,"alpha":has_alpha,
                "bbox":bbox,"coverage":round(coverage,4),
                "edge_top":edge(0,min(5,h)), "edge_bottom":edge(max(0,h-5),h),
                "source_bytes":path.stat().st_size,
                "decoded_rgba_mib":round(pixels*4/1048576,2)
            }
    except Exception as exc:
        return {"error":str(exc)}

def compare(name, new, old):
    if "error" in new: return "MISSING/INVALID", "Image unavailable or undecodable"
    if not old or "error" in old: return "BASELINE MISSING", "Reference pixels were not available; visual fit unverified"
    flags=[]
    if new["size"] != old["size"]:
        flags.append("CANVAS DIMENSIONS DIFFER")
    if old["bbox"] and new["bbox"]:
        drift=max(abs(x-y) for x,y in zip(old["bbox"],new["bbox"]))
        if drift >= .08:
            flags.append("ALPHA BOUNDS DRIFT >= 8%")
        elif drift >= .04:
            flags.append("ALPHA BOUNDS DRIFT >= 4%")
    if old["alpha"] and not new["alpha"]:
        flags.append("TRANSPARENCY LOST")
    if name.startswith(("tree_l","tree_r")) and (new["edge_top"]>.015 or new["edge_bottom"]>.015):
        flags.append("TREE ALPHA TOUCHES CANVAS EDGE")
    if name.startswith("bfly_"):
        flags.append("WING STRUCTURE REQUIRES VISUAL CHECK")
    return ("REVIEW" if flags else "GEOMETRY OK"), ("; ".join(flags) if flags else "Canvas + alpha envelope comparable; content still needs inspection")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--reference-dir",type=Path)
    parser.add_argument("--output",type=Path,default=ROOT/"reports/myanmar-section1-asset-audit.md")
    parser.add_argument("--json-output",type=Path,default=ROOT/"reports/myanmar-section1-asset-audit.json")
    args=parser.parse_args()
    names=re.findall(r"^([a-z0-9_]+\.webp)$",MANIFEST.read_text(),re.M)
    names += ["bfly_1.webp","bfly_white.webp"]
    assert len(names)==27 and len(set(names))==27
    instances=definitions(SOURCE.read_text())
    expected=set(names)-{"scene.webp","bfly_1.webp","bfly_white.webp"}
    assert expected==set(instances),f"Runtime slots diverged from manifest: {expected^set(instances)}"
    assert all(name in ROLES for name in names)
    data=[]
    for name in names:
        uploaded=measures(SKIN/name)
        baseline=measures(args.reference_dir/name) if args.reference_dir else None
        status,reason=compare(name,uploaded,baseline)
        data.append({
            "name":name,"role":ROLES[name][0],"contract":ROLES[name][1],
            "instances":instances.get(name,[]),"new":uploaded,"baseline":baseline,
            "status":status,"reason":reason
        })
    lines=[
        "# Myanmar Luxury Section 1 — 27-asset geometry audit",
        "",
        "> Read-only diagnostic. Option A freezes existing positions, CSS, JS, scrolling and animation timing.",
        "> A green geometry comparison does NOT verify visual semantics or commercial image rights.",
        "",
        "## Source and evaluation method",
        "",
        "- New art: `assets/skins/myanmar-luxury/` from the strict 1:1 replacement branch.",
        "- Animation slots: `scene.js` definitions and inherited `styles.css`.",
        "- Reference: original 25 source-slot WebPs downloaded **only inside CI for metrics**, never committed or included in outputs; butterflies have no such matching source in that pack.",
        "- For each image: real decoded dimensions, alpha presence, visible alpha bounding box (threshold 24/255), edge coverage and theoretical RGBA decode footprint.",
        "- Strict compatibility is NOT implied by matching filenames. Normalized alpha-bounds movement >=4% prompts review; >=8% is high priority. Art differences can still be significant at 0%.",
        "",
        "## Artwork-by-artwork results",
        "",
        "| Old slot = New Myanmar asset | Role | Old canvas | New canvas | Old visible alpha bounds | New visible alpha bounds | Max alpha drift | Instances / mirrored | Verdict |",
        "|---|---|---|---|---|---|---|---|---|---|"
    ]
    for row in data:
        new=row["new"]; old=row["baseline"]; used=row["instances"]
        dims=lambda obj:"—" if not obj or "size" not in obj else f"{obj['size'][0]}×{obj['size'][1]}"
        def bounds(obj):
            if not obj or not obj.get("bbox"): return "—"
            return ", ".join(f"{n:.2f}" for n in obj["bbox"])
        drift=max(abs(x-y) for x,y in zip(old["bbox"],new["bbox"])) if old and old.get("bbox") and new.get("bbox") else None
        drift_label=f"{100*drift:.1f}%" if drift is not None else "—"
        repeats=f"{len(used)} / {'yes' if any(x['flipped'] for x in used) else 'no'}"
        lines.append(f"| `{row['name']}` | {row['role']} | {dims(old)} | {dims(new)} | {bounds(old)} | {bounds(new)} | {drift_label} | {repeats} | **{row['status']}** |")
    lines.extend(["","## Precise runtime geometry for each repeated image","",
                  "The coordinates are from `scene.js`: x in viewport %, y in *--unit* from the top for hanging sprites and bottom for foreground sprites; h is sprite height in *--unit* (unit = min(1lvh, 2.164vw)). These are original source positions, **not recommendations for new CSS**.",
                  "",
                  "| File | Instance | x | y | h | Pivot | Mirror | Sway (degree / duration) |",
                  "|---|---:|---:|---:|---:|---|---|---|"])
    for row in data:
        for i,instance in enumerate(row["instances"],1):
            lines.append(f"| `{row['name']}` | {i} | {instance['x'] or 'CSS'} | {instance['y'] or 'CSS'} | {instance['h'] or 'CSS'} | {instance['anchor']} | {'yes' if instance['flipped'] else 'no'} | {instance['sway_degrees'] or '—'} / {instance['duration'] or '—'} |")
    lines.extend(["", "## Original choreography contract — not to be changed under Option A","",
                  "- Pavilion: bottom-centered image, cover scale ~0.66, opens to ~0.99, retreat begins 0.22H and ends 0.72H.",
                  "- Gateway: normal frame on cover, expands to 2.6× and fades at open, reappears between 0.84H and 1.42H.",
                  "- Trees: 70lvh tall, anchored 4lvh above bottom, existing CSS sway/pivots; open scale ~2.1 and fade, return by 1.42H.",
                  "- Hanging canopy and garlands: top pivot, existing wind; canopy opens at scale 2.2 and returns to 1 by 1.42H.",
                  "- Low plants, leaves, peacocks: bottom-anchored image slots; foreground flowers return ~0.47H–0.78H; peacocks appear 1.06H–1.44H.",
                  "- Butterflies: `bfly_1.webp` 52×41 CSS body envelope and `bfly_white.webp` 44×34; CSS mirrors two half-wings. Wing art needs manual shape inspection.",
                  "- Names: greeting fades 1.37H–1.67H; scripted names and details continue until ~2.42H; Section 2 covers hero by 3H.",
                  "- Original reference lake waterfalls, mist/glow, pink petals and other source-era effects remain under strict Option A; list as creative limitations, do not silently edit.",
                  "",
                  "## Asset-level deviations and manual gates",""])
    for row in data:
        if row["status"]!="GEOMETRY OK":
            lines.append(f"- **{row['name']}** — {row['reason']}.")
    lines += ["", "## Acceptance before production","","- [ ] Every non-background object matches the old slot's normalized object envelope or the owner explicitly accepts the drift.",
              "- [ ] Original and new cover screenshots compared at exactly the same 320×568 / 360×740 / 390×844 / 430×932 layouts.",
              "- [ ] Tap-to-open, 0.45H, 1.5H, 2.15H and reverse scroll visually checked (browser tests cannot alone prove alignment).",
              "- [ ] Pair of mirrored peacocks, both butterfly half-wing sources, and alpha/cutoff seams visually approved.",
              "- [ ] Decoded image residency and repeated iPhone Safari/Telegram scrolling checked on a physical phone.",
              "- [ ] Original artist rights and any default-page remote provider dependencies reviewed before commercial release.",
              ""]
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.json_output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text("\n".join(lines),encoding="utf8")
    args.json_output.write_text(json.dumps({"version":1,"count":len(data),"reference_available":sum(1 for r in data if r["baseline"] and "size" in r["baseline"]),"assets":data},indent=2),encoding="utf8")
    print("MYANMAR_AUDIT_SUMMARY="+json.dumps({
        "count":len(data),"statuses":{s:sum(1 for r in data if r["status"]==s) for s in sorted(set(r["status"] for r in data))},
        "decoded_total_mib":round(sum(r["new"].get("decoded_rgba_mib",0) for r in data),2),
        "compressed_total_mib":round(sum(r["new"].get("source_bytes",0) for r in data)/1048576,2)
    }))
    print("MYANMAR_AUDIT_MARKDOWN_START")
    print("\n".join(lines))
    print("MYANMAR_AUDIT_MARKDOWN_END")
    if any(r["status"]=="MISSING/INVALID" for r in data):
        raise SystemExit(1)

if __name__=="__main__":
    main()
