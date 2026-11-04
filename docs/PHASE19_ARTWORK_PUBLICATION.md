# Phase 19 — Artwork publication readiness

**Baseline:** `main` merge `4573a607` (PR #55). This is a functional **reference-recreation prototype**, not yet cleared for commercial publication.

## Current findings

- Section 1 is defined by **25 reference-scene WebPs** in `ASSET-MANIFEST.txt`, but none of those files are tracked in the current GitHub checkout. The initial app can fall back to a gradient; screenshot parity and an offline published build cannot depend on remote artwork.
- `scene.js` currently uses an external reference-provider fallback, including when local artwork is missing. `index.html` has four inline provider-hosted butterfly image URLs. These must be replaced before shipping a commercial template.
- Several `assets/reference-dev/` paths are *optional, local-only reference comparisons*. Their absence is not inherently a defect; keep them out of a public deployment.
- Existing original-named SVG illustrations can inform a replacement design, but filenames do **not** prove rights. Document provenance and intended commercial permissions for **every** included image, font, portrait, and brand visual.
- `tools/check-release.py` is intentionally strict and still fails. **Do not bypass it** by weakening the check, fabricating assets, or adding original competitor artwork without authorization.

## Missing opening artwork by purpose

| Layer purpose | Filename(s) | Replacement approach |
| --- | --- | --- |
| Hero composition | `scene.webp` | Produce an independently illustrated complete 9:16 scene, matching the responsive composition rather than copying artwork |
| Atmosphere, background and architecture | `sky.webp`, `palace.webp`, `reeds.webp`, `arch.webp` | Original matching-layer exports preserving the camera/scroll arrangement |
| Framing trees and drapery | `tree_l.webp`, `tree_r.webp`, `drape.webp` | Transparent original layers with measured edge-safe overscan |
| Hanging flowers | `hang_1.webp`–`hang_4.webp` | Four independent transparent floral sprites |
| Front vegetation | `spike_3.webp`–`spike_5.webp`, `stem_1.webp`–`stem_2.webp` | Five original botanical sprites |
| Leaves | `leaf_4.webp`–`leaf_6.webp` | Three transparent animated leaf types |
| Blooms | `bloom_1.webp`, `bloom_2.webp`, `bloom_5.webp`, `bloom_6.webp` | Four independent original flower sprites |
| Foreground peacocks | `peacock.webp` | Independently illustrated peacock sprite, optional if final design changes |

Full manifest order: `scene.webp`, `sky.webp`, `palace.webp`, `reeds.webp`, `arch.webp`, `tree_l.webp`, `tree_r.webp`, `drape.webp`, `hang_1.webp`, `hang_2.webp`, `hang_3.webp`, `hang_4.webp`, `spike_3.webp`, `spike_4.webp`, `spike_5.webp`, `stem_1.webp`, `stem_2.webp`, `leaf_4.webp`, `leaf_5.webp`, `leaf_6.webp`, `bloom_1.webp`, `bloom_2.webp`, `bloom_5.webp`, `bloom_6.webp`, `peacock.webp`.

## Controlled migration sequence

1. **Source artwork and rights.** Choose independently created artwork or source files with explicit rights for commercial reproduction and redistribution. Keep source/design files and provenance evidence outside any public repo as appropriate. Do not assume that downloaded reference images are licensed.
2. **Match the layout.** Create the complete scene and transparent layers at consistent proportions, then verify the 320×568, 360×740, 390×844 and 430×932 viewports. Preserve the tested animations, hit targets and scroll seams.
3. **Replace runtime references.** Point `scene.js` at owned, self-hosted assets only. Replace the four inline butterfly URLs in `index.html` with original/authorized local art. Remove provider-host fallback. Update any tests that assume hotlinking is acceptable; retain tests for missing assets and graceful fallback.
4. **Keep local reference comparison separate.** Only authorized local comparison materials belong under `assets/reference-dev/`, never in public artifacts. Any live-reference QA scripts must be reviewed for permission before use or distribution.
5. **Validate before commercial publication.** Run `python3 tools/artwork-inventory.py --strict`, `python3 tools/check-release.py`, the full mobile Playwright suite, offline-network/error tests and visual comparison. A passing technical gate does **not** replace human verification of copyright/usage rights.

## Commands

```powershell
python tools/artwork-inventory.py
python tools/artwork-inventory.py --json
python tools/artwork-inventory.py --strict
python tools/check-release.py
```

The inventory tool is read-only: it does not download vendor files, rewrite pages, or assert a copyright license. The publication gate remains intentionally failing until actual publishable art is supplied and references are cleaned.
