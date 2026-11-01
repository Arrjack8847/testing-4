# Celestial Lake — mobile opening scene

Mobile-first recreation of the **first section only** of [Undangan Kahwin's Celestial Lake](https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en).

This repository uses the reference's 25 unique WebP asset filenames and a layered HTML/CSS/JavaScript scene. The project owner reported permission to use the artwork on their website. The reference's original CSS and JavaScript were **not** available, so layer coordinates and animation timings are approximations, not a pixel-verified 1:1 reproduction.

## Run locally (Windows)

1. Clone or download this repository.
2. Open PowerShell in the project folder.
3. Run `powershell -ExecutionPolicy Bypass -File .\start.ps1`.
4. Open `http://localhost:8000` in your browser.

The script downloads missing reference artwork to `assets/` and starts a Python static server on port 8000. To compare the full master image against the individually animated layers, visit `http://localhost:8000/?debug=1`.

## Artwork hosting

**The 25 original WebP images are not yet committed to this public repository.** The browser tries `assets/` first, then the original reference host as a fallback. For a reliable public deployment, self-host the images after confirming the permission covers **public redistribution**.

A manual, opt-in GitHub Actions workflow is included:

1. Open the repository's **Actions** tab.
2. Select **Sync original artwork (manual)**.
3. Choose **Run workflow**.
4. Tick the confirmation only if you have permission to distribute the reference artwork publicly through this repository.

That workflow downloads and validates the 25 images, then commits them to `assets/`. It does not run automatically. Alternatively, run `download-assets.ps1` locally. See `ASSET-MANIFEST.txt` for filenames.

## Scope and validation

- Mobile portrait layout, designed for 320–430 CSS pixel widths.
- Closed cover, Open Invitation button, independently layered wisteria/trees/flowers/peacocks, greeting and swipe cue.
- `?debug=1` includes master/layers/blend comparison and animation freeze.
- Prefers-reduced-motion support and iPhone safe-area padding.
- GitHub Actions automatically checks JavaScript syntax and verifies the 25 artwork mappings.
- **Not verified:** exact real-reference font, CSS geometry, movement curves, interactive mobile screenshots.
- **Not built:** later invitation sections. The scrollable message is a temporary functional continuation.

The next stage is side-by-side mobile QA at 360px, 390px, and 430px and a pixel-level alignment pass before proceeding beyond the first section.


## Measured original asset geometry (Phase 4)

Source dimensions and alpha bounding boxes were measured by `tools/analyze-reference.py`, using actual original WebPs, not guessed from the page.

| Image | Source dimensions | Rendering rule |
|---|---|---|
| `scene.webp` | 1080 × 1920 | Full-bleed original composition |
| `sky.webp` | 1080 × 1920 | Full-canvas background |
| `arch.webp` | 1080 × 1920 | Full-canvas alpha overlay |
| `tree_l.webp`, `tree_r.webp` | 1080 × 1920 each | Source canvases are full-height, but the reference **renders each at 70% viewport height** |
| `reeds.webp`, `drape.webp` | 1080 × 1920 each | Full-canvas overlays; preserve transparent margin |
| `palace.webp` | 1920 × 1920 | Separately aligned, not yet pixel-verified |
| `peacock.webp` | 741 × 1401 | Separately positioned and mirrored, not yet pixel-verified |

The later Phase 5 CSS correction uses **measured live DOM geometry**, superseding the earlier full-canvas-tree rendering assumption. The source dimensions remain unchanged. Some camera-motion microtimings and later sections still require visual comparison.

### Browser testing

GitHub Actions automatically runs a real Chromium mobile smoke-test suite at **320 × 568, 360 × 740, 390 × 844 and 430 × 932**. It checks original image loading, full-canvas tree alignment, the opening interaction, vertical scrolling, developer comparison modes, and resetting after scroll. Reference assets are downloaded **temporarily within the runner**, not committed or distributed.

Locally, with Node.js and Python installed, run:

```sh
npm install
npx playwright install chromium
npm run test:mobile
```

A separate live-reference measurement script, `tools/measure-live-reference.mjs`, inspects the original at 390 × 844 to record actual DOM rectangles and opening state. Output is captured in the **Measure live mobile reference** GitHub Actions logs.

## Phase 5 — live reference geometry (390 × 844 viewport)

Measured in the original website using headless mobile Chromium and extracted reference opening-scene metadata.

| Reference item | Live bounds / settings |
|---|---|
| Art frame | x=-42.4, y=0, width=474.8, height=844 |
| Opening button | x=84.7, y=422.2, width=220.6, height=49.1 |
| Left tree | approximately x=-156, y=219, width=334, height=592 |
| Right tree | approximately x=261, y=217, width=337, height=593 |
| Peacocks (before opening) | width=178.5, height=337.6, top=523.3 |
| Palace (before opening) | square 557 × 557, bottom aligned |
| Palace (after opening) | approximately 836 × 836, bottom aligned |
| Opening camera push | approximately 1.7 seconds |
| Text / button family | EB Garamond; large ornamental script monogram |

Changes on `main`:
- The **animated layered garden is displayed from the start**, rather than requiring a button click.
- 28 decorative sprite placements and individual animation durations are mapped from the live page's own cover metadata, including the hanging strands, plant clusters and two peacocks.
- The opening transition zooms into the valley and removes the foreground arch/trees.
- The first mobile screen now uses a measured closed-cover button placement.
- Automated mobile tests check measured bounds and interaction behavior.

The geometry numbers come from the live reference, but do not themselves constitute proof of pixel-perfect screenshots. Actual visual comparison is still a separate gate.


## Phase 5 screenshot QA — 390 × 844

A GitHub Actions visual-comparison job captured the reference and this implementation at the same mobile viewport, both before and after tapping the button. It produces separate screenshots, difference maps, and a downloadable comparison artifact.

Reference comparison run: https://github.com/Arrjack8847/testing-4/actions/runs/41253538422

| Scene | Overall mean absolute RGB difference (0–255) | Content between y=105 and y=640 |
|---|---:|---:|
| Closed cover | 24.70 | 20.10 |
| Just after Open Invitation | 21.80 | 11.12 |

The reference website's catalogue/navigation header, WhatsApp, order controls, and footer navigation appear in the **reference screenshot** but are **vendor preview UI**, not part of the customer's wedding invitation. We intentionally do not clone those vendor controls. This explains part of the measured difference.

Visual QA observations:
- The central palace artwork aligns closely; template matching indicates zero whole-pixel shift for the central building.
- The closed cover shows the original living garden immediately, with the paired ornamental monogram, title, names, rule, and pill button.
- After opening, the valley fills the screen and the foreground peacocks retreat; text waits for scrolling.
- The exact nonessential decorative petal positions and the remaining subpixel typography and dynamic animation curves are **not certified pixel-identical**.

### Latest automated validation

The latest four-viewport browser smoke test run passed at:
https://github.com/Arrjack8847/testing-4/actions/runs/41253568370


## Phase 6 — continuous living-scene details

Added to the existing mobile-first opening scene:

- 16 deterministic, low-density falling petals using the reference's documented pastel/purple palette. A single overlay canvas is capped at 30 frames per second and a device pixel ratio of 2.
- Two CSS-animated distant birds with individual crossing times (15s and 18s) and gently flapping wings.
- Two independently streaming waterfalls placed at the documented original palace-image coordinates (16% and 65.5% left; 64% down), with secondary flow and mist.
- A refined ornamental 'Alex Brush' monogram using the reference's 1.08 scale, -0.42em overlap and 0.3em second-initial drop.
- Reduced-motion support: the decorative canvas and birds disappear, waterfall stream animation stops, but the invitation button and scrolling remain usable.

The original artwork itself has not been added to the GitHub repo. The project still downloads original assets temporarily when testing and can self-host them only when distribution rights cover publishing.

### QA for this stage

The browser smoke-test suite now has **20 tests across four mobile sizes** (320, 360, 390 and 430px). It checks artwork geometry, button position, cover/scroll/reset, individual waterfalls, particle canvas, bird elements and reduced-motion behavior.

Latest passing test: https://github.com/Arrjack8847/testing-4/actions/runs/41254302741

Screenshot matching remains an ongoing visual QA check, not a claim of pixel-perfect fidelity; the reference vendor's purchase/menu UI is intentionally excluded.


## Phase 7 — living butterflies and sticky scroll

The reference's first section has **two paired-wing butterflies on the cover**, and two additional butterfly elements in the opened hero. Their source files are used as remote CSS background images (not bundled or committed):

- `/images/concierge/packs/serambi-ungu/bfly_1.webp` (52 × 41 CSS pixels).
- `/images/concierge/packs/anggerik-nirmala/bfly_white.webp` (44 × 34 CSS pixels).

Live 390 × 844 inspection of the reference found the first purple butterfly visible around 2.5 seconds (approximately x=227, y=-40, including its rotation), later near x=162, y=110 at 4.5 seconds, with the white butterfly near x=340, y=104. The current CSS approximates that trajectory with 3D wing folding and two staggered flights. **Exact motion curves remain an approximation**, not recovered source animation code.

Butterflies pause while their scene is hidden, and disappear under the reduced-motion preference. The opened hero's butterflies begin only after scrolling.

**Important scroll correction:** the live reference's lake hero remains `position: sticky` at top=0 when users scroll down 127, 295, 549 and 802 pixels on a 390 × 844 phone. Our prior first section scrolled off-screen. The new `.scene-scroll-track` fixes this, pinning the lake for a full viewport of scrolling and releasing it smoothly into the temporary next section. The welcome text can appear while the lake remains visible.

Browser tests cover the phone widths 320/360/390/430px, the two butterfly states, reduced motion, and sticky scroll behavior. The commercial preview overlays on the source website are not replicated.

The original butterfly assets come from **other packs referenced by the template**, so confirm the artwork license extends to those assets before public redistribution. All referenced artwork currently remains hosted at the source.


## Phase 8 — progressive scroll reveal

A failed Phase 7 browser test was traced to a test-harness error (`document` was referenced in Node rather than inside `page.evaluate`), not a demonstrated runtime scroll failure. The assertion was fixed.

Reference measurements confirm the original hero remains at screen y=0 while the guest scrolls the first ~802px of a 390×844 mobile viewport. This revision preserves the 200dvh sticky scene track and makes scroll behavior more faithful:

- **Removed the erroneous scroll-driven movement of the entire background.** Camera motion still happens on the opening action; scroll motion no longer pulls the landscape out of position.
- **Progressive greeting:** after roughly 12% of viewport scroll, the greeting opacity interpolates to fully visible by roughly 47% of viewport scroll. This is an implementation calibration, not a recovered vendor timing curve.
- **Swipe Up** smoothly advances within the pinned first scene to reveal the greeting; it no longer skips directly to the temporary next-section placeholder.
- Reduced-motion users receive the same content without decorative motion; the text remains accessible.
- The mobile Chromium suite checks mid-scroll opacity, sticky top position, next-section release and the tap behavior of Swipe Up.
- The visual comparison workflow now captures **closed**, **opened**, and **45%-scrolled** states at 390×844, with differences saved as GitHub Actions artifacts.

This remains Section 1 development only. The `#message` continuation is deliberately a placeholder, not a claim that Section 2 is complete.


## Phase 9 — reference-calibrated garden return during scrolling

**Critical visual finding:** The live Tasik Kayangan hero does not simply reveal the wedding names over the bare lake. The opened screen initially remains a quiet valley. The foreground flowers and ceremonial frame then return as the guest scrolls, followed by the text. Reference frames captured at 390 × 844:

| Scrolled viewport height | Live reference state |
|---|---|
| 0–0.45H | Bare lake and distant palace; no overlay heading |
| 0.75H | Side floral plants return |
| 0.95H | Wisteria strands begin returning, palace appears smaller |
| 1.15H | Decorative arch and peacocks progressively re-enter |
| 1.50H | Arch fully frames lake, peacocks restored, small "The Wedding of" begins |
| 1.70–1.90H | Heading becomes visible and names begin to appear |
| 2.15H onward | Heading/content travel upward while lake hero stays pinned |

Revisions:
- Replaced the premature 12–47% scroll text fade with seven coordinated `requestAnimationFrame`-driven CSS variable transitions controlling sky, palace, arch, trees, canopy, decorative blossoms, peacocks and typography.
- The garden returns across approximately 0.52–1.44 viewport heights. Greeting begins around 1.37H; names follow after 1.68H.
- Temporary `scene-scroll-track` extended to **4 viewport heights**, keeping scenery sticky for the staged reveal and leaving the existing next-section placeholder reachable. This is a Phase 1 interaction scaffold, not a verified measurement of the original full-page length.
- Text begins traveling vertically upward after 2.0H without moving the lake.
- Original waterfall, birds, petals, butterfly, reduced-motion and debug behavior remain included.
- Swipe Up takes guests along the same scene to the staged heading without jumping past Section 1.
- The visual QA workflow now compares four states: cover, just opened, 0.45H mid-scroll and 1.50H restored frame.

The exact proprietary animation curves remain independently approximated; these checkpoints are grounded in the reference screenshots and browser inspections.


## Phase 10 — measured ceremonial names (390 × 844)

The first mobile scene's text was measured on the original live site after opening at 1.3–2.3 viewport heights of scroll. This supersedes the earlier estimated serif-only name heading.

| Element | Reference DOM box | Computed type |
|---|---|---|
| The Wedding of | x=74, y=253, 242×36px | EB Garamond, 22px, letter spacing 2.2px |
| Names group | x=28, y=289, 334×174px | Pinyon Script, 60px |
| Rayyan | x=84, y=269, 222×96px | Pinyon Script, 60px |
| Ampersand | x=102, y=356, 186×41px | Pinyon Script, 36px |
| Sofea | x=84, y=378, 222×96px | Pinyon Script, 60px |

Implementation:
- Loads the actual **Pinyon Script** font rather than rendering wedding names in EB Garamond or Alex Brush.
- Preserves accessible HTML text, with the first name, ampersand and second name revealed independently in the existing scroll sequence.
- Uses vendor-measured element positions but independently implemented CSS clip paths; these are not extracted proprietary animation frames.
- Uses direct percentage clip values for broader browser compatibility.
- The opening monogram still uses Alex Brush, as separately observed in the reference's cover.
- Tests check 390px text geometry, progress values, clipping and the existing four-viewport interactions.

The reference's hand-drawn line-level reveal effect is approximated with progressive horizontal clipping; it is not claimed to match individual stroke paths.


## Phase 11 — timed, soft-mask script writing

The live original's name-writing CSS confirms a moving, feathered gradient mask rather than hard clipping. Its first name uses a 1.5-second writing animation after an initial short delay, followed by the smaller ampersand and a later second-name animation.

This implementation now uses an independently coded equivalent:

- When the restored garden reaches the ceremonial title (approximately **1.29 viewport heights**), the names start a **one-time writing animation**.
- The first name reveals through a soft gradient mask in 1.5 seconds after a 0.35-second delay.
- The ampersand rises into view with its own 0.8-second transition after 1.05 seconds.
- The second name begins its 1.5-second reveal 1.45 seconds after activation.
- The writing continues **even if scrolling stops**, instead of being tied directly to the scroll position, and Reset re-arms it.
- Both script names remain accessible/selectable HTML, using measured Pinyon Script rather than rasterized artwork.
- With reduced-motion enabled, names appear without animated writing once the guest reaches that part of the invitation.
- Browser checks cover startup, mask state, durations, staggered reveal, stationary scroll, and replay after reset.
- Visual comparison now includes a **completed-lettering** frame in addition to the closed, opened, mid-scroll and restored-garden screenshots.

**Accuracy note:** The effect uses a soft left-to-right moving mask. It is not a vector pen physically tracing every character's individual strokes; that would require glyph-specific stroke paths and separate artwork.
