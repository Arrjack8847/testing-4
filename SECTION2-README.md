# Section 2 — observed live reference and implementation

**Reference:** Tasik Kayangan English mobile demo,
`https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en`

**Evidence:** [read-only live inspection run](https://github.com/Arrjack8847/testing-4/actions/runs/41328045666).
The temporary `reference-section2-inspection` artifact contains `report.json` and 390×844 screenshots. No third-party artwork has been imported into this repository by the inspector.

## What the live template actually shows

The second reference scene is **not a parchment wedding card with large couple names and a date**. It is a narrow, mauve-textured message scene framed by two fine rectangular rules.

At a 390×844 portrait viewport, after opening the invitation:

| Measurement | Measured reference |
|---|---|
| Hero section | y=0–2532, exactly 3 viewports |
| Invitation-message section | y=2532–3294.4, height 762.4px |
| Inner content region | 334px wide |
| Decorative double-rule frame | approx 346×495px |
| Lead text | EB Garamond, 19px, white, centered |
| Background | Mauve textured band (the original uses `band.webp` as a background image) |
| Ambient detail | Scattered pale pink/purple petals |
| Content order | Bismillah icon → invitation paragraph → italic quotation → Surah Ar-Rum 21 label |
| Next reference section | **The Couple**, y=3294–5134, approx 1840px, with floral canopy, cream arch and portrait cards |

The vendor's visible invitation paragraph uses the same demonstration wording already present in our earlier prototype. The revised quote in our version is a short original paraphrase of the verse's sentiment, rather than a verbatim copy of the site's translation.

## What changed in our Section 2

- Replaced the previous large ivory invitation-letter scene and names/date with the reference-observed message hierarchy.
- Created an **original CSS textile texture** instead of importing the vendor's `band.webp`.
- Used thin double rectangular borders at the measured width.
- Restored white serif typography and a distinct italic religious quote.
- Added restrained drifting petals, with motion disabled for Reduce Motion.
- Triggered scroll-reveal when the actual frame is visible, not when empty section padding first enters the viewport.
- Updated mobile and cross-engine regression tests.

## Section 1 → Section 2 handoff test

The reference's **effective first-scene document span** is 3× the viewport height. Our lake now uses a `400dvh` sticky containing block with `margin-bottom:-100dvh`, so Section 2 still starts at document y=3H while the complete garden can remain pinned beneath the incoming mauve scene.

At scroll=2.5H, the lake is still pinned at screen y=0 and Section 2 rises from the halfway point, covering the lower part of the garden. At scroll=3H, the mauve band completely covers the sticky garden. Both checkpoints are captured as `section-two-transition-half.png` and `section-two-transition-full.png`.

The title animation and butterfly triggers preserve their existing calibrated scroll checkpoints; Sections 3–6 are not modified.

## Remaining differences / visual QA

- **Corrected after screenshot comparison:** The reference uses a sticky *full garden* during the overlap. The implementation uses a 4H sticky containing block and a -1H flow overlap, preserving a 3H effective hero before Section 2. The names move upward independently after 2H, while the lake remains visually pinned; ambient particles pause once the message fully covers the scene.
- The remaining visual differences include the exact background texture, Bismillah graphic and minute text spacing; passing geometry tests is not a claim of pixel-perfect matching.
- **Improved:** Our independently authored `assets/section2-mauve-original.svg` now adds subdued botanical relief and procedural grain, without copying the provider's textured WebP. This remains a visual approximation rather than the vendor asset.
- The reference's Bismillah is a compact calligraphic design; our Unicode text is a font-dependent representation and should be refined with an original licensed ornament.
- Our existing Section 3 is an **events panel**, while the actual reference follows Section 2 with **The Couple**. This requires a future section-order correction to reproduce the full site faithfully.
- The reference has its own merchant header/footer controls, which are not part of our guest-facing invitation.
- Capture the updated implementation at 320, 360, 390 and 430 CSS pixels, compare it against the reference screenshot, then adjust frame baseline and typography. Physical iPhone/Android testing remains outstanding.
- The original first-section artwork and other provider-owned assets must not be commercially published without verified rights.

## Local test

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Open `http://localhost:8000`, tap **Open Invitation**, and scroll to the mauve message scene. In another terminal:

```powershell
npm install
npm run test:syntax
npm run test:mobile
npm run test:crossbrowser
```

This is a visual and behavioral reconstruction using independently written HTML/CSS/JavaScript, not a copy of the original source.

## Focused screenshot comparison — 2026-11-02

The first three-viewport flow implementation passed both the four-width mobile suite and the three-engine cross-browser suite; its **visual layering mismatch was later identified and corrected**. [Mobile run](https://github.com/Arrjack8847/testing-4/actions/runs/41329856603) · [Cross-browser run](https://github.com/Arrjack8847/testing-4/actions/runs/41329856546).

The actual reference frame begins approximately **188px inside the mauve band**; our own frame starts at the same measured offset. We should **not** move the entire frame. The biggest visible difference was the weaker background texture, so an original embossed-paper vector overlay was added, and natural line wrapping was restored.

Section 2 screenshots now also capture **2.75H and 3.25H**, in addition to the 2.5H and 3H transition checkpoints. Those positions match the read-only reference inspection, allowing more precise tuning of letter spacing and decorative edges.

Sections 3–6 remain untouched during this refinement. Verify all commercial-use rights independently.


## Focused texture and motion refinement — 2026-11-02

A direct 390×844 screenshot comparison at 2.75H and 3.25H showed that the earlier mauve overlay looked too flat and light against the reference's embossed surface. We strengthened the original procedural relief, inspected the render, then **reduced** it after the first pass looked too streaky. The resulting overlay uses an independently designed botanical embossed texture, rather than the source site's artwork.

The approximate sampled background mean (RGB) in one unobstructed 2.75H screenshot region changed from **131/108/124** to **116/91/108**, compared with **119/92/107** in the reference. High-frequency luminance variation in that same region is approximately **7.7** in both the reference and the corrected render. These numerical checks cover a small patch, not the whole visual composition, and do not imply pixel-perfect fidelity or identical relief artwork.

The frame remains centered at 346px; the 322px lead text column and 188px top offset at 390px have not been moved. All other sections' markup and scripts remain unchanged.

Decorative petals in Section 2 now have a visibility gate. They run only when the invitation is opened, the mauve band is actually visible, the tab is active and Reduce Motion is off. They pause when the section exits or the invitation closes. The one-time message reveal remains independent of petal motion.

Focused browser QA now checks the active/paused petal state and mobile reference-position screenshots. Real-device performance and any commercial-asset rights still require independent verification.
