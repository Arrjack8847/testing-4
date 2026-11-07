"""Lightweight source integrity checks for the mobile opening scene.

No network access or image downloads are needed for this check.
Run: python tools/check-source.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text(encoding="utf-8")
js = (ROOT / "scene.js").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
ps1 = (ROOT / "download-assets.ps1").read_text(encoding="utf-8")
start = (ROOT / "start.ps1").read_text(encoding="utf-8")
manifest = (ROOT / "ASSET-MANIFEST.txt").read_text(encoding="utf-8")

# The manifest is now the only authoritative asset list; both Windows
# scripts read it at runtime rather than duplicating the 25 filenames.
listed = set(re.findall(r"\b([a-z0-9_]+\.webp)\b", manifest))
used = set(re.findall(r"\b([a-z0-9_]+\.webp)\b", js))
# Two butterfly sprites are opt-in skin artwork, not main-scene manifest assets.
butterfly_slots = {"bfly_1.webp", "bfly_white.webp"}
assert len(listed) == 25, f"Expected 25 unique WebP assets, got {len(listed)}"
assert butterfly_slots.issubset(used), "Skin butterfly slot mapping is incomplete"
# Myanmar Royal Luxury adds one separately derived, opt-in pathway cutout.
# It is NOT part of the 25-file original scene manifest or butterfly slots.
skin_only = {"path.webp"} if "path.webp" in used else set()
scene_used = used - butterfly_slots - skin_only
assert listed == scene_used, f"JS layer usage mismatch: {listed ^ scene_used}"
if skin_only:
    assert "activeSkin === 'myanmar-luxury'" in js, "Path cutout must be opt-in only"
    path = ROOT / "assets/skins/myanmar-luxury/path.webp"
    assert path.is_file(), "Missing opt-in Myanmar pathway artwork"
    with path.open("rb") as stream:
        header = stream.read(12)
    assert header[:4] == b"RIFF" and header[8:12] == b"WEBP", "Invalid Myanmar WebP"

for script, source in [("download-assets.ps1", ps1), ("start.ps1", start)]:
    assert "ASSET-MANIFEST.txt" in source, f"{script} must read artwork manifest"
    assert "Test-ValidWebP" in source, f"{script} must validate cached WebPs"
    assert "RIFF" in source and "WEBP" in source, f"{script} must verify file signatures"

for identifier in [
    "invitation", "viewport", "animatedScene", "masterArt",
    "openButton", "cover", "opened", "networkNote",
    "debugPanel", "compareMode", "blendSlider", "freezeMotion"
]:
    assert f'id="{identifier}"' in html, f"Missing HTML ID: {identifier}"

for marker in [
    ".scene-stage", ".animated-scene", ".cover", ".opened",
    ".sprite", ".swipe-cue", "prefers-reduced-motion"
]:
    assert marker in css, f"Missing CSS marker: {marker}"
assert '<meta name="viewport"' in html
print("PASS: scene source, 25 artwork mappings, and HTML/CSS hooks are consistent.")
