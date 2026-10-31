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
manifest = (ROOT / "ASSET-MANIFEST.txt").read_text(encoding="utf-8")

expected = set(re.findall(r"'([a-z0-9_]+\.webp)'", ps1))
listed = set(re.findall(r"\b([a-z0-9_]+\.webp)\b", manifest))
used = set(re.findall(r"\b([a-z0-9_]+\.webp)\b", js))
assert len(expected) == 25, f"Expected 25 unique WebP assets, got {len(expected)}"
assert expected == listed, f"Manifest mismatch: {expected ^ listed}"
assert expected == used, f"JS layer usage mismatch: {expected ^ used}"

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
