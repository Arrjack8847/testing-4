# Phase 19 — safe release preparation

The approved Section 1 animation, camera sequence, scroll behavior and typography stay unchanged.

## Current status

**Not release ready.** The repository intentionally does not contain the 25 original reference WebP files; runtime can request imagery from the original vendor, including two butterfly images in `index.html`. This is fine for a development comparison but not a self-contained commercial invitation.

## Release checklist

1. Confirm written rights for all artwork and its commercial/public redistribution, **or replace it with independently created, licensed artwork**. Do not interpret technical test success as a license.
2. Replace all hotlinked provider images (including butterfly sprites) with local paths, preserving the existing sprite classes and animation positions. Update the asset manifest and loader mapping if necessary.
3. Ensure every image in `ASSET-MANIFEST.txt` exists under `assets/` and has a valid WebP header.
4. Run `python3 tools/check-release.py`. The script intentionally fails until the artwork is self-hosted. A pass confirms only technical asset coverage, not ownership.
5. Run `npm install`, `npx playwright install chromium firefox webkit`, `npm run test:mobile`, and `npm run test:crossbrowser`.
6. Test iPhone Safari and Android Chrome using `REAL-DEVICE-TESTING.md`. Resolve scrolling, animation jank, and loading issues before deploying.
7. After checks pass, deploy as a **static site**. Use `index.html` at the site root; no backend or build step is needed. Set standard HTTPS through the hosting provider and validate fallback/loading on the deployed URL.

Do not publish or copy original vendor WebPs into the public repo solely to satisfy this gate. It is safer to replace those assets with new original artwork if distribution rights are unclear.

## Commands

```powershell
git pull origin main
python tools/check-release.py
npm install
npx playwright install chromium firefox webkit
npm run test:mobile
npm run test:crossbrowser
```

The readiness checker does not deploy anything and does not change scene appearance.
