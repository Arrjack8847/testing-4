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
