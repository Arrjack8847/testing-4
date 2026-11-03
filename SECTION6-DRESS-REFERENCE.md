# Section 6 — Dress Code (Tasik Kayangan reference study)

Base branch: `feat/section5-order-of-day-reference-20261103`.
Development branch: `feat/section6-dress-code-reference-20261103`.

## Reference-verified structure
On the public Tasik Kayangan English mobile invitation, **Dress Code** comes directly
after **Order of the Day**, before **Our Gallery**. The audited source occupies
approximately document Y 7366–8046 (about 679 px at a 390×844 mobile viewport).

Text (from the public reference):
- Attire; Dress Code
- We would be delighted if you could dress along with our chosen palette.
- Groom's Side — Sage Green & Cream — Sage, soft sage, cream.
- Bride's Side — Terracotta & Blush — Terracotta, blush, sand.

## Implementation
- `index.html`: visible Section 6 inserted after the hidden legacy countdown,
  before the gallery, with the original reference wording.
- `dress-code.css`: compact 679px mobile composition at 390px, twin swatch cards,
  original botanical art, subtle wings, edge continuity, 52px / .955 reveal.
- `dress-code.js`: opens only with the invitation; viewport-triggered reveals,
  forward/reverse parallax, reduced-motion fallback, and no guest data collected.
- `tests/section-six-dress.spec.mjs`: wording, gating, ordering, continuity,
  responsive overflow and reduced-motion checks.

No production dress requirement has been confirmed. The sample palette must be
reviewed by the couple before commercial release. The default image is original.
For *development-only visual comparison* with source-hosted images, append
`?dressReference=1`; do not redistribute their files without permission.

The source's exact CSS geometry, colours and animation timeline have **not**
been verified by side-by-side pixel screenshots, so **this is not yet an
exact/pixel-identical match**. A direct 390×844 reference/local comparison
and four-width review (320, 360, 390, 430) are the final fidelity gates.

## Local test
```powershell
cd D:\testing-4
git fetch origin
git switch feat/section6-dress-code-reference-20261103
powershell -ExecutionPolicy Bypass -File .\start.ps1
```
Then visit `http://localhost:8000`, open the invitation and scroll to Dress Code.
Run `npm install` and `npm run test:syntax` plus
`npx playwright test tests/section-six-dress.spec.mjs` to validate.

## Screenshot-driven visual calibration (new)

The optional, **developer-local** comparison tool captures both the live source
and this local branch at **320, 360, 390 and 430 px** wide, each **844 px high**.
It measures Section 6 height, heading position, typography, palette labels,
swatches and source image loading. It generates an interactive overlay for
visually aligning the two screenshots.

1. In PowerShell window A, start the local server:

   ```powershell
   cd D:\testing-4
   git fetch origin
   git switch feat/section6-dress-code-reference-20261103
   git pull --ff-only origin feat/section6-dress-code-reference-20261103
   powershell -ExecutionPolicy Bypass -File .\start.ps1
   ```

2. In a **second PowerShell window** (with the first server still running):

   ```powershell
   cd D:\testing-4
   npm install
   npx playwright install chromium
   npm run compare:section6
   ```

3. Open the generated file in Chrome:

   `D:\testing-4\artifacts\section6-compare\comparison.html`

4. Inspect each side-by-side pair, drag the opacity sliders, and review:

   `D:\testing-4\artifacts\section6-compare\measurements.json`

5. For **development-only source-hosted artwork comparison**, instead run:

   ```powershell
   npm run compare:section6 -- --local "http://127.0.0.1:8000/?dressReference=1"
   ```

The script visits the reference over the Internet. It never sends local
photos or RSVP data to the source website. If the reference site cannot
load, the generated report records this failure explicitly. Screenshots and
test output are ignored by `.gitignore` and must not be uploaded or published
without appropriate rights. Only compare on systems where you have authority
to load both pages.

**This tool does not automatically make the website pixel-perfect.** Its
measurements and overlays provide the evidence needed to adjust CSS,
artwork proportions and animation timings on the next calibration pass.
A source screenshot comparison has not yet been run in this work session.

## Evidence-based visual calibration — 4 November 2026

A live-source vs local Playwright comparison ran successfully in GitHub Actions:
https://github.com/Arrjack8847/testing-4/actions/runs/41677687212

Four matched mobile widths were captured: **320, 360, 390, 430 px**, all
at 844 px viewport height. The script measured the published source and local
CSS independently, using the Dress Code heading as a shared anchor.

**Measured matches at all four widths:**
- Attire eyebrow, Dress Code heading, introduction.
- Groom's Side, Sage Green & Cream, sage palette caption.
- Bride's Side, Terracotta & Blush, terracotta palette caption.
- All six 30 px circular palette swatches, their x/y coordinates and RGB values.
- Relevant font sizes, text colour values, and vertical positions (0.00 px
  reported difference in these sampled layout measurements).

**Important scope:** This is *measured typography and swatch parity*, not a
pixel-perfect visual match for the whole section. The source's `cgv-inner`
content block was 487.3 px tall at 390 px, whereas the local measured
container is an entire 679 px section; these heights are **different DOM
boxes** and must not be compared as if they were equivalent.
The independent source audit previously measured its overall Dress Code
region at approximately 679 px. Our local section is 679 px.

**Still different or not proven:** full background painting, floral/edge
decorations, card borders and shadows, animation curves, scroll/sticky camera
behaviour, and 1:1 screenshot pixel differences. They should be inspected
visually before calling the reproduction exact.

The CI calibration workflow uploads only measurements in JSON; third-party
reference screenshots stay ephemeral on the runner and are never committed
or uploaded as artifacts. A new automated regression check locks in these
core measurements in `tests/section-six-dress.spec.mjs`.


## Measured card and motion parity — 4 November 2026

The reference's actual card and framing CSS was measured through the read-only
browser in CI, then matched in this branch.

- Reference section background: #faf7fb.
- Reference section padding: 96px top/bottom, 28px left/right.
- Content height: 507.09px (320/360 widths), 487.30px (390/430 widths).
- Each palette card: full available width, 168.78px high, 22px 18px padding,
  16px corner radius, transparent-white 50% background, and 1px
  rgba(126,100,121,.3) border with no shadow.
- Gap between palette cards: 14px.
- All source/local content, cards and swatches matched at 320/360/390/430px in
  successful CI: https://github.com/Arrjack8847/testing-4/actions/runs/41680565079

The reference dress artwork is **paper.webp**, not scene.webp; the paper
image overlaps its section by 12% top and bottom (124% section height).
Source-hosted paper only loads when the developer explicitly adds
`?dressReference=1`; the original mode uses independently created SVG art.

Reference-reported text motion: 52px downward + 0.955 initial scale,
opacity 1s ease; transform 1.1s cubic-bezier(.22,.9,.24,1).
Delays: eyebrow 0s, heading .15s, intro .30s, first card .45s,
second card .60s. These values are now implemented as CSS transitions.

The source paper's parallax moved approximately -0.0427px per one pixel
change in the section's top screen coordinate, with an additional
3.5px offset in normal-motion mode. The local scene uses this same calibrated
camera curve. A dedicated no-reduced-motion comparison script
`tools/section6-motion-audit.cjs` captures seven scroll states and uploads
a *measurements-only* artifact from GitHub Actions.

The source butterfly uses paired 3D-flapping image wings and a larger
cross-section flight trajectory. Local mode still renders an independently
drawn CSS butterfly instead of republishing that vendor artwork. The
illustrated background and butterfly cannot be described as pixel-identical;
commercial redistribution would require source artwork rights or an approved
original replacement.


## Original butterfly flight and paper art — follow-up

The default Section 6 now has an original
`assets/dress-paper-original.svg` (pale embossed-paper texture with botanical
edges), rather than re-using the earlier couple illustration. Short
background-only gradients blend the original-art scene into the lavender
edges of adjacent sections, without affecting measured card geometry.

A new `#dressFlight` consists of independently drawn CSS wings, body and
antennae with 3D flapping. The earlier four-point scroll trajectory was a
**time/scroll confound**, not an exact representation of the source's behaviour.
A follow-up browser audit held Section 6 at a **fixed scroll position** while
sampling the reference every 500ms for seven seconds:

- At 390px, a left-to-right flight shifted from about X=-65px to X=140px
  (approximately 31px per second), with vertical bobbing and 3D wing rotation.
- At 320px, a later right-to-left pass shifted from about X=336px to X=250px
  over 3.5 seconds (approximately 25px per second).
- The live reference can start its flight at different delays, and some
  preliminary frames show an uninitialized wing at 0,0; they should never
  be treated as valid flight-path measurements.

The local butterfly now uses a **time-driven four-pass loop**,
rather than moving only with scrolling. It alternates direction and flight
height: lower-right to lower-left, upper-left to upper-right, upper-right to
upper-left, then lower-left to lower-right. The lower lane is calculated as
approximately 80px above the section bottom (around Y600–625 at the
measured phone widths). It has independent 3D-flapping wings and a responsive
scale. The paper retains its *separate* scroll-camera parallax. Reduced-motion
mode shows a stationary butterfly with no wing-flap animation.

Evidence: [source and local fixed-scroll telemetry](https://github.com/Arrjack8847/testing-4/actions/runs/41685387495).
The read-only script `tools/section6-flight-timeline.cjs` captures fixed-scroll
motion. The four-width comparator excludes reference placeholder frames and
is diagnostic, not a claim of pixel-identical animation.

The old vendor butterfly from an unrelated source pack has been removed.
Only the reference-hosted `paper.webp` may be loaded when the explicit
`?dressReference=1` comparison parameter is present. No vendor butterfly
image is bundled. `tests/section-six-dress.spec.mjs` covers original
paper, butterfly activity without scroll, and reduced-motion behaviour.

**Fidelity boundary:** The mechanics now follow the reference's autonomous
flight pattern, but the illustrated butterfly and paper art are original.
Their pixels and exact randomized source flight cycles are not identical
to the commercial reference.


## Path A — authorized real-WebP integration (4 November 2026)

**This section supersedes earlier statements about the original SVG and the
developer-only remote `?dressReference=1` paper mode.**

The user selected the rights-authorized source-artwork path. A read-only
Playwright source audit verified that the actual Dress Code scene uses exactly:

| Source artwork | Local path | Source dimensions |
| --- | --- | --- |
| Tasik Kayangan paper | `assets/section6/paper.webp` | 1080 × 1920 |
| Serambi Ungu butterfly spread | `assets/section6/bfly_1.webp` | 256 × 204 |

Both files have been downloaded, validated as RIFF/WebP, and committed
as actual **binary files** on
`feat/section6-dress-code-reference-20261103`. Their SHA-256 digests,
source URLs, and byte sizes are in `assets/section6/ASSET-SOURCES.json`.
The source-discovery script is `tools/section6-authorized-artwork-audit.cjs`
and the repeatable importer is `tools/import-section6-authorized-assets.py`.

### Runtime implementation

- The default Section 6 loads `./assets/section6/paper.webp` in the existing
  paper layer. Its section overlap, cover crop, and parallax remain calibrated.
- Both CSS 3D wings display **the same local `bfly_1.webp`** with
  `background-size: 200% 100%` and opposite background positions
  (left `0 0`, right `100% 0`), just as measured in the reference source.
- The prior CSS gradient butterfly art, thorax, antennae, floral placeholders
  and orbit are no longer used in the active Section 6.
- The visible cards, typography, colour circles, sizes, and reveal transitions
  are unchanged. The independent time-driven butterfly path remains an
  approximation of the live reference's varying flight cycles.
- **No external source image request is needed at runtime**, including
  `?dressReference=1`. The two WebPs are served by the project itself.

### Verification / limits

The test suite validates local asset HTTP 200, WebP magic header, 1080×1920
paper dimensions, 200%-split wings, responsive layout, and reduced motion.
A geometry match or loading test alone does not prove screenshot pixel parity,
especially the butterfly animation and section transitions.

Artwork reuse requires the rights represented by Path A. The files should not
be copied into other commercial projects unless those rights cover the reuse.
