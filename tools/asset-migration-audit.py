#!/usr/bin/env python3
"""Phase 20: inspect local replacement artwork without uploading or downloading it.

Run: python3 tools/asset-migration-audit.py
Optional: python3 tools/asset-migration-audit.py --art-dir path/to/licensed-assets
"""
from pathlib import Path
import argparse
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--art-dir", type=Path, default=ROOT / "assets")
args = parser.parse_args()

names = re.findall(r"^([a-z0-9_]+\.webp)$", (ROOT / "ASSET-MANIFEST.txt").read_text(encoding="utf-8"), re.M)
extras = ["bfly_1.webp", "bfly_white.webp"]
art = args.art_dir.resolve()
print(f"Artwork directory: {art}")
print("Required Tasik reference-slot files:", len(names))
print("Additional butterfly image slots:", len(extras))
print("The filenames describe animation slots, not permission to reuse vendor artwork.\n")

missing = []
invalid = []
for name in names + extras:
    path = art / name
    if not path.is_file():
        missing.append(name)
        print("MISSING", name)
        continue
    with path.open("rb") as f:
        header = f.read(12)
    if header[:4] != b"RIFF" or header[8:12] != b"WEBP":
        invalid.append(name)
        print("INVALID", name)
    else:
        print("FOUND  ", name, f"({path.stat().st_size:,} bytes)")

print(f"\nPresent valid: {len(names) + len(extras) - len(missing) - len(invalid)}/{len(names) + len(extras)}")
print("This audit does not modify the website, obtain art, verify legal rights, or deploy.")
print("The site uses remote fallback until the runtime references are explicitly migrated.")
sys.exit(1 if missing or invalid else 0)
