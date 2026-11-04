"""Measure Section 9 butterfly trajectories from paired, read-only frame samples.

Never use a global selector's first match when many butterflies exist. If
neither page exposes a visible Section 9 sprite, the direction is unverified.
"""
from collections import Counter
from pathlib import Path
from statistics import median
import json

ROOT = Path("section9-frame-audit")


def track(frames, checkpoint, side):
    rows = []
    for record in frames:
        if record.get("checkpoint") != checkpoint:
            continue
        pose = record.get(side) or {}
        sprite = pose.get("butterfly") or {}
        if pose.get("sectionButterflyVisible") is not True:
            continue
        if pose.get("sectionButterflyIndex") is None:
            continue
        if not all(isinstance(sprite.get(k), (int, float)) for k in
                   ("x", "y", "width", "height")):
            continue
        rows.append({
            "t": float(record["elapsedMs"]) / 1000.0,
            "x": sprite["x"] + sprite["width"] / 2.0,
            "y": sprite["y"] + sprite["height"] / 2.0,
            "index": pose["sectionButterflyIndex"],
        })
    if not rows:
        return {"status": "no-visible-in-section-samples", "samples": 0}

    # When the visible sprite changes, do not join its path to a different
    # element; choose the longest continuously sampled section sprite.
    counts = Counter(row["index"] for row in rows)
    selected_index, _ = counts.most_common(1)[0]
    selected = [row for row in rows if row["index"] == selected_index]
    if len(selected) < 3:
        return {"status": "insufficient-consistent-samples",
                "samples": len(selected), "selectedIndex": selected_index,
                "allVisibleSamples": len(rows)}
    selected.sort(key=lambda row: row["t"])
    dx = selected[-1]["x"] - selected[0]["x"]
    dy = selected[-1]["y"] - selected[0]["y"]
    duration = selected[-1]["t"] - selected[0]["t"]
    if duration <= 0:
        return {"status": "invalid-timestamps", "samples": len(selected)}
    intervals = []
    for left, right in zip(selected, selected[1:]):
        dt = right["t"] - left["t"]
        if dt > 0:
            intervals.append((right["x"] - left["x"]) / dt)
    velocity = median(intervals) if intervals else 0.0
    direction = "rightward" if velocity > 2 else (
        "leftward" if velocity < -2 else "stationary-or-unclear")
    return {
        "status": "measured", "selectedIndex": selected_index,
        "samples": len(selected), "allVisibleSamples": len(rows),
        "direction": direction, "medianHorizontalPxPerSec": round(velocity, 2),
        "startCenterX": round(selected[0]["x"], 1),
        "endCenterX": round(selected[-1]["x"], 1),
        "netHorizontalDx": round(dx, 1),
        "netVerticalDy": round(dy, 1),
        "sampledSeconds": round(duration, 2),
    }


def report(frames):
    sections = {}
    for checkpoint in ("entry", "middle", "exit"):
        source = track(frames, checkpoint, "original")
        local = track(frames, checkpoint, "local")
        comparable = source["status"] == local["status"] == "measured"
        sections[checkpoint] = {
            "reference": source, "local": local,
            "directionAgreement": (
                source["direction"] == local["direction"] if comparable else None
            ),
            "requiresVisualReview": True,
        }
    return {"frameCount": len(frames), "sections": sections,
            "exactParityEstablished": False,
            "note": "Visible selected DOM sprites only. Hidden CSS pseudo-elements, "
                    "canvas art and multiple overlapping sprites require visual review."}


if __name__ == "__main__":
    source = json.loads((ROOT / "frames.json").read_text(encoding="utf-8"))
    output = report(source["frames"])
    (ROOT / "motion.json").write_text(
        json.dumps(output, indent=2), encoding="utf-8"
    )
    print("S9_MOTION_COMPARE " + json.dumps(output, separators=(",", ":")))
