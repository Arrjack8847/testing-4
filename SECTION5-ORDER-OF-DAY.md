# Tasik Kayangan — Section 5: Order of the Day

Reference: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en

## Verified source structure

Public indexed reference and the prior read-only source audit agree that the
section *immediately after Events* is `Running order / Order of the Day`,
not the Wedding Gift section. It contains six items, in order:

| Time | Title | Source subtitle |
| --- | --- | --- |
| 11:00 am | Guests arrive | Lunch service opens |
| 12:00 pm | The couple arrive | |
| 12:30 pm | Wedding procession | Led by kompang from the main entrance |
| 1:00 pm | Bersanding & photographs | |
| 2:00 pm | Lunch is served | |
| 4:00 pm | Celebration ends | |

Earlier read-only measurement: document Y 6715–7366 = 651px tall at
390×844; the reference uses mobile viewport-sticky atmospheric artwork,
text entrances and a plum floral band (`band_plum.webp`).

## Changes

- Insert `#runningOrder[data-section=5]` **directly after** `#eventDetails`.
- Implement original floral CSS/artwork by default. Explicit
  `?orderReference=1` uses **local WebP files** under
  `assets/reference-dev/`. No vendor artwork is embedded or hotlinked.
- Preserve original 6-stop timeline typography/sequence at four mobile sizes.
- Scroll-aware layered stage with bounded, reversible camera displacement,
  stagger-free observed 52px/0.955 reveal envelope, and Reduced Motion.
- Keep existing legacy `#saveTheDate` logic in the DOM but hide the redundant
  visible scene by default. The Events section already contains a live D/H/M/S
  countdown as the reference does. `?legacySaveDate=1` restores the old scene
  for regression checks; no original date logic was deleted.
- Dates and programme titles are reference examples, not confirmed customer data.

## Limitations

This is not yet certified pixel-perfect. Browser Use live visual access was
blocked by insufficient credits during this pass. Exact current reference
pixel coordinates, colors, band crop, animation curve and app-owned photo
permissions require source-vs-local screenshots. The source background is
not commercially licensed for reuse merely because it is publicly hosted.

This branch only implements Section 5. Section 6 should be Dress Code,
which has not been rebuilt in this isolated branch. Its current next visible
block is the legacy Gallery; it is not a claim of full reference ordering.

## Run locally

```powershell
git fetch origin
git switch feat/section5-order-of-day-reference-20261103
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Visit `http://localhost:8000` for original art. With appropriate permission,
stage reference artwork **locally**, then open `?orderReference=1`:

```powershell
powershell -ExecutionPolicy Bypass -File .\\download-section5-reference.ps1 -IHavePermission
```

The downloader verifies WebP RIFF headers and never commits assets.
`.gitignore` excludes `assets/reference-dev/`. Without local files, the
comparison mode keeps original artwork instead of silently hotlinking
or breaking the layout. Commercial redistribution is **not licensed** by
a public download URL.

```powershell
npm install
npx playwright install chromium
npm run test:syntax
npx playwright test tests/section5-order-of-day.spec.mjs tests/section-four.spec.mjs tests/section-five.spec.mjs --workers=2
```

PR is intentionally stacked onto Section 4 PR #14. Validate section 4
after integrating it and never merge without checking all head-specific CI.


## Verified live visual evidence (GitHub Actions Chromium)

Subsequent direct source/local capture succeeded at 390×844 after
running the checked-out local server. Actual source `.cgv-timeline`
computed background:
`linear-gradient(rgba(20,8,18,.12), rgba(20,8,18,.12)), url(band_plum.webp)`,
with sizes `auto, cover` and positions `0% 0%, 50% 50%`.
The source band has document height 651.3px, with a thin pale frame;
the source heading is Pinyon Script, 46px; timeline list font is
EB Garamond, 18px. These measured details are reflected in
`order-program.css` and in development-only `?orderReference=1`.

Head-specific mobile tests passed 60/60 at 320×568, 360×740,
390×844 and 430×932 on a completed CI run after measured text,
panel and backdrop revisions. The comparison workflow also captured
source and local start/middle/exit checkpoints after direct source
HTTP 200 access.

Known remaining differences visible in those captures: the reference's
global branded header, floating bottom controls, the source's exact
sparse butterfly flight and the following *Dress Code* section.
The current isolated branch intentionally does not replace global
navigation or build the following Dress Code section. Neither
full-page nor animation-timeline pixel parity has been certified.

## Next refinement — local WebP source discipline

The 4 November iteration replaces all Section 5 **runtime hotlinks** with
locally staged `band_plum.webp` and `bfly_blush.webp`. The source image in
`order-program.css` is not requested unless `data-band-status=loaded`,
which is set only after the local file decodes. Tests verify a missing file
is harmless and a valid local WebP becomes the full-height `cover` background.
No source binaries were pushed. Existing visual comparisons remain useful as
historical evidence, but new comparisons require the developer's local images
or an explicitly permitted private test environment.


## Section 5 ambient-motion calibration (4 November 2026)

A new read-only Chromium audit of the live reference at 390×844 captured
three timeline scroll checkpoints and timed samples. It found:

- The **timeline** owns a `cgv-bf-layer` that fills its approximately 651px
  height. A butterfly moves horizontally from approximately x=-68px to
  x=44px in 3 seconds during the entering scene, with a gently varying y
  near 50–70px from the section top.
- The source butterfly DOM is a 46×35px `cgv-bf` with
  `scale(.82)`, composed of **two 23×35px halves** of
  `bfly_blush.webp`, each using `background-size:200% 100%`.
  Wings flap around their inner edges with `perspective(110px) rotateY(...)`.
  Source motion is updated by script (not a CSS keyframe on the butterfly).
- The source has a **fixed 300×viewport canvas** (`cgv-petals`) for
  drifting petals. It is not a set of static CSS decorations.

The independent implementation now uses a 46×35px two-wing sprite with
continuous approximately 44px/sec left/right traversal, reversible direction
and small y flutter. Rendering uses only a locally supplied, authorized
`bfly_blush.webp` (never vendor hotlinks). The ambient petals now use an
independently drawn 300px-wide, fixed-position canvas with eleven
deterministically seeded petals. Animation is paused when offscreen,
closed, hidden, or Reduce Motion is enabled, and does not create multiple
animation loops.

The measured trajectory and wing structure are substantially closer to
the source, but the exact proprietary JS motion curve and canvas particle
path have **not** been reproduced byte-for-byte or certified pixel-perfect.
The work remains draft, limited strictly to Section 5.


## 4 November — pixel-geometry and fallback-art calibration

Read-only Chromium geometry snapshots at **390×844** captured
the reference and this branch at equivalent timeline offsets.
Measured reference coordinates relative to `cgv-timeline`:

| Content | x | y | width | height |
| --- | ---: | ---: | ---: | ---: |
| Running order eyebrow | 28 | 96 | 334 | 18.14 |
| Order of the Day title | 28 | 126.14 | 334 | 52.89 |
| Row 1 | 28 | 213.03 | 334 | 67.13 |
| Row 2 | 28 | 280.16 | 334 | 52 |
| Row 3 | 28 | 332.16 | 334 | 67.13 |
| Row 4 | 28 | 399.28 | 334 | 52 |
| Row 5 | 28 | 451.28 | 334 | 52 |
| Row 6 | 28 | 503.28 | 334 | 52 |

The latest read-only comparison after the adjustments reported **0px
heading and eyebrow delta**, and row y errors of 0–0.01px. The section
is still 0.28px shorter (651px rather than 651.28px), which is beneath
one device pixel at the calibrated viewport.

Matching typography: EB Garamond 11px / 18.15px at 0.45em letter spacing
for the eyebrow, Pinyon Script 46px for the title, EB Garamond 12px /
19.8px letter spaced 0.12em for times **right-aligned** within
the first column, 17px for event titles, and 12px at 300 weight
for subtitles. Alignment is frozen in the dedicated phone test.

Visual source screenshot inspection showed that the independently
illustrated original fallback was washed out compared with the
reference. A new independently drawn file
`assets/order-plum-emboss-original.svg` now provides a dark plum
botanical relief behind the unchanged content. This is **not** a
replica of the source-owned `band_plum.webp`; users with permission
can still stage the latter under ignored `assets/reference-dev/`.
Floating petals were softened to reduce visual noise.

The reference includes a branded fixed bar from the surrounding
preview and a finer-grained embossed floral texture; those are not
part of Section 5's isolated code scope. The live copyrighted WebP
has not been committed. Visual parity beyond layout and typography
must not be claimed from geometry tests alone.
