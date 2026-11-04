# Section 6 — Dress Code integration

This document is about the **Dress Code section** between Order of the Day
(`#runningOrder`) and Our Gallery (`#gallery`). The older
`SECTION6-README.md` documents a different legacy RSVP interface.

## Approved source material

- `assets/section6/paper.webp`: authorized Tasik Kayangan paper background,
  1080 × 1920, SHA-256 `1a6beba7a3ded69a651d4efcb9e69a706d58a1e4f9cffacaa26c39313b757006`.
- `assets/section6/bfly_1.webp`: authorized Serambi Ungu butterfly spread,
  256 × 204, SHA-256 `685b727e858b04507a2aeb658a30e0bde98cde976dc37b8be0f771bbbb77add4`.
- Source addresses and hashes are recorded in `assets/section6/ASSET-SOURCES.json`.

The active Dress Code markup uses `dress-code.css` / `dress-code.js`,
with bundled WebPs, two animated halves of the butterfly, no external
image hotlinking, viewport-based text entrances, independent flight and
a reduced-motion fallback.

This integration **replaces the former `reference-continuation ref-dress`
placeholder on main only**. The rest of the main invitation is left intact,
including workers' changes to Sections 1–5 and 7–10.

## Verification

Run `powershell -ExecutionPolicy Bypass -File .\verify-section6-assets.ps1`
from the checkout root. The script checks both image hashes, local URLs
and for unfinished merge conflicts.

Run `npx playwright test tests/section-six-dress.spec.mjs` for the
36 phone-viewport tests. Comparison scripts in `tools/section6-*`
are for local reference auditing, not production runtime.

**Fidelity boundary:** Wording, swatches, card measurements and
source artwork were verified. Pixel-perfect composition and exact
butterfly timing have not been proven. Existing pixel audit at 390x844
found less than 1% exactly identical pixels across the full viewport;
that metric includes surrounding sections and cannot be treated as
a Dress Code-only score. Keep calibration work on a separate branch.

Only use this source artwork in projects covered by the permission
represented by the user's approved Path A.
