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



def global_tracks(frames, checkpoint, side):
    """Group visible global butterflies by DOM index, not CSS class name.

    A butterfly in the shared floating layer may overlap Section 9 without
    being a DOM descendant of the RSVP element. Ignore offscreen sprites and
    require at least three observations of the same instance.
    """
    by_index = {}
    for record in frames:
        if record.get("checkpoint") != checkpoint:
            continue
        pose = record.get(side) or {}
        for sprite in pose.get("nearbyGlobalButterflies") or []:
            if sprite.get("visible") is not True or sprite.get("nearSection") is not True:
                continue
            box = sprite.get("rect") or {}
            if not all(isinstance(box.get(k), (int, float)) for k in
                       ("x", "y", "width", "height")):
                continue
            index = sprite.get("index")
            if not isinstance(index, int):
                continue
            by_index.setdefault(index, []).append({
                "t": float(record["elapsedMs"]) / 1000.0,
                "x": box["x"] + box["width"] / 2.0,
                "y": box["y"] + box["height"] / 2.0,
                "withinSection": sprite.get("withinSection") is True,
            })
    tracks = []
    for index, rows in sorted(by_index.items()):
        if len(rows) < 3:
            continue
        rows.sort(key=lambda row: row["t"])
        dt = rows[-1]["t"] - rows[0]["t"]
        if dt <= 0:
            continue
        velocities = [(right["x"]-left["x"])/(right["t"]-left["t"])
                      for left, right in zip(rows, rows[1:])
                      if right["t"] > left["t"]]
        if not velocities:
            continue
        speed = median(velocities)
        tracks.append({
            "index": index,
            "samples": len(rows),
            "direction": "rightward" if speed > 2 else (
                "leftward" if speed < -2 else "stationary-or-unclear"),
            "medianHorizontalPxPerSec": round(speed, 2),
            "startCenterX": round(rows[0]["x"], 1),
            "endCenterX": round(rows[-1]["x"], 1),
            "startCenterY": round(rows[0]["y"], 1),
            "endCenterY": round(rows[-1]["y"], 1),
            "durationSeconds": round(dt, 2),
            "withinSectionAtSomePoint": any(
                row["withinSection"] for row in rows),
        })
    return tracks


def report(frames):
    sections = {}
    for checkpoint in ("entry", "middle", "exit"):
        source = track(frames, checkpoint, "original")
        local = track(frames, checkpoint, "local")
        comparable = source["status"] == local["status"] == "measured"
        reference_global = global_tracks(frames, checkpoint, "original")
        local_global = global_tracks(frames, checkpoint, "local")
        sections[checkpoint] = {
            "reference": source, "local": local,
            "directionAgreement": (
                source["direction"] == local["direction"] if comparable else None
            ),
            "referenceGlobalTracks": reference_global,
            "localGlobalTracks": local_global,
            "referenceGlobalDirections": sorted(set(
                item["direction"] for item in reference_global)),
            "localGlobalDirections": sorted(set(
                item["direction"] for item in local_global)),
            "globalDirectionAgreement": (
                sorted(set(item["direction"] for item in reference_global))
                == sorted(set(item["direction"] for item in local_global))
                if reference_global and local_global else None
            ),
            "requiresVisualReview": True,
        }
    return {"frameCount": len(frames), "sections": sections,
            "exactParityEstablished": False,
            "note": "Section-descendant and global floating-layer sprites reported "
                    "separately. Global index is stable only within one page load. "
                    "CSS pseudo-elements/canvas and overlapping sprites require review."}


if __name__ == "__main__":
    source = json.loads((ROOT / "frames.json").read_text(encoding="utf-8"))
    output = report(source["frames"])
    (ROOT / "motion.json").write_text(
        json.dumps(output, indent=2), encoding="utf-8"
    )
    print("S9_MOTION_COMPARE " + json.dumps(output, separators=(",", ":")))
