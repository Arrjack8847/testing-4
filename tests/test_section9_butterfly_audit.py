"""Section 9 motion audit regression tests using measured coordinates only.

No third-party art or user data enters the repository.
"""
import importlib.util
import unittest
from pathlib import Path

TOOL = Path(__file__).resolve().parents[1] / "tools/section9-butterfly-trajectory.py"
spec = importlib.util.spec_from_file_location("section9_motion", TOOL)
motion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(motion)


def frame(stage, ms, side=None, index=7, x=None):
    source = {"nearbyGlobalButterflies": []}
    local = {"nearbyGlobalButterflies": []}
    if side is not None:
        record = {"index": index, "visible": True, "nearSection": True,
                  "withinSection": True,
                  "rect": {"x": x, "y": 170, "width": 40, "height": 40}}
        (source if side == "original" else local)["nearbyGlobalButterflies"].append(record)
    return {"checkpoint": stage, "elapsedMs": ms,
            "original": source, "local": local}


class MotionAuditTests(unittest.TestCase):
    def test_21_frame_capture_with_visible_entry_only(self):
        # Coordinates from the 2026-11-04 archived 21-frame audit, rounded.
        frames = []
        entry = [(118, None), (701, None), (1332, None), (1926, None),
                 (2520, 383), (3725, 341.6), (4922, 307.5)]
        for ms, x in entry:
            frames.append(frame("entry", ms, "original", x=x) if x is not None
                          else frame("entry", ms))
        middle = [(92, 200.8), (710, 180.6), (1294, 160.3),
                  (1893, 140.1), (2499, 119.8), (3691, 78.5),
                  (4897, 37.8)]
        for ms, x in middle:
            frames.append(frame("middle", ms, "local", index=0, x=x))
        frames.extend(frame("exit", ms) for ms in
                      (126, 720, 1322, 1929, 2522, 3722, 4921))
        result = motion.report(frames)
        self.assertEqual(result["frameCount"], 21)
        self.assertEqual(result["referenceObservedDirections"], ["leftward"])
        self.assertIn("rightward", result["referenceUnobservedDirections"])
        self.assertEqual(result["referenceCoverage"], "partial")
        self.assertFalse(result["exactParityEstablished"])
        self.assertEqual(result["sections"]["middle"]["referenceGlobalTracks"], [])

    def test_large_gap_does_not_become_fake_rightward_flight(self):
        frames = [frame("exit", 126, "local", index=0, x=-35),
                  frame("exit", 3722, "local", index=0, x=386),
                  frame("exit", 4921, "local", index=0, x=345)]
        self.assertEqual(motion.global_tracks(frames, "exit", "local"), [])

    def test_continuous_eastbound_and_westbound_can_both_be_measured(self):
        samples = []
        for ms, x in ((0, 300), (600, 270), (1200, 240)):
            sample = frame("entry", ms, "original", index=7, x=x)
            sample["original"]["nearbyGlobalButterflies"].append({
                "index": 8, "visible": True, "nearSection": True,
                "withinSection": True,
                "rect": {"x": 20+ms/20, "y": 170, "width": 40, "height": 40}
            })
            samples.append(sample)
        tracks = motion.global_tracks(samples, "entry", "original")
        self.assertEqual({t["direction"] for t in tracks},
                         {"leftward", "rightward"})
        self.assertEqual({t["samples"] for t in tracks}, {3})


if __name__ == "__main__":
    unittest.main()
