# Tasik Kayangan — Section 5: Order of the Day

Reference: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en

## Current exact-art implementation (4 November 2026)

Section 5 at **http://localhost:8000/** now uses only the reference-art
layout. For an *exact artwork comparison*, these two actual reference files
must be present locally and their use must be permitted:

- `assets/reference-dev/band_plum.webp` — verified live CSS URL:
  `https://undangankahwin.com/images/concierge/packs/tasik-kayangan/band_plum.webp`.
  The live section's background uses a 12%-opacity dark overlay, centered
  `background-size: cover`, and has ~651.28px height at 390×844.
- `assets/reference-dev/bfly_blush.webp` — observed reference butterfly
  split-wing sprite. Source path documented in
  `download-section5-reference.ps1` under `anggerik-nirmala/`.
  The live butterfly is approximately 46×35px, with two 23px wings,
  `background-size: 200% 100%` and 3D hinge flapping.

The artwork files are **not shipped with or downloaded by this public GitHub
repository**. Only a rights-confirming local PowerShell script may stage them.
No vendor art is automatically fetched from third-party servers by the
website.

The unrelated `assets/order-plum-emboss-original.svg` is **not referenced by
the active Section 5 CSS** anymore. A solid neutral plum canvas appears if the
background WebP cannot load; an explicit status message identifies missing
WebPs. It does not silently imitate the reference illustration.

The root URL requests both local WebPs automatically, with no
`?orderReference=1`. `#runningOrder[data-artwork-status]` reports
`loading`, `ready`, `partial` or `missing`. Only `ready` means both
WebPs decoded.

For private visual inspection *after ensuring you have permission*:

```powershell
cd D:\testing-4
powershell -ExecutionPolicy Bypass -File .\download-section5-reference.ps1 -IHavePermission
powershell -ExecutionPolicy Bypass -File .\start.ps1
# In a second terminal:
node tools/section5-exact-art-compare.mjs
```

The comparison script captures live and local **entrance, middle, exit** shots
at 390×844 and saves geometry and image dimensions to
`artifacts/section5-exact-compare/report.json`. It refuses to claim visual
parity if either local WebP is absent. The script does not store source asset
binaries. Compare the screenshots for crop, panel, text, borders and motion
before claiming a pixel-perfect match.

All other historical notes below describe earlier iterations; references to
the original SVG fallback or `?orderReference=1` are **superseded**.

## Integrated single-URL behavior (4 November 2026)

After integration with the approved Sections 1–4, the six-stop **Order of the Day**
is the only visible Section 5 at `http://localhost:8000/`. The former date-only
`#saveTheDate` is hidden by default, because Section 4 already includes the
reference's countdown. The old date-only demonstration remains available via
`?legacySaveDate=1` for historical regression testing.

The `?orderReference=1` query parameter is **no longer required** for the
reference-style scene. On the standard root URL, Section 5 automatically checks
whether permission-cleared `assets/reference-dev/band_plum.webp` and
`bfly_blush.webp` have been staged locally. When present and decodable, it
uses their measured backgrounds and split-wing butterfly. When absent, it
renders the independently drawn plum embossed artwork and retains the six
schedule rows; it never hotlinks the source images.

The actual reference artwork is not included in the public repository. The
original embossed art is therefore **not pixel-identical** to the reference.
The user must have rights to any source imagery used for commercial output.
All time labels and event details are example values rather than a confirmed
customer wedding program.

Validation for this integration also covers Events→Order, Order→Gallery,
the approved Section 3 photo zoom and the unchanged Sections 1–2.

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


## 4 November — final reference-image visual audit tool

The final screenshot comparison requires the actual permission-cleared local
`band_plum.webp` and `bfly_blush.webp` files under the ignored
`assets/reference-dev/` directory. **Neither reference image is committed
or downloaded automatically by the audit.**

With the Section 5 regression branch running at `http://localhost:8000/`:

```powershell
cd D:\testing-4
node tools/section5-visual-parity-audit.mjs
```

The tool first checks that both local assets exist and have RIFF/WebP
signatures. If either is missing or invalid, it stops before claiming
visual parity and reports the missing filename.

Without those files, `node tools/section5-visual-parity-audit.mjs
--geometry-only` still compares the reference and local section geometry
at all four phone sizes. It deliberately **skips pixel comparisons** while
local artwork is missing. The GitHub Actions workflow
`section5-four-phone-geometry-audit.yml` runs this mode with no WebPs
and uploads temporary screenshots/measurements for review.

Pixel comparisons keep screenshots at their original sizes: if the
reference and local sections have different heights, the extra area is
counted in the mismatch rather than stretching either screenshot.

If both are available, it opens the live reference and local invitation
at **320×568, 360×740, 390×844 and 430×932**, captures each full timeline
panel, and writes screenshot pairs, difference heatmaps, element geometry,
per-pixel mean absolute error, and mismatch coverage statistics to:

`artifacts/section5-visual-parity/`

Artifacts are ignored by Git. Run `node
tools/section5-visual-parity-audit.mjs --reference-only` to capture
**only the public reference** if locally authorized artwork is not ready.
These output screenshots are for local visual review, not redistribution.

Interpret the pixel difference as a diagnostic. Animation frames,
font rasterization and the provider's proprietary effects may differ.
Only the user can approve the final visual review. The focused four-width
behavioral QA remains independent from this artwork-dependent audit.


## Four-phone responsive geometry findings — 4 November

The completed [read-only GitHub audit](https://github.com/Arrjack8847/testing-4/actions/runs/41777241046)
captured the live source and the then-current implementation at 320, 360, 390 and
430px phone widths. The audit succeeded at gathering DOM geometry, but its
first version had two **measurement errors**: `.cgv-tl-title` selected the
first timeline event title rather than the main heading, and the
`RUNNING ORDER` eyebrow selector did not match. Some source screenshots
at larger widths also showed a lingering cover/hero layer, because the audit
did not wait long enough before opening. These screenshots must not be used
as evidence of exact visual parity. Selectors and opening waits are now
corrected, with a screenshot-occlusion guard.

The **valid timeline-row coordinates** measured before the CSS correction:

| Width | Reference first-row y | Reference row x / width | Old local row x / width | Reference section height | Old local section height |
| --- | ---: | --- | --- | ---: | ---: |
| 320 | 265.92 | 28 / 264 | 20 / 280 | 739.23 | 651 |
| 360 | 213.03 | 28 / 304 | 28 / 304 | 651.28 | 651 |
| 390 | 213.03 | 28 / 334 | 28 / 334 | 651.28 | 651 |
| 430 | 213.03 | 28 / 374 | 48 / 334 | 651.28 | 651 |

At 320px the source headline spans **two lines**, adding ~52.89px
of height, and rows 3 and 4 wrap to heights 86.31px and 67.88px
respectively; the final content row ends at y=643.23 and the source
panel ends at y=739.23, leaving 96px bottom padding. The narrower local
single-line headline had suppressed these wraps and was visibly wrong.

CSS now uses:
- 320px: 28px side padding; 74px time column + 34px gap; two-line 46px
  script heading; 96px bottom padding; border x=23 / right=23.
- 430px: expand the inner max-width from 390 to 430px and remove
  children’s fixed 334px maximum; the expected timeline is x=28 / width=374.
- 360 and 390px: leave the already matched x/y geometry unchanged.

Two new focused Playwright tests independently assert the 320px and
430px reference coordinates. A refreshed four-width source audit and
focused CI must pass **on the new head commit** before these corrections
are treated as verified. Permission-cleared WebPs remain necessary
for pixel-level artwork comparison; no source assets are in Git.
