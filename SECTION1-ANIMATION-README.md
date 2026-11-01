# Section 1 — Reference animation timing audit

This file records the current **mobile-only Section 1** animation work for the Tasik Kayangan-inspired `testing-4` prototype.

## Reference evidence

The source invitation was inspected in a temporary 390 × 844 Playwright browser and compared directly with the current implementation, without importing reference code or artwork into this repository.

[Live reference audit workflow](https://github.com/Arrjack8847/testing-4/actions/runs/41336260604)

The artifact `section1-animation-timeline-evidence` contains 0.45H, 0.95H, 1.5H, 1.7H and 2.15H screenshots of both websites, as well as a JSON report for nine scroll checkpoints. It is intentionally short-lived. H refers to the mobile viewport height, not a time in seconds.

## Measured discrepancy and targeted fix

| Scroll position | Reference wedding-heading opacity | Earlier local opacity | New local target |
|---|---:|---:|---:|
| 1.35H | approximately 0% | approximately 14% | 0% |
| 1.50H | approximately 43% | approximately 93% | approximately 40% |
| 1.70H | 100% | 100% | 100% |

The reference samples are *rendered measurements at a specific moment*, not proof that the reference title is controlled only by scroll. The original can also animate with elapsed time. Accordingly, we calibrate the scroll-opacity curve rather than claiming to reproduce the source's underlying implementation.

In `scene.js` the greeting-opacity curve was changed to **1.37H–1.67H**. Existing camera retreats, flowers, peacocks, handwritten-name keyframes and Section 2 handoff geometry were preserved.

## Butterflies

The original reference showed visible butterfly candidates in the ceremonial garden by 1.5H. Our returning-garden butterfly layers existed and were correctly gated on opening, but their two **positive CSS animation delays** left both original flight routes initially invisible at that checkpoint.

We retained the two independent winged butterfly sprites and original flight routes, but initialized their hero animations with negative delays so they enter at a visible point on their respective paths. Cover butterflies and their five perch stops are untouched. CSS is still responsible for wing motion; JavaScript controls only the scene state.

The exact source butterfly routes can vary from visit to visit. The new check verifies a visible, moving butterfly rather than requiring deterministic coordinates.

## Regression coverage

`tests/section-one-motion.spec.mjs` checks:

- Wedding heading opacity at 1.35H, 1.50H and 1.70H
- At least one returning-garden butterfly visible when the greeting emerges
- Neither butterfly becoming visible before the ceremony reading state
- Reduced-motion hiding decorative butterflies without hiding the names
- No browser JavaScript errors

`.github/workflows/section1-2-visual.yml` now runs the Section 1 motion tests and the Section 2 reference-geometry tests in the 390px viewport and uploads real-motion screenshots. The standard four-phone and cross-browser suites continue to check broader functionality.

## Important limits

- The art and animation techniques are independent implementations calibrated from **observable rendered behavior**, not copies of the original animation source.
- Screenshot measurements do not guarantee identical motion timing on physical Android or iOS devices. Test on real phones before release.
- Source-party artwork, branded visuals and commercial use still require verified rights.
- Sections 3–6 are not part of this refinement.

## Local preview

```powershell
cd D:\testing-4
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Use a narrow mobile browser window. Tap **Open Invitation**; scroll through the garden to the title around 1.5 viewport heights. The mauve message begins at the three-viewport document boundary.
