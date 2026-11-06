#!/usr/bin/env python3
"""Inventory production-artwork dependencies without downloading vendor files.

No external requests are made. This is an informational companion to
tools/check-release.py, which remains the publication gate.

Usage:
  python3 tools/artwork-inventory.py
  python3 tools/artwork-inventory.py --json
  python3 tools/artwork-inventory.py --strict
"""
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
IMAGE_URL = re.compile(
    r"""https?://[^\s"'<>)]*?\.(?:webp|png|jpe?g|svg|gif)(?:\?[^\s"'<>)]*)?""",
    re.IGNORECASE,
)
REFERENCE_HOST = "undangankahwin.com"
MANIFEST_NAME = re.compile(r"^([a-z0-9_]+\.webp)$", re.MULTILINE)


def inventory(root: Path) -> dict:
    manifest = root / "ASSET-MANIFEST.txt"
    listed = MANIFEST_NAME.findall(manifest.read_text(encoding="utf-8"))
    missing, invalid = [], []
    for name in listed:
        path = root / "assets" / name
        if not path.is_file():
            missing.append(f"assets/{name}")
            continue
        with path.open("rb") as image:
            header = image.read(12)
        if len(header) != 12 or header[:4] != b"RIFF" or header[8:12] != b"WEBP":
            invalid.append(f"assets/{name}")

    sources = [root / "index.html", *sorted(root.glob("*.css")), *sorted(root.glob("*.js"))]
    external_image_urls = []
    provider_bases = []
    optional_reference_dev = []
    for path in sources:
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for match in IMAGE_URL.finditer(line):
                external_image_urls.append({
                    "file": path.name, "line": line_number, "url": match.group(0)
                })
            if REFERENCE_HOST in line and path.name == "scene.js":
                provider_bases.append({"file": path.name, "line": line_number})
            if "assets/reference-dev/" in line:
                optional_reference_dev.append({"file": path.name, "line": line_number})

    hosted = sorted(
        str(path.relative_to(root)).replace("\\", "/")
        for path in (root / "assets").rglob("*")
        if path.is_file()
    )
    blockers = []
    if len(listed) != 25 or len(set(listed)) != 25:
        blockers.append("Expected 25 unique opening-scene entries in the reference manifest")
    if missing:
        blockers.append(f"{len(missing)} missing scene WebPs")
    if invalid:
        blockers.append(f"{len(invalid)} invalid scene WebPs")
    if external_image_urls:
        blockers.append(f"{len(external_image_urls)} external image URLs in page source")
    if provider_bases:
        blockers.append("scene.js still includes a reference-provider artwork base")
    return {
        "technical_status": "blocked" if blockers else "technically_complete",
        "reference_scene_manifest_count": len(listed),
        "missing_reference_scene_assets": missing,
        "invalid_reference_scene_assets": invalid,
        "external_image_urls": external_image_urls,
        "reference_provider_base_occurrences": provider_bases,
        "optional_reference_dev_occurrences": optional_reference_dev,
        "self_hosted_asset_paths": hosted,
        "blockers": blockers,
        "rights_note": (
            "This inventory cannot establish copyright, permission, provenance, or "
            "commercial licensing. Review all assets independently before publication."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print structured JSON")
    parser.add_argument("--strict", action="store_true", help="Exit 1 for technical blockers")
    args = parser.parse_args()
    result = inventory(ROOT)
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Technical artwork status: {result['technical_status'].upper()}")
        print(f"Reference-scene manifest: {result['reference_scene_manifest_count']} assets")
        print(f"Missing: {len(result['missing_reference_scene_assets'])}; "
              f"Invalid: {len(result['invalid_reference_scene_assets'])}; "
              f"External image URLs: {len(result['external_image_urls'])}; "
              f"Self-hosted assets: {len(result['self_hosted_asset_paths'])}")
        for issue in result["blockers"]:
            print(f"  BLOCKED: {issue}")
        for item in result["external_image_urls"]:
            print(f"  HOTLINK: {item['file']}:{item['line']}: {item['url']}")
        for item in result["reference_provider_base_occurrences"]:
            print(f"  PROVIDER BASE: {item['file']}:{item['line']}")
        print(result["rights_note"])
    return 1 if args.strict and result["blockers"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
