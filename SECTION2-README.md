# Section 2 — Invitation Letter

## Status and relationship to the reference

Section 2 replaces the former blank wedding-message preview after the 4dvh sticky lake scene in Section 1. It is a **new original companion design**, not a verified pixel-accurate recreation of the vendor's second section; its complete reference imagery and choreography were not available for reliable inspection.

The original Section 1 artwork, camera positions, butterfly timings, scroll restoration, handwritten names, and swipe mechanics were not changed.

## Visual design

- Mobile-first ivory wedding letter with an arched top and double gold frame.
- Lilac-to-parchment ambient transition from the lake scene.
- Self-contained CSS vines, glints and soft light; no additional borrowed artwork.
- Bismillah, invitation wording, Rayyan and Sofea, and date from the existing prototype. These are demonstration details, **not authenticated wedding data**.
- Ordinary selectable HTML text for accessibility and later localization.

## Scroll behavior

Section 1 remains sticky over its existing 4-viewport track. After the track, the invitation letter enters naturally. A small IntersectionObserver in `section-two.js` reveals its lines one time at 12% visibility, then disconnects. If JavaScript is unavailable, the content stays visible. With reduced motion enabled, all content appears without fades or movement.

The first-section "Swipe up" cue still scrolls into the middle of the first cinematic sequence, rather than skipping the wedding names or jumping immediately to Section 2.

## Files

- `index.html`: Second-section accessible semantic content and references to new style/script.
- `section-two.css`: Scoped styles; leaves the calibrated first-scene CSS unchanged.
- `section-two.js`: One-time reveal only.
- `tests/section-two.spec.mjs`: Four mobile viewport checks for reveal, layout and motion preferences.
- `tests/cross-browser.spec.mjs`: Added three-engine second-section check.

## QA

Run locally:

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Scroll past the completed first section. For browser checks:

```powershell
npm install
npx playwright install chromium firefox webkit
npm run test:syntax
npm run test:mobile
npm run test:crossbrowser
```

The new section still requires real phone testing and comparison with the live reference before calling it a match. It adds **no** new WebPs and does not change Phase 19's commercial artwork restrictions. The next section's event venue, time and RSVP remain out of scope until reliable content is provided.


## Section 2 QA — 2026-11-01

Verified in the repository's automated mobile suite:
- Four viewports: 320×568, 360×740, 390×844, and 430×932.
- CSS layout checks detect horizontal page overflow, clipped leaf text, and a frame exceeding the mobile width.
- Captured actual rendered viewport and full-letter screenshots at each size.
- [Passing mobile screenshot run](https://github.com/Arrjack8847/testing-4/actions/runs/41320475830) (artifact: `section-two-mobile-screenshots`).
- After visual inspection, the tiny Pinyon Script ampersand was changed to a clearer EB Garamond italic ampersand. This minor change is limited to `section-two.css`.
- The 25-scene-file source integrity check was repaired to exclude two optional skin butterfly assets; [source validation passed](https://github.com/Arrjack8847/testing-4/actions/runs/41320852847).

These are automated browser checks. No claim of exact visual matching to the inaccessible second scene of the commercial reference or of real-device iPhone/Android certification is made. The wedding details are still examples, and the original reference-provider artwork in Section 1 remains subject to public-use rights.
