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
        # A 3.6-second gap can span the hidden portion of a repeating
        # animation and turn a westbound sprite into a false eastbound track.
        # Treat only continuously sampled frames (<=1.75s apart) as a flight.
        segments, segment = [], [rows[0]]
        for next_row in rows[1:]:
            prev = segment[-1]
            gap = next_row["t"] - prev["t"]
            speed = abs(next_row["x"] - prev["x"]) / gap if gap > 0 else float("inf")
            if gap <= 0 or gap > 1.75 or speed > 180:
                segments.append(segment)
                segment = [next_row]
            else:
                segment.append(next_row)
        segments.append(segment)
        rows = max(segments, key=len)
        if len(rows) < 3:
            continue
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
    reference_dirs = sorted({direction for section in sections.values()
                             for direction in section["referenceGlobalDirections"]})
    local_dirs = sorted({direction for section in sections.values()
                         for direction in section["localGlobalDirections"]})
    return {"frameCount": len(frames), "sections": sections,
            "referenceObservedDirections": reference_dirs,
            "localObservedDirections": local_dirs,
            "referenceUnobservedDirections": sorted(
                {"leftward", "rightward"} - set(reference_dirs)),
            "referenceCoverage": "partial" if set(reference_dirs) !=
                {"leftward", "rightward"} else "both-directions-sampled",
            "exactParityEstablished": False,
            "note": "Global and section-descendant butterflies are measured "
                    "per captured checkpoint, with continuous timing and DOM "
                    "identity. Missing direction means NOT OBSERVED within the "
                    "21 captured frames, not that the reference lacks that "
                    "animation. Do not claim full visual/trajectory parity."}


if __name__ == "__main__":
    source = json.loads((ROOT / "frames.json").read_text(encoding="utf-8"))
    output = report(source["frames"])
    frames = source["frames"]
    # Verify the actual captured 21-frame experiment rather than imposing
    # motion that the source did not display at a particular checkpoint.
    if len(frames) != 21 or any(
        sum(item.get("checkpoint") == checkpoint for item in frames) != 7
        for checkpoint in ("entry", "middle", "exit")
    ):
        raise SystemExit("S9_MOTION_AUDIT_INCOMPLETE: Expected seven paired "
                         "frames each at entry, middle and exit.")
    for checkpoint in ("entry", "middle", "exit"):
        stamps = [item.get("elapsedMs") for item in frames
                  if item.get("checkpoint") == checkpoint]
        if not all(isinstance(t, (int, float)) for t in stamps) or (
            sorted(stamps) != stamps or len(set(stamps)) != len(stamps)
        ):
            raise SystemExit("S9_MOTION_AUDIT_INCOMPLETE: Invalid time series "
                             "at " + checkpoint)
    for frame in frames:
        for filename in frame.get("files") or []:
            if not (ROOT / filename).is_file():
                raise SystemExit("S9_MOTION_AUDIT_INCOMPLETE: Missing screenshot "
                                 + filename)
        if len(frame.get("files") or []) != 2 or not frame.get("original") or (
            not frame.get("local")
        ):
            raise SystemExit("S9_MOTION_AUDIT_INCOMPLETE: Invalid paired frame.")
    if not any(section["referenceGlobalTracks"]
               for section in output["sections"].values()):
        raise SystemExit("S9_MOTION_AUDIT_INCOMPLETE: No consistent reference "
                         "butterfly trajectory captured anywhere.")
    if not any(section["localGlobalTracks"]
               for section in output["sections"].values()):
        raise SystemExit("S9_MOTION_AUDIT_INCOMPLETE: No consistent local "
                         "butterfly trajectory captured anywhere.")
    print("S9_MOTION_COVERAGE " + json.dumps({
        "referenceDirections": output["referenceObservedDirections"],
        "localDirections": output["localObservedDirections"],
        "sourceRightwardVerified": "rightward" in output["referenceObservedDirections"],
        "exactParityEstablished": False
    }, separators=(",", ":")))
    (ROOT / "motion.json").write_text(
        json.dumps(output, indent=2), encoding="utf-8"
    )
    print("S9_MOTION_COMPARE " + json.dumps(output, separators=(",", ":")))
