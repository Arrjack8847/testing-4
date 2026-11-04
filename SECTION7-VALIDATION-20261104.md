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

## Captured four-viewport findings (Actions run 41696827091)

The read-only source/local audit **successfully captured** 320, 360, 390
and 430px screenshots, including the full motion timeline, even though
the subsequent PNG-comparison step failed due an off-screen image-mask
bounds bug (fixed in the next commit). Its QA report says:

| Width | Source-vs-local frame geometry within 1px | Source photos loaded | Local original photos loaded |
|---|---|---|---|
| 320 | 5/5 | yes | no |
| 360 | 5/5 | yes | no |
| 390 | 5/5 | yes | no |
| 430 | 5/5 | yes | no |

At 390px, the source Gallery frame x/width/height matches the previously
recorded layout; all 5 local frames were within a 1px geometry tolerance.
The **reference photographs were present**, but none were present in
the GitHub Actions local checkout.

**Actual source image inventory, verified through the browser:**

- `scene.webp` — 1080 × 1920, decorative scene image within
  the Gallery DOM.
- `moody.webp` (Together) — 820 × 1098.
- `moody-bride.webp` — 820 × 1098.
- `moody-groom.webp` — 820 × 1098.
- `moody-garden.webp` — 1000 × 747.
- `moody-lake.webp` — 1000 × 747.

All six are WebP images. The Gallery DOM contains **0 SVG** and
**0 canvas** elements. The reference's paper color is solid `#faf7fb`,
but screenshots show its ornate `scene.webp` architecture, floral
side edges and a persistent navigation/order overlay. **Our CI preview
cannot show those because neither the original Gallery photos nor the
25 Section 1 layer WebPs are supplied in Git.** These are substantial
artwork and cross-section-shell differences, not mistakes in the five
CSS frame rectangles.

At 320px, reference Gallery height measured 940.58px versus 1214.84px
locally; the extra local height includes development-only photo
placeholders and disclaimer content. At 390px the reference height was
1094.58px versus 1419.7px locally. Do not compare final heights until
the five WebPs are actually installed and the development disclaimers
are hidden.

**Neighboring evidence:** source Dress Code and Gallery share `#faf7fb`.
Source transitions immediately to a plum `Wedding Gift` section.
Local code has a different Dress Code gradient and an RSVP section next.
Both source and local DOM boundary gaps are 0px; *continuity of artwork*
still fails. This must be resolved by the integration owner, not a
silent change to another worker's file.

The test environment does **not** establish that the user's Windows
machine is missing locally permitted WebPs; it only establishes those
files are absent in the GitHub Actions checkout. Visual similarity
must be reassessed on a complete authorized local installation.

Evidence: [captured screenshot run](https://github.com/Arrjack8847/testing-4/actions/runs/41696827091).

## Live shell/artwork gap audit — 390×844, after opening settled

A fresh read-only source/local browser audit captured four scroll checkpoints:
[Actions 41751442480](https://github.com/Arrjack8847/testing-4/actions/runs/41751442480).
This distinguishes artwork **inside Gallery** from the opening scene and
shared floating interface, avoiding duplicate implementation by other workers.

### Most important missing layer: Gallery-specific sticky scenic WebP

The source renders
`/images/concierge/packs/tasik-kayangan/scene.webp`
as a **separate sticky image inside Gallery**, not only on the opening
section. The path through the source DOM is:

```text
#cgv-gallery
  .cgv-section-bg.cgv-section-bg-extra  [position: absolute; z-index: 0]
    img[src*="/scene.webp"]             [position: sticky]
  .cgv-inner                        [foreground content; z-index: 4]
```

At the source Gallery's upper scroll checkpoint (390×844), that image
is **390×844 and pinned at viewport y=0**. At a later checkpoint, the
image continues to move/clip within Gallery while the section scrolls.
The page's separate opening `arch.webp` and `peacock.webp` are far
offscreen by this point and are **not** Gallery-layer artwork.

The local branch does load `scene.webp` as `#masterArt` in the
Section 1 `#viewport`, but while viewing Gallery:
- `#masterArt` is `opacity:0` and several thousand pixels offscreen;
- `#gallery` has a flat `#faf7fb` background and no own sticky
  `scene.webp` image;
- the scenic architectural/floral framing seen at the source's Gallery
  edges is missing even when the existing Section 1 art loads.

This is a confirmed **Section 7 visual implementation gap**.
The correct implementation should use the locally authorized
`assets/scene.webp` within a Gallery-only sticky background layer,
with a measured crop and CSS wash, clipped to Section 7. Avoid
restarting Section 1's animation clock or letting the new background
cover Gallery's photo buttons.

### Shared floating overlay (not exclusively Section 7)

The reference uses **fixed**, viewport-anchored UI:
- preview header: `x=12,y=12,w≈286,h=40`, `z-index:80`;
- preview order pill: `x≈171.8,y=704,w≈140.2,h=36`, `z-index:80`;
- floating petal layer: `position:fixed`, `z-index:48`;
- music disc: `x=322,y=698,w=50,h=50`, `z-index:55`;
- bottom navigation dock: `x≈34.4,y≈783.2,w≈321.2,h≈42.8`,
  `z-index:55`;
- narrow scroll-progress rail: fixed at top `z-index:65`.

The local Gallery viewport currently exposes **none** of these
equivalent visible shared overlays in GitHub Actions. This is a
site-shell/integration difference, **not** a missing local photo or
a reason to edit another section from the Gallery feature branch.
Coordinate reusable original/authorized equivalents with the
integration worker; do not copy another company's commercial order
control into a product.

### Other proven gaps, ordered by impact

1. **Exact photos:** source frames load five original `moody*.webp`;
   GitHub Actions local Gallery has zero loaded photos. User's Windows
   local worktree may differ; inspect it separately.
2. **Gallery sticky scene art:** reference has a 390×844 sticky
   `scene.webp` background *within the Gallery*; local does not.
3. **Shared global shell:** petals, music disc, fixed nav and
   progress/order controls visible at source but absent locally.
4. **Section order/seam:** source goes Dress Code → Gallery → Wedding
   Gift. Current Gallery worker branch goes Dress Code → Gallery →
   RSVP with a different Dress Code background.
5. **Extra preview height:** at 390px reference Gallery height
   ≈1358.8px vs local preview ≈1419.7px (+60.9px);
   at 320px reference ≈1153.9px vs local ≈1214.8px (+60.9px).
   Placeholder-only disclaimer accounts for excess height; when all
   five customer or authorized QA WebPs load, code hides it.
6. **Motion polish:** after source/local timed captures, the reveal
   poses match at 3s/5s, but source/local transitions differ slightly
   during the first second/re-entry. Run visual comparisons only after
   the shared scenic layer and the real photos are visible.
7. **Photo viewer:** local keyboard/arrow/swipe/escape controls have
   functional tests, but the source-vs-local *opened modal visual*
   has not been certified.

**Important:** The large screenshot difference at the source
Gallery start can include a source gate/hero transition if not allowed
to settle. The live shell audit explicitly waits for the invitation
opening to finish before inspecting position and layering.
Do not call that screenshot by itself evidence that hero scene
belongs inside the Gallery. The sticky Gallery image above is confirmed
through DOM ancestry and computed positioning.

**Current decision:** No edit to Section 6, Section 8 or the
integration shell; this branch remains QA/documentation-only and
draft PR #26 remains unmerged.
