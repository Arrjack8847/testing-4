#!/usr/bin/env python3
"""Fetch the two user-authorized Dress Code WebPs into this repository.

Only for use when the project owner has the source owner's reuse permission.
No scraping of unrelated sections and no remote-image hotlinking at runtime.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import struct
from urllib.request import Request, urlopen

DEST = Path(__file__).resolve().parents[1] / "assets" / "section6"
SOURCES = {
    "paper.webp": "https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp",
    "bfly_1.webp": "https://undangankahwin.com/images/concierge/packs/serambi-ungu/bfly_1.webp",
}

def get_dimensions(data: bytes) -> tuple[int, int]:
    if len(data) < 30 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError("Not a valid RIFF WebP header")
    chunk_off = 12
    while chunk_off + 8 <= len(data):
        fourcc = data[chunk_off : chunk_off + 4]
        size = struct.unpack_from("<I", data, chunk_off + 4)[0]
        chunk = data[chunk_off + 8 : chunk_off + 8 + size]
        if len(chunk) < size:
            raise ValueError("Truncated WebP chunk")
        if fourcc == b"VP8X" and size >= 10:
            return (
                int.from_bytes(chunk[4:7], "little") + 1,
                int.from_bytes(chunk[7:10], "little") + 1,
            )
        if fourcc == b"VP8 " and size >= 10 and chunk[3:6] == b"\x9d\x01\x2a":
            return (
                struct.unpack_from("<H", chunk, 6)[0] & 0x3FFF,
                struct.unpack_from("<H", chunk, 8)[0] & 0x3FFF,
            )
        if fourcc == b"VP8L" and size >= 5 and chunk[0] == 0x2F:
            return (
                1 + chunk[1] + ((chunk[2] & 0x3F) << 8),
                1 + (chunk[2] >> 6) + (chunk[3] << 2) + ((chunk[4] & 0x0F) << 10),
            )
        chunk_off += 8 + size + (size & 1)
    raise ValueError("WebP image dimensions unavailable")

def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    manifest = {
        "purpose": "Authorized local Section 6 artwork; not hotlinked at runtime.",
        "reference_page": "https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en",
        "files": {},
    }
    for name, url in SOURCES.items():
        request = Request(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; AuthorizedAssetIntegration/1.0)",
            "Accept": "image/webp,image/*;q=0.8",
        })
        with urlopen(request, timeout=45) as response:
            data = response.read(15_000_001)
            media = response.headers.get("content-type", "")
            if response.status != 200:
                raise RuntimeError(f"{name}: HTTP {response.status}")
        if len(data) > 15_000_000 or len(data) < 50:
            raise RuntimeError(f"{name}: invalid size: {len(data)}")
        w, h = get_dimensions(data)
        if not (1 <= w <= 10000 and 1 <= h <= 10000):
            raise RuntimeError(f"{name}: invalid dimensions {w}x{h}")
        if name == "paper.webp" and (w, h) != (1080, 1920):
            raise RuntimeError(f"Paper artwork changed unexpectedly: {w}x{h}")
        (DEST / name).write_bytes(data)
        digest = hashlib.sha256(data).hexdigest()
        manifest["files"][name] = {
            "source": url, "width": w, "height": h,
            "bytes": len(data), "sha256": digest, "content_type": media,
        }
        print(f"LOCAL_WEBP {name}: {w}x{h} {len(data)} bytes, sha256={digest}")
    (DEST / "ASSET-SOURCES.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("Two validated Section 6 WebPs saved in assets/section6/")

if __name__ == "__main__":
    main()
