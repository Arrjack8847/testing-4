#!/usr/bin/env python3
"""Phase 19 deployment gate: do not publish a reference-art prototype by mistake.

Run: python3 tools/check-release.py
Exit 0 only when all required, licensed artwork is self-hosted and
third-party reference image hotlinks have been removed.
This checker does not grant or verify legal permission.
"""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
manifest = root / "ASSET-MANIFEST.txt"
assets = root / "assets"
names = re.findall(r"^([a-z0-9_]+\.webp)$", manifest.read_text(encoding="utf-8"), re.M)
errors = []
if len(names) != 25 or len(set(names)) != 25:
    errors.append("Expected exactly 25 unique WebP entries in ASSET-MANIFEST.txt")

for name in names:
    path = assets / name
    if not path.is_file():
        errors.append(f"Missing local artwork: assets/{name}")
        continue
    with path.open("rb") as f:
        header = f.read(12)
    if len(header) < 12 or header[:4] != b"RIFF" or header[8:12] != b"WEBP":
        errors.append(f"Invalid WebP header: assets/{name}")

for filename in ("index.html", "scene.js", "styles.css"):
    source = (root / filename).read_text(encoding="utf-8")
    if re.search(r"https?://(?:www\.)?undangankahwin\.com/[^\s\"']*\.(?:webp|png|jpe?g)", source, re.I):
        errors.append(f"{filename} contains a reference-provider artwork hotlink")
    if filename == "scene.js" and "undangankahwin.com" in source:
        errors.append("scene.js still references the original provider as an artwork host")

if errors:
    print("NOT RELEASE READY — prototype remains suitable for local development only.")
    for error in errors:
        print(" - " + error)
    sys.exit(1)

print("Technical artwork hosting checks passed.")
print("IMPORTANT: Independently confirm copyright, distribution and commercial usage rights before publishing.")
