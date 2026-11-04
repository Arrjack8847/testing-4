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
