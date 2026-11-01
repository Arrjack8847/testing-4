# Phase 21 — opt-in WebP skin system

The existing prototype remains the default. **No existing camera positions, DOM layout, animation timelines, or sprite geometry were modified.**

## Preview an original skin

Create a directory `assets/skins/golden-autumn/`. Supply the exact 25 filenames in `ASSET-MANIFEST.txt`, plus `bfly_1.webp` and `bfly_white.webp`. Use independently produced or commercially licensed original artwork.

Open `http://localhost:8000/?skin=golden-autumn`.

The scene uses the same placements, camera push/retreat, garden return, glint, butterfly wingbeats, swipe and handwritten names as the default. The skin argument accepts only lowercase letters, numbers and hyphens (up to 40 characters).

## Isolation rules

- Normal URL (no skin): unchanged development behavior, local original slots and remote reference fallback.
- Valid `?skin=name`: loads `assets/skins/name/` scene images **only**; no reference-host fallback when a scene file is missing.
- Butterfly images for a skin also point to its local directory, never to the original vendor.
- Invalid skin strings: treated as the ordinary default prototype.
- `?remote=1` remains valid for the default QA prototype; it has no effect on isolated skins.
- Missing skin scene images trigger the site's existing fallback/notice behavior; verify all 27 are present before considering a skin complete.

## Art direction constraints

A filename swap alone is not enough for consistent design. Respect the transparent canvas and composition of the `sky`, `arch`, `palace`, `tree`, `peacock` and `scene` images. Preserve visual object positions if you want their CSS movements to remain registered. The two butterfly WebPs must contain wing imagery suitable for the existing mirrored half-wing animation.

Check with:
```powershell
python tools/asset-migration-audit.py --art-dir assets/skins/golden-autumn
```

Before releasing, remove the original provider's remote artwork dependencies from the **default** prototype as well. Phase 19's checker still intentionally blocks a commercial launch while those dependencies remain. Physical-device visual testing and suitable licensing are mandatory.
