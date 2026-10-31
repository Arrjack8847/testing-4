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
