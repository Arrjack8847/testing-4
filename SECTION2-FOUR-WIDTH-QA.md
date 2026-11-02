# Section 2 — four-width reference-fidelity checkpoint (2026-11-02)

Project: [Celestial Lake testing-4](https://github.com/Arrjack8847/testing-4), comparing against the mobile Tasik Kayangan English invitation.
This document records **measured results**, not a claim that the two pages are pixel-identical.

## Latest verified evidence

- [Four-phone reference screenshot and geometry audit — passed](https://github.com/Arrjack8847/testing-4/actions/runs/41406642960)
- [Cross-browser accessibility checks — passed](https://github.com/Arrjack8847/testing-4/actions/runs/41406648490)
- Screenshot artifact in the audit run: section2-reference-vs-testing4-four-phone-comparisons (seven-day retention).
- Run captures reference + testing-4 at 2.5H, 2.75H, 3.0H, and 3.25H at 320×568, 360×740, 390×844, and 430×932.
- Each reference page was opened using the visible Open Invitation button, allowed to settle, scrolled to the same absolute viewport-height checkpoint, and compared with the local page.

## Reference vs reconstructed geometry (at 3H, CSS pixels)

| Width | Reference frame x / top / width / height | testing-4 frame x / top / width / height | Reference band / testing-4 band height |
|---|---|---|---|
| 320 | 22 / 187 / 276 / 556.4 | 22 / 187 / 276 / 556 | 823.4 / 823 |
| 360 | 22 / 187 / 316 / 495.4 | 22 / 187 / 316 / 495 | 762.4 / 762 |
| 390 | 22 / 187 / 346 / 495.4 | 22 / 187 / 346 / 495 | 762.4 / 762 |
| 430 | 22 / 187 / 386 / 495.4 | 22 / 187 / 386 / 495 | 762.4 / 762 |

The **lead paragraph** starts at Y=291.8 in the measured reference, versus Y=291.4 in testing-4, at all four sizes. Its width matches: 264 / 304 / 324 / 324px, respectively. The reference and testing-4 use 19px EB Garamond for the lead. Layout and typography checks at all four widths pass without horizontal overflow.

**These results verify layout landmarks only.** They do not certify a pixel-perfect match or identical time-dependent animation.

## Specific corrections applied

1. Remove the prior 346px frame-width cap at 430px and the overly wide frame at 320px; preserve a 22px inset on each side.
2. Keep the 187px frame-top spacing even on small phones.
3. Keep a consistent 19px lead on 320px phones and align the inner content width.
4. Restore the reference's thin divider after the lead (original CSS construction); remove the unrelated diamond above the frame.
5. Match the 320px reference's taller band/frame by preserving its content area without clipping.
6. Use a longer **original paraphrase** of the verse for a more comparable block of italic quotation text; do not copy the provider's translation.
7. Make the automated checks wait for the entrance reveal transition before measuring frame boxes; otherwise temporary scale transforms cause false test failures.
8. Preserve the existing 4H sticky lake / -1H overlap, butterfly routes, names, scenery camera, petal visibility control and reduced-motion behavior.

## Not signed off yet

- The current **independently created textured SVG** differs noticeably from the provider's embossed mauve band.webp; color averages and geometry are not sufficient.
- The Bismillah symbol is font-rendered instead of the reference's compact ornament.
- Some verse letter spacing, embroidery pattern and petal animation details differ. Dynamic objects should be evaluated over time, not in a single frozen screenshot.
- The provider's header, purchasing controls and footer navigation are intentionally outside this invitation and should not count as page-art mismatches.
- The actual next reference scene is **The Couple**, whereas testing-4's current third scene is an independent events panel; Section 3 needs a separate fidelity pass.
- Test on physical Safari and Android Chrome before release. Also replace/have commercial rights to all original provider-owned WebP artwork.

## Run locally

In PowerShell after checking out the approved branch or merged main:

~~~powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
~~~

To run regression tests:

~~~powershell
npm install
npx playwright install chromium firefox webkit
npm run test:mobile
npm run test:crossbrowser
~~~

The read-only reference comparison script is tools/audit-section2-four-widths.mjs; its GitHub Action loads reference artwork only into its temporary runner and uploads measurement/screenshot evidence, not vendor art source files to the repository.
