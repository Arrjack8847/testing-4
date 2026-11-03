# Section 7 — Our Gallery: local WebP workflow

Branch: `feat/section7-gallery-reference-20261103` (not merged into main).
Parent branch: `feat/section6-dress-code-reference-20261103`.

## Local asset paths (no image hotlinks in this section)

The reference content is `Moments`, `Our Gallery`, five image frames
(`Together`, `The Bride`, `The Groom`, `The Garden`, `The Lake`),
then `Tap a frame to view`. Section 7 immediately follows Dress Code.

Normal guest mode (`http://localhost:8000/`) loads only these local images:

| Frame | Local file to provide |
|---|---|
| Together | `assets/gallery/photo-01.webp` |
| The Bride | `assets/gallery/photo-02.webp` |
| The Groom | `assets/gallery/photo-03.webp` |
| The Garden | `assets/gallery/photo-04.webp` |
| The Lake | `assets/gallery/photo-05.webp` |

The files must be valid WebP images and must be yours or properly licensed.
You may upload/commit those five photos once licensed; the code already supports
them, no JavaScript edits needed. Missing images display honest, disabled
placeholders; no automatic third-party fallback.

## Optional locally downloaded reference WebPs — testing only

The separate comparison mode (`?galleryReference=1`) now uses ONLY
these local files:

```text
assets/gallery/reference/moody.webp
assets/gallery/reference/moody-bride.webp
assets/gallery/reference/moody-groom.webp
assets/gallery/reference/moody-garden.webp
assets/gallery/reference/moody-lake.webp
```

The original URLs are in `download-gallery-reference.ps1` for users
who hold the necessary rights. **The script never runs automatically.**

If you have rights to download and use the reference pictures, run:

```powershell
cd D:\testing-4
powershell -ExecutionPolicy Bypass -File .\download-gallery-reference.ps1 -IHaveRights
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Then visit `http://localhost:8000/?galleryReference=1`.

The comparison folder `assets/gallery/reference/` is excluded by
`.gitignore`; the images are not embedded in this branch and not uploaded
by the script. Do not commit/distribute portraits without permission. To
publish your own photos, provide the five `photo-0N.webp` files instead.

## Testing

`tests/section-five.spec.mjs` asserts that all gallery photos use local
`./assets/gallery/` URLs, are accessible when supplied, and leave
placeholders when absent. It also checks captions, viewer keyboard controls,
reduced motion and mobile overflow. Dedicated workflow:
`.github/workflows/section7-gallery-qa.yml`.

`tools/compare-section7-live.mjs` is a read-only Playwright geometry/screenshot
audit comparing the public source website to our local gallery. Without local
reference photos, its local screenshot captures placeholders; it cannot
certify photo cropping. It does not store source images in the repository.

Section 1 remains a separate system: it prefers downloaded local WebPs in
`assets/` but still falls back to external links if missing. Its existing
`download-assets.ps1` handles 25 scene files (subject to permission).
Do not remove Section 1's fallback until those real files are available
and the first-scene browser tests pass.

## Visual status

Layout, frame cropping, type metrics, motion and scene transitions are not
yet certified pixel-perfect against Tasik Kayangan. The repo is not production
ready until images are licensed/provided and device screenshots validated.

## Phase 3 — source-measured Gallery grid

Read-only browser measurements of the public reference at 390×844 and
320×568 (see GitHub Actions run 41672622274) showed the old gallery
arrangement was incorrect. The new CSS grid preserves this source layout:

- Top row: Together (left), The Bride (right).
- Second row: The Groom centered beneath the first row.
- Third row: The Garden full width.
- Fourth row: The Lake full width.
- Keep a 12px gap between columns and rows, with 28px side margins.
- At 390px: full width 334px, columns 161px; Together 246.9px tall,
  The Bride 214.7px tall, Groom 160×213.3px, Garden/Lake 334×249.4px.
- At 320px: full width 264px, columns 126px; Together 193.2px tall,
  The Bride 168px tall, Groom 125×166.7px, Garden/Lake 264×197.2px.
- The source heading is 52px on both audited mobile widths.

This was implemented with HTML/CSS only, leaving the existing interaction
and five local WebP file paths unchanged. A focused Playwright regression
test now asserts these frame measurements at the four configured phone
viewports.

**Remaining verification:** exact photo focal points, frame border radii,
botanical decoration, overall section entrance/exit scroll behavior and
source animation timing. The Gallery is not yet a certified exact
replica. Default placeholders remain until authorized WebP files arrive.
