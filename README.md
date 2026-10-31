# Celestial Lake — mobile opening scene

Mobile-first recreation of the **first section only** of [Undangan Kahwin's Celestial Lake](https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en).

This project uses the 25 original WebP filenames and a layered HTML/CSS/JavaScript scene. Artwork reuse was reported as authorized by the project owner. Original CSS/JS was **not** supplied, so animation timings and some element positions are recreations, not a pixel-verified 1:1 extraction.

## Run locally (Windows)

1. Clone or download this repository.
2. Open PowerShell in the repository folder.
3. Run `powershell -ExecutionPolicy Bypass -File .\start.ps1`.
4. Open `http://localhost:8000`.

The startup script downloads missing original WebP artwork into `assets/` and launches a Python static web server. Use `?debug=1` to compare the master artwork with the individually animated layers.

## Repository artwork

An optional GitHub Actions workflow (`Sync original artwork`) retrieves the 25 WebP images, validates that each is a WebP file, and commits them to `assets/`. This allows the page to be hosted without third-party hotlink dependencies. Download only where reuse and redistribution rights apply. If the workflow is unavailable, run `download-assets.ps1` and commit `assets/` manually.

## Scope and quality gates

- 320–430px phone widths; portrait safe-area and reduced-motion support.
- Closed cover, opening button, animated lake scene, greeting, swipe cue.
- Layer placement and animation are **approximations pending real-device side-by-side comparison**.
- Do not consider later invitation sections or pixel-perfect timing complete.
- Open `?debug=1` for master/layers/blend comparison and motion freezing.

## Asset folder

All URLs are mapped from:
`https://undangankahwin.com/images/concierge/packs/tasik-kayangan/`

See `ASSET-MANIFEST.txt` for the full list.
