# Section 7 — Integrated Gallery Handoff (2026-11-04)

## Integrated into the current site without replacing other workers' sections

This branch was created from main commit `58b3b7662df6cbf3b5a35109d9246451476011fe` and changes **only** the Gallery section markup in `index.html`; existing Dress Code, Wedding Gift, RSVP, and Closing sections remain untouched.

- Gallery heading: "Our Gallery" and "Moments" label.
- Five photo positions: Together, The Bride, The Groom, The Garden, The Lake.
- Dedicated, clipped sticky `assets/scene.webp` image inside Gallery, with the measured `#faf7fb` wash at 10% opacity.
- Five original WebP photos are recognized **only** in localhost QA; the public build displays customer-supplied licensed photos or explicit placeholders.
- Focused Gallery keyboard, click, modal, four-phone, and scene-layer tests.
- `Gallery → Wedding Gift → RSVP → Closing` retained from current main.
- Locally downloaded reference artwork and screenshots are excluded from Git.

### Quantitative status (live reference vs isolated temporary exact-art comparison)

[Passed exact-art audit](https://github.com/Arrjack8847/testing-4/actions/runs/41769248437) measured all five frame widths/heights equal within browser fractional-pixel error at 320, 360, 390, 430px; Gallery heights differ by no more than ~0.11px *after* source opening and all images settle. The six reference WebPs were temporarily downloaded to the test runner and removed before artifact upload.

**Not pixel-perfect yet:** the overall screenshot still differs because source contains fixed navigation/music/petals and the current site may have different section-to-section scenery; opening photo viewer appearance also needs separate source-vs-local validation. Photo pixels often align closely for frames, but broad screenshot error remains. This integration is **functional**, not final commercial release readiness.

### Local preview (keep user Windows merged worktree unchanged)

```powershell
cd D:\testing-4
git fetch origin
git worktree add --detach D:\testing-4-main-preview origin/main
Copy-Item "D:\testing-4-section7\assets\*.webp" "D:\testing-4-main-preview\assets\" -Force
New-Item -ItemType Directory -Force D:\testing-4-main-preview\assets\gallery\reference | Out-Null
Copy-Item "D:\testing-4-section7\assets\gallery\reference\*.webp" "D:\testing-4-main-preview\assets\gallery\reference\" -Force
cd D:\testing-4-main-preview
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Use `http://localhost:8000/` and scroll to Our Gallery; local reference assets auto-load. This avoids disturbing unfinished merges in the original `D:\testing-4` folder.

### Next isolated steps

1. Compare opened lightbox photo viewer at all phone widths against the source.
2. Integrate shared fixed music/nav/petal overlays once, not in each worker section.
3. Inspect Dress Code → Gallery and Gallery → Wedding Gift seams with the current main sections.
4. Keep third-party artwork local; use the user-owned/authorized photo set in any commercial build.


## Viewer parity continuation — 2026-11-04

**Integration state:** The Gallery base (five photo positions, source-matched grid, separate sticky `scene.webp`, and `Gallery → Wedding Gift → RSVP → Closing` document order) was already merged to `main` in PR #37. These lightbox corrections are isolated in [draft PR #52](https://github.com/Arrjack8847/testing-4/pull/52), branch `fix/section7-lightbox-reference-parity-20261104`. Do not copy changes from older section branches into `main` wholesale.

### Source-measured lightbox details

Read-only source audits: [viewer interaction and 320/390 layout](https://github.com/Arrjack8847/testing-4/actions/runs/41778591134), [five-photo numeric artifact](https://github.com/Arrjack8847/testing-4/actions/runs/41787968236). The second run failed at 320px **after opening the photo**, because the reference site's top fixed language control intercepts the lightbox close button, but the 390px per-photo measurements were saved.

| Element | Observed 390 × 844 reference |
| --- | --- |
| Full-screen overlay | `rgba(50,42,34,.9)` |
| Portrait photo frame (Together/Bride/Groom) | x28, y199.33, 334 × 445.33px |
| Landscape frame (Garden/Lake) | x28, y297.28, 334 × 249.44px |
| Internal photo region (portrait / landscape) | 322 × 433.33 / 322 × 237.44px |
| All photo frames | 6px white border; 16px corners; `0 40px 100px rgba(0,0,0,.5)` shadow; cover crop |
| Close control | x326, y22, 42 × 42px, circular, 1px white border, translucent white fill |
| Viewer caption or arrows | No visible navigation/counter/caption |

Three reference photographs are 820×1098; two are 1000×747. The source overlay does not dismiss with Escape in the audited browser, but our native dialog intentionally supports Escape and restores keyboard focus for accessibility. We also retain keyboard arrow and touch-swipe photo navigation, without visible controls. The source's **fixed header overlaps close at 320px**, an issue we intentionally do not reproduce.

### Local implementation and test scope

PR #52 changes only the Gallery close glyph in `index.html`, Gallery CSS/JS, and Gallery-focused Playwright tests. The photo viewer switches to `data-gallery-orientation="landscape"` when showing Garden/Lake, and to `"portrait"` otherwise, including when navigating with arrow keys/swipes. Tapping the shaded overlay dismisses the dialog; tapping the photograph does not.

A **synthetic-data Chromium fixture** was independently exercised in the working container at 320×568, 360×740, 390×844 and 430×932 (portrait, Garden and Lake = 12 combinations). All 12 geometry/close/focus tests passed. It was deliberately not the complete website and used self-created diagrammatic artwork, not the copyrighted source photos. The full-site Playwright suites, including the four-project `tests/section-seven-lightbox.spec.mjs` plus `tests/section-five.spec.mjs`, still require GitHub Actions runner execution.

Review the current full-site runs:
- [Focused Gallery QA](https://github.com/Arrjack8847/testing-4/actions/workflows/section7-main-integration.yml)
- [Mobile browser smoke QA](https://github.com/Arrjack8847/testing-4/actions/workflows/mobile-browser.yml)
- [Corrected read-only source five-photo audit](https://github.com/Arrjack8847/testing-4/actions/runs/41790522639)

### Asset permission and shared-shell boundaries

The source Gallery photography is **not committed or redistributed**; `assets/gallery/reference/moody*.webp` is supported only as local, permission-controlled QA. Ordinary `http://localhost:8000/` automatically uses locally available reference photos for comparison, otherwise locally provided licensed `assets/gallery/photo-01.webp`–`photo-05.webp`, otherwise explicit placeholders. No `?galleryReference=1` query is required for ordinary local preview. Published builds do not load source photography.

Global floating petals, music disc, fixed navigation, top preview shell and progress rail are **integration-worker responsibilities** shared across many sections. The Section 7 worker must not duplicate them.

**Do not call this section pixel-perfect:** source photo licensing and complete, timed four-phone visual comparisons remain unverified. Do not merge PR #52 until CI has completed and outstanding cross-section checks are reviewed.
