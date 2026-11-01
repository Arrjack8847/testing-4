# Celestial Lake — mobile wedding invitation prototype

## Current scope — Sections 1–6

**Current Section 1–2 focus (November 2026):** The reference-measured effective lake span is three mobile viewport heights. A 4H sticky containing block with -1H overlap keeps the full garden pinned while Section 2 rises over it at the 3H boundary, and the handwritten names exit independently after 2H; see [SECTION2-README.md](SECTION2-README.md). Sections 3–6 remain unchanged and are not the current fidelity target.

**Section 1** remains the calibrated interactive sticky lake opener with the existing camera choreography and ambient animation. **Section 2** now reconstructs the live reference's measured mauve invitation-message band with white typography, thin double rules and a scripture caption; see [SECTION2-README.md](SECTION2-README.md). **Section 3** adds a date, time and venue presentation with guarded directions; see [SECTION3-README.md](SECTION3-README.md). **Section 4** adds an original date-only countdown and confirmation-gated all-day calendar reminder; see [SECTION4-README.md](SECTION4-README.md). **Section 5** adds an original image-optional gallery with five local photo slots, a full-view photo dialog and no fictional people; see [SECTION5-README.md](SECTION5-README.md). **Section 6** adds an original accessible RSVP form with private, copyable previews only (no submission backend); see [SECTION6-README.md](SECTION6-README.md). Sections 2–6 are original companion scenes, not verified copies of later commercial-reference sections, and names/dates are demonstration details. Event time and venue are unconfirmed; RSVP submissions are not connected. Earlier phase notes below describe the historical Section 1-only scope.

The original first-section reference for this multi-section mobile prototype is [Undangan Kahwin's Celestial Lake](https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en).

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


### Phase 11 verification

- Mobile Chromium: **48/48 passed** at 320, 360, 390 and 430px. [Run](https://github.com/Arrjack8847/testing-4/actions/runs/41286746444)
- Live reference vs local: the two completed-name masks both reached `0% 0px` after holding the scroll, and both names remained legible. [Visual QA run](https://github.com/Arrjack8847/testing-4/actions/runs/41286797160)
- Mean absolute RGB pixel differences at 390×844 (lower is better): closed 22.48/255, opened 20.46/255, 0.45H scroll 32.22/255, restored garden 24.10/255, completed names 26.15/255. These are **not percent accuracy scores** and include commercial preview UI present only in the original screenshot.
- Vendor artwork remains externally referenced rather than publicly committed; verify public asset rights before production deployment.


## Phase 12 — subtler animated atmosphere

The remaining reference scene movement was audited against the original's decorative CSS. Individual stems, hanging blossoms and larger trees already use separate anchored rotation cycles and per-asset phase offsets. The reference also contains two important ambient effects that were not present in the prototype:

- **Waterfall mist:** three overlapping translucent clouds around each of the two waterfall outlets. Each cloud moves at a different slow rate (16, 21 and 26 seconds), while its parent remains fixed to the palace's natural coordinate system. The mist scales with the building during the opening camera push.
- **Peacock feather light:** a gentle periodic reflection sweeps across each still peacock. The reflection is clipped to the peacock WebP's own alpha silhouette, uses a soft-light blend and lasts 9 seconds. The artwork itself remains stationary.

Implementation details: these effects are additive DOM/CSS overlays, require no extra downloaded art, and use the actual resolved URL for the peacock source image (local if available, remote fallback otherwise). They are disabled or frozen under reduced-motion and developer freeze controls.

New mobile browser tests check 2 mist banks × 3 cloud layers, 2 independent peacock glints, mask availability, animation durations, opening behavior and reduced-motion/debug controls. The original cover/garden/lettering layouts are not repositioned in this pass.

**Limitation:** Although the effects match observed structure and broad timing, they are not certified pixel-perfect copies of every particle, mist displacement or reflection intensity.


## Phase 13 — garden-based butterfly flight

The live template uses **ButterflyGarden**, a procedural flight system rather than a fixed CSS timeline. Its publicly exposed animation configuration lists:

- Purple butterfly sprite: 52×41 CSS px, 2.2 wingbeats/second, glide factor 0.7, speed 0.12.
- Ivory butterfly sprite: 44×34 CSS px, 2.6 wingbeats/second, glide factor 0.6, speed 0.15.
- Five normalized perches: `(.45,.94)`, `(.56,.95)`, `(.50,.90)`, `(.07,.44)`, `(.93,.48)`.

A live-motion comparison confirmed the original flight can start from the lower-left and cross toward the bottom-center, differing substantially from our old upper-right-only crossing. Because its procedural path can differ between reloads, a single screenshot or recorded path is not an exact motion specification.

Our **original implementation** uses two responsive CSS timelines (24s and 22s) covering the documented perch areas, brief hovering arcs, low-left approach and an eventual upper-right departure. The wing animations now run at the species' expected frequencies (2.2Hz and 2.6Hz). These are independently authored approximations of the reference interaction; we have not copied its internal ButterflyGarden component.

The decorative flower sprites already use individually measured `--sa`, `--sd` and `--sl` parameters, with stem sway anchored at the bottom and hanging wisteria anchored at the top. Phase 13 adds regression checks for each asset's own duration and delay rather than introducing a global, synchronized flower animation.

The existing opening button, sticky lake, butterfly/flower state transitions, handwritten names, and reduced-motion controls remain unchanged. Automated checks cover normalized perch movement and individually timed floral sway on four mobile viewport sizes.


## Phase 14 — mobile animation performance and lifecycle

This update changes the *work performed* while the scene is invisible, not the approved artwork, camera framing or scroll choreography.

- The canvas still paints up to **30 times per second** while Section 1 is visible. It no longer requests animation frames while the tab/page is hidden, the first scene is off-screen, reduced motion is enabled, or developer freeze is active.
- A single `IntersectionObserver` tracks the sticky `#viewport`. Once less than **7.5% of the scene remains visible**, both the petal loop and decorative CSS animations pause. This handles phone heights where a 37–47px strip of the hero persists above the next section at maximum scroll. Returning to the garden resumes motion without restarting the invitation or changing scroll progress.
- `visibilitychange`, `pagehide`/`pageshow` and the reduced-motion media-query change event update the same centralized controller. No polling interval is used.
- The debug freeze toggle is observed as a **class change**, rather than running an endless idle `requestAnimationFrame` loop to check it.
- On resumption, delta-time counters are reset to prevent any large jump in petal positions.
- The existing 2× device-pixel-ratio cap is retained for canvas resolution; the artwork quality and number of petals are unchanged.
- Debug builds (`?debug=1`) expose a read-only `window.__scenePerf` diagnostic with `draws`, `pendingFrame`, `sceneVisible` and `ambient`. It is not exposed in the normal customer invitation.
- Real Chromium tests now exercise each pause/resume condition on 320px, 360px, 390px and 430px phones, including the active paint cadence.

**Verification scope:** These are real browser behavioral/paint-activity checks, not claims of a particular CPU percentage or battery-life saving on physical devices. The original image licensing and user-visible visual-comparison caveats remain unchanged.


### Phase 14 validation results

- Full real mobile Chromium suite: **84/84 passed** across 320px, 360px, 390px and 430px devices, including lifecycle suspension, debug freeze, reduced-motion toggling and return-from-offscreen resume. [Passing run](https://github.com/Arrjack8847/testing-4/actions/runs/41289606498)
- Latest source checks: [passed](https://github.com/Arrjack8847/testing-4/actions/runs/41289606504)
- Five-stage 390×844 screenshot parity workflow: [passed](https://github.com/Arrjack8847/testing-4/actions/runs/41289581606). Measured full-frame mean RGB differences (0–255): closed 22.52, opened 20.61, mid-scroll 32.23, restored garden 23.57, written text 26.75. These are not visual-accuracy percentages.
- These tests prove frame **suspension**, not a specific FPS improvement or measured energy saving on physical devices.


## Phase 15 — resilient artwork loading and phone QA

This pass fixes two genuine broken-image paths and improves Windows local testing:

- The layered garden is now used when **all animated components load**, even if the separately flattened `scene.webp` fails. The original master file is no longer incorrectly required for the moving scene.
- If an individual animated component fails but `scene.webp` loaded, the page falls back to the original still picture with a short explanatory message.
- If neither source can load, visitors still see a readable gradient-backed invitation with a working **Open Invitation** button, rather than a broken or empty view.
- Both Windows scripts read `ASSET-MANIFEST.txt`, check **all 25 WebP files**, verify their RIFF/WEBP signatures, and replace invalid downloads atomically. Already valid files are reused.
- Source CI checks consistency against the manifest and parses both PowerShell scripts; mobile browser tests deliberately abort image requests to verify all three fallback modes.
- See [REAL-DEVICE-TESTING.md](REAL-DEVICE-TESTING.md) for the same-Wi-Fi iPhone/Android testing procedure, accessibility checks and performance observations.

These improvements do not redistribute or bundle the source artwork, and do not change the approved normal opening or scroll choreography.


## Phase 16 — actual-phone test preparation

Open the same local preview on an iPhone or Android device using **`http://<PC-IPv4>:8000/?phoneqa=1`** after starting `start.ps1` on the Windows PC. The device must share the same private Wi-Fi network.

An opt-in **Phone QA** panel now offers:
- Real browser viewport, pixel ratio, orientation, image-loading state, scene state, reduced motion, near-offscreen animation state and horizontal overflow diagnostics.
- A five-second local performance sample (browser animation-frame callback rate, actual falling-petal canvas draw rate, and long-task count when the browser supports that API).
- Five manually checked real-device interaction checks, free-text notes, and a copyable report. On browsers that block clipboard access over local-network HTTP, the report appears as selectable text.
- Privacy: No analytics, tracking server or automatic result upload. The report stays in the tester's browser unless intentionally copied.

The QA script is dynamically loaded **only** when `?phoneqa=1` is present. Normal guest invitations do not load the panel or its instrumentation. The browser automation covers panel tap targets, local report generation, screenshot-safe layout, rotation-size handling and sampling across the four existing phone viewport sizes.

**Important:** This completes the real-device *testing preparation*, not an actual physical-device certification. The owner must open the local URL on a phone and perform the checks described in [REAL-DEVICE-TESTING.md](REAL-DEVICE-TESTING.md). The five-second sample is an observation, not proof of thermal stability or battery life.


### Phase 16 automated verification

- **116/116** mobile Chromium tests passed on 320px, 360px, 390px and 430px viewport simulations, including on-device QA panel touch targets, copyable report, orientation-size handling, and a real five-second frame/petal-paint sample. [Browser test run](https://github.com/Arrjack8847/testing-4/actions/runs/41291137868).
- JavaScript/PowerShell syntax and source integrity passed. [Source check](https://github.com/Arrjack8847/testing-4/actions/runs/41291137906).
- The regular invitation no longer loads the QA widget unless `?phoneqa=1` is explicitly requested. The tests confirm this.
- **Not yet completed:** real Safari on a physical iPhone, Chrome on a physical Android device, thermal/battery observations, and direct touch smoothness observations. These require the owner to perform the test on their phone using the opt-in URL.


## Phase 17 — mobile visual calibration against the live lake

This phase reviews the real reference and local site at seven 390×844 scroll checkpoints, keeping the interactive Section 1 behavior intact. The largest mismatch was the **first 0.45 viewport of scrolling**: the original moved the palace and palm-tree backdrop farther away, while the prototype left the scenery almost unchanged.

Implemented:
- The palace camera retreat now starts at **0.22H** and completes around **0.72H**, instead of being delayed until the garden return after 0.52H.
- The sky/canopy background also starts retreating around **0.22H**, closer to the reference's early scene change.
- The temporary foreground reeds remain visible just after opening and retreat before **0.40H**, instead of disappearing instantly.
- The tall border flowers return earlier, so the side plants are visible by **0.75H**, rather than remaining almost completely below the screen.
- Full mobile-browser tests verify camera scales and the visibility progression; decorative peacocks, butterfly flights, handwriting and existing accessibility remain separate.

The visual comparison now captures **closed, opened, early (0.25H), mid-scroll (0.45H), retreated (0.75H), restored (1.50H), and written** states. In addition to whole-screen RGB MAE, it reports a central **art-only** region (x=20–370, y=100–690), excluding most of the original vendor's shopping and navigation overlays. This central-region error is *not* a visual accuracy percentage.

Before the additional reed/flower refinements, the 0.45H full-frame difference improved from approximately **32.2/255 to 25.7/255** in the same comparison method. The original garden's dynamic petals and butterflies make individual-frame pixel comparisons approximate rather than deterministic.

This remains a development prototype using remotely sourced reference artwork. Do not deploy commercially without suitable rights to the art and a final real-device test.


### Phase 17 verification

- **124/124** mobile Chromium tests passed across 320px, 360px, 390px and 430px, including camera retreat, early reeds, border-flower return, handwriting, reduced motion and performance lifecycle. [Passing run](https://github.com/Arrjack8847/testing-4/actions/runs/41292963972).
- Seven-stage screenshot comparison succeeded. [Visual comparison run](https://github.com/Arrjack8847/testing-4/actions/runs/41292594122).
- At the previously mismatched 0.45H point, the full-frame RGB mean absolute difference decreased from approximately **32.2/255 before this phase to 25.7/255 after camera correction**. Scores fluctuate slightly with procedurally animated petals and butterflies.
- The reference site's own navigation and purchasing overlays are intentionally not included in the invitation. The comparison also includes a vendor-UI-excluding central art region to avoid confusing UI differences with artwork positioning.
- The former two intermittently failing scroll assertions were changed to wait for the `requestAnimationFrame`-applied CSS state and passed cleanly on the final run.
- Final visual parity is still approximate, and testing on a physical phone remains required before production use.


## Phase 18 — cross-browser accessibility and performance QA

A separate `npm run test:crossbrowser` command checks **Chromium, Firefox and WebKit** at a 390×844 viewport without weakening the previous multi-viewport Chromium regression tests. [Detailed QA matrix](PHASE18-QA.md).

The new suite found and fixed a real accessibility defect: `inert` by itself did not reliably remove the unopened section's Swipe Up link from the browser accessibility role queries. The cover and opened section now synchronize both `inert` and explicit `aria-hidden` states. Keyboard activation of **Open Invitation** also moves focus onto the newly revealed Swipe Up link so the focused button is not lost.

Seven checks per engine cover accessible headings and landmark semantics, keyboard/focus behavior, opening and staged garden scroll, reduced-motion content, 44×44 CSS px touch targets, horizontal overflow, canvas resolution caps, and enlarged-text usability.

- [Phase 18 three-engine workflow](https://github.com/Arrjack8847/testing-4/actions/workflows/crossbrowser-a11y.yml)
- [Latest passing 21-test run](https://github.com/Arrjack8847/testing-4/actions/runs/41303729880)
- [Original mobile regression suite](https://github.com/Arrjack8847/testing-4/actions/workflows/mobile-browser.yml)

**Limits:** Linux Playwright WebKit is not physical iPhone Safari; Firefox is tested in a narrow browser viewport rather than Playwright's unsupported Firefox `isMobile` mode. Actual VoiceOver/TalkBack, battery drain, network latency and artwork licensing have not been certified.
