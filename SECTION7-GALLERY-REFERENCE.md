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

**Newly verified:** a second source-vs-local browser audit at 320px and
390px (Actions run 41676330125) confirms all five local frame positions
and sizes match the public source measurements within 0.1px.
The source frames use `border-radius:14px`, `border:4px solid white`,
`box-shadow:0 14px 36px rgba(120,95,70,.2)` and `padding:0`.
These values now replace the earlier arched-frame styling. The 4px
white border also gives the downloaded WebP an exact 4px inset.

**Remaining verification:** exact photo focal points, background decorations,
overall section entrance/exit scroll behavior and source animation timing.
The Gallery is not yet a certified exact replica. Default placeholders
remain until authorized WebP files arrive.

## Phase 4 — exact measured Gallery typography and photo tags

Read-only source measurements at 390px and 320px in GitHub Actions runs
41677514420, 41678693281 and 41678980077 confirmed:

| Item | Measured source styling |
|---|---|
| Gallery background | solid `#faf7fb` |
| Section padding | `96px 28px` |
| Base color/font | `#4a2a45`, 18px/29.7px EB Garamond |
| MOMENTS | 11px/18.15px EB Garamond 400, `#7e6479`, 4.95px letter-spacing, margin-bottom 12px |
| Our Gallery | 52px/59.8px Pinyon Script 400, `#7b3d6e`, no shadow |
| Heading-to-first-frame space | 40px |
| Tap a frame to view | 12px/19.8px EB Garamond 300, `#6f5a6c`, margin-top 22px |
| Photograph | `object-fit:cover`, `object-position:center` |
| Label text | uppercase, white, EB Garamond 10px/16.5px 400, 2.8px letter-spacing, shadow `0 1px 10px rgba(60,45,30,.7)` |
| Label position | 16px from outside frame left, 14px above outside frame bottom |

The Gallery's former decorative section gradient, sparkle layer and star
divider were removed to match the source's solid paper and simpler layout.
Caption styling was changed from a centered gradient bar to the source's
small bottom-left labels. The local-photo behavior remains unchanged.

A complete five-WebP local Gallery now hides the development-only missing-photo
disclaimer. This preserves the reference section's lower 96px padding.
When files are missing, the explanatory placeholders remain for debugging.

The isolated Section 7 tests check the values above at 320, 360, 390 and
430px; live-source audits so far explicitly sampled 320 and 390px.
No actual third-party wedding photographs were committed. Source motion,
edge transitions and photographic cropping remain to be compared once
consented WebPs are available.

## Phase 5 — reference-measured scrolling and reverse replay

Read-only motion audit [41680303237](https://github.com/Arrjack8847/testing-4/actions/runs/41680303237)
compared the public reference and this branch at 390×844, normal motion.
Measurements captured the initial hidden state, timed entry, deeper scroll,
reverse scroll, and re-entry without downloading source photographs.

- Reference elements begin at `opacity:0`,
  `transform:translate3d(0,52px,0) scale(.955)`.
- Source CSS reports an opacity transition of `1s` and a transform
  transition of `1.1s`, and its heading has a `150ms` delay.
- The five photo frames have delays of `0ms,150ms,300ms,450ms,600ms`.
- The source uses **independent in-viewport reveal flags**. At the first
  heading checkpoint the first two frames appear while the Groom, Garden
  and Lake remain hidden until scrolled into view.
- The source removes those flags when elements leave the screen, so the
  entrance runs again when scrolling back.

The implementation now uses a per-item IntersectionObserver to add and
remove `.in` rather than a one-time section-wide animation. Photo loading
continues separately and still uses **local WebP files only**. Reduced-motion
settings remove the transforms/transitions.

Run `npx playwright test tests/section-five.spec.mjs` to check both geometry
and reversible reveal. GitHub Actions focused QA executes it in four mobile
viewports, with isolated cross-engine accessibility checks.

This improves animation similarity, but exact easing curves, crop positions
and neighboring-section transitions still need final review. Third-party
reference photos are not present in this Git branch.

## Phase 6 — refined source easing

The second motion audit [41680976298](https://github.com/Arrjack8847/testing-4/actions/runs/41680976298)
confirmed independent reveal/reversal now behaves like the reference, but
our photo opacity and movement were too slow/fast respectively.

The follow-up source computed-style audit
[41681301439](https://github.com/Arrjack8847/testing-4/actions/runs/41681301439)
identified:
- Heading easing: `ease, cubic-bezier(0.22, 0.9, 0.24, 1)`,
  with durations `1s, 1.1s`.
- Photo frames: transform uses `ease` over `1.1s`,
  with per-frame delays `0, .15, .3, .45, .6s`.
- Photo opacity appears immediately when the respective source frame is
  activated; the frame transform then continues over time.

Section 7 now models those distinct visual behaviors. This is a visual
reconstruction of observed source animations, not source code copied from
the vendor. The original Gallery photographs remain *local-WebP-only* in
both customer and comparison modes; no URLs are loaded by this section.

Remaining: validate exact photos/crops once authorized assets are available,
and ensure adjacent Sections 6 and 8 have coordinated backgrounds and
scroll continuity. Do not merge other workers' branches blindly.

## Phase 7 — exact downloaded reference photographs on plain localhost

The normal local development address `http://localhost:8000/` now
**automatically prefers the five original locally downloaded WebP files**
under `assets/gallery/reference/` for private visual comparison:

```text
moody.webp
moody-bride.webp
moody-groom.webp
moody-garden.webp
moody-lake.webp
```

To install them **only if you have permission to download and use them**, run
`powershell -ExecutionPolicy Bypass -File .\download-gallery-reference.ps1 -IHaveRights`
from the repository root, then start `start.ps1` and open plain
`http://localhost:8000/`.

- The existing `?galleryReference=1` address remains a strict QA mode:
  it loads only reference WebPs and displays no fallback customer photos.
- If no reference WebPs are installed, plain localhost gracefully falls
  back to `assets/gallery/photo-01.webp` through `photo-05.webp`.
- On non-loopback hosts (including Vercel and public domains), only those
  customer-authorized `photo-0N.webp` files are considered. No remote
  image requests are issued by Section 7 in either mode.
- The reference WebPs remain Git-ignored and are not in GitHub. Localhost
  shows the exact photographs only **after the permitted copies are actually
  downloaded**; this code change alone does not supply image data.
- Automated tests assert exact URL selection, fallback behavior, and absence
  of reference-mode banners on plain localhost.

No third-party artwork has been committed or published. This is a
development-comparison workflow, not permission to reuse vendor photos in
a commercial wedding invitation.
