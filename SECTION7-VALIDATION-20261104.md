# Section 7 — Tasik Kayangan reference method and validation

**Status:** QA instrumentation on an isolated branch, **not integration-ready / not pixel-perfect**.  
**Source:** https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en  
**Source-implementation branch:** `feat/section7-gallery-reference-20261103`  
**Validation branch (based on it):** `feat/section7-reference-validation-20261104`  
**Neighboring integration issue:** https://github.com/Arrjack8847/testing-4/issues/21

This document records measured source evidence, implemented behavior,
open differences and reproducible testing. All references to source artwork
mean *private comparison only*; rights are needed before copying or
publishing the files.

## Phase 1: Actual mobile reference

Earlier live-source Playwright audits measured Section 7 using real browser
computed styles at 390×844 and 320×568:

- [Photo-frame layout and CSS values](https://github.com/Arrjack8847/testing-4/actions/runs/41677514420)
- [Font and label details](https://github.com/Arrjack8847/testing-4/actions/runs/41678980077)
- [Scroll-reveal timing and reverse behavior](https://github.com/Arrjack8847/testing-4/actions/runs/41681301439)
- [Dress / Gallery / Gift boundaries](https://github.com/Arrjack8847/testing-4/actions/runs/41683117308)

The live Gallery contains `MOMENTS`, `Our Gallery`, five wedding
photograph frames (`TOGETHER`, `THE BRIDE`, `THE GROOM`,
`THE GARDEN`, `THE LAKE`) and `Tap a frame to view`.
Its photo assets are five **WebP** files referenced by the existing
permission-controlled `download-gallery-reference.ps1` workflow.
The current local preview does not include those bytes in Git.

The section itself uses a solid `#faf7fb` background with CSS frame
borders and shadows. The new four-size audit additionally records DOM
`<img>`, `<svg>`, `<canvas>` counts, CSS background-image layers,
asset paths, intrinsic image sizes, and section ordering. Its output is
the authoritative evidence for image-type/layer counts; do not assume
there is no SVG or canvas until that audit has succeeded.

## Phase 2: Layout and source artwork

| Detail | Measured 390px reference | Measured 320px reference |
|---|---|---|
| Section side padding | 28px | 28px |
| Section vertical padding | 96px | 96px |
| Kicker | 11px EB Garamond, 4.95px tracking | same |
| Title | 52px Pinyon Script, 59.8px line height | same |
| Body hint | 12px EB Garamond, 22px below frames | same |
| Background | `#faf7fb` | `#faf7fb` |
| Horizontal gap between top frames | 12px | 12px |
| Top-left Together | 161×246.9px | ~126×193.2px |
| Top-right Bride | 161×214.7px | ~126×168px |
| Centered Groom | 160×213.3px | ~125×166.7px |
| Full-width Garden and Lake | 334×249.4px | ~264×197.2px |
| Outer photo frame | 14px radius, 4px white border | same |
| Frame shadow | `0 14px 36px rgba(120,95,70,.2)` | same |
| Caption | 10px uppercase EB Garamond, 2.8px tracking | same |

Current implementation has Playwright geometry and CSS assertions.
**Exact photographs are missing** from GitHub, so a commercial/local
preview without authorized image copies is not a complete visual
replica. Local reference comparison may use the private, Git-ignored
`assets/gallery/reference/` files when rights permit. There is no
remote runtime hotlink in Gallery code.

## Phase 3: Motion reverse engineering

The source starts revealed elements at `translateY(52px) scale(.955)`.
Elements individually gain and lose an `in` class according to
visibility; reversing scroll resets their transitions. Frame delays
are 0/150/300/450/600ms. The heading uses a 150ms delay with
`1s ease` opacity plus `1.1s cubic-bezier(.22,.9,.24,1)` movement;
frame movement uses `1.1s ease`, with opacity becoming visible
immediately when the frame is entered.

Current Section 7 uses independently observed frames, reversible entry
flags, and a Reduced Motion override. It has passed earlier scroll
replay tests, but small frame-to-frame timing differences remain in
the source/local measured matrices. The new audit adds screenshots
at **entry, +1s, +3s, +5s, exit and return** at 390×844.

## Phase 4: Mobile and pixel comparison

The new validation workflow exercises **320×568, 360×740, 390×844
and 430×932**, plus isolated accessibility checks in Chromium,
Firefox and WebKit. It captures source/local screenshots at the
start, middle and end of Gallery at each width. Its
`section7-method-evidence/QA-REPORT.md` includes geometry
comparisons and `visual-comparison.json` includes a masked
**non-photo** pixel-difference diagnostic.

No numerical pixel-match percentage should be stated unless
five authorized original WebP photographs load in the local comparison
and corresponding reference frames. Even then, typography/rendering
and screenshots require actual review. Tests passing alone are NOT
visual equivalence.

Workflow: `.github/workflows/section7-method-verification.yml`.
Screenshots and measurements are kept for 7 days in GitHub Actions,
not committed to Git.

## Phase 5: Neighboring section boundaries (blocked outside this worker)

Measured reference order:

**Dress Code → Our Gallery → Wedding Gift → RSVP & Wishes**.

Reference Dress Code and Gallery share `#faf7fb`; the following
Wedding Gift band starts immediately with a plum
`#5c264f` layer and a source WebP background.
At 320 and 390px, source boundary gap = **0px**.

This Gallery branch currently follows Dress Code → Gallery → an
**RSVP preview**. Dress Code is also not yet guaranteed the same
solid paper color at its bottom. This is an integration blocker
tracked in [Issue #21](https://github.com/Arrjack8847/testing-4/issues/21).
Do not edit Section 6 or the current RSVP/Section 8 implementation
inside this Gallery validation branch.

The Gift worker should supply an original/licensed local illustration
and the integration worker should arrange all section IDs, links,
scroll cameras, CSS and tests. The current Gallery top/bottom
should stay `#faf7fb` with no extra margins.

## Phase 6: GitHub / draft review

This branch changes only Section 7 **QA tooling, workflow and this
documentation**. It is based on the existing Section 7 worker branch,
not an independent reimplementation of other workers' code.
The draft pull request targets the Gallery worker branch rather than
`main`. Do not merge until the visual artifact, source-art rights
and neighboring-section order are reviewed.

### Definition-of-done matrix

| Requirement | Current status |
|---|---|
| Correct labels / DOM content | Measured and implemented |
| Frame geometry / fonts / borders | Measured, automated assertions exist |
| Exact five photographic WebPs | **Blocked: authorized local files not supplied to repository** |
| Motion timing | Reconstructed, new 1/3/5-second comparison pending |
| Four mobile viewport QA | Previous run passed; new branch must rerun |
| Accessibility and reduced motion | Previous run passed; new branch must rerun |
| Neighbor entrance / exit | **Not finished: Wedding Gift missing after Gallery** |
| Pixel-perfect reference comparison | **Not established** |
| Source artifact screenshot evidence | New workflow captures it; inspect artifacts |
| Merge into main | **Not permitted yet** |

### How to test locally

```powershell
cd D:\testing-4
git fetch origin
git switch feat/section7-reference-validation-20261104
git pull --ff-only origin feat/section7-reference-validation-20261104
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

The ordinary `http://localhost:8000/` preview prefers locally present
reference WebPs *only on localhost*, otherwise uses licensed files or
placeholders. The strict reference-only QA mode is
`http://localhost:8000/?galleryReference=1`.
Never run the reference download script without appropriate permission.
