# Section 3 — The Couple (original reference-structured prototype)

## Source of measurements

Reference: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en, inspected read-only at 390×844 and 320×568 on 2 November 2026.

At 390px the reference Couple section begins at document y=3294.4 and ends y=5134.1 (1839.7px). Its content column starts 225px into the section at x=28, 334px wide. Its ivory arch occupies x=12–378, from 129px down to 1700px. The heading is a 52px Pinyon Script 'The Couple'; the two vertically stacked picture cards are each ~240.5×332.7 with 5px white borders and 16px corners. First card starts at section +359px; second at +1116px. Script names and family details follow each photo, separated by an ornamental ampersand. The reference has its own photographs; those images are not copied here.

## What is implemented

- An original long wisteria garden, lake/arch background at `assets/couple-garden-original.svg` and an original CSS ivory/gold arched frame.
- Groom and bride portraits are **illustrated sample placeholders**: `assets/couple-groom-art-original.svg`, `assets/couple-bride-art-original.svg`. No individual is being represented as the actual couple. Replace both sources with owned/licensed wedding photographs before publication.
- Text uses the existing Rayyan and Sofea example names. No parent identities, private dates, or family information have been invented.
- Section 3 uses `#couple`, a 1840px-tall reference-measured layout on 390px, with a 1776px minimum on 320px.
- The content is live HTML; Pinyon Script, EB Garamond, responsive card sizing, staggered scroll reveals and sparse falling petals are implemented independently of the reference source code.
- The couple section is inert and hidden from assistive technology while the invitation cover is closed. Decorative petals pause outside Section 3, when the document tab is hidden, or when Reduced Motion is requested.
- The prior Celebration, countdown, gallery and RSVP content stays after the new Couple section, renumbered Sections 4–7 without changing their data, event logic or copy.

## Replace photographs

In `index.html`, replace the `src` values for `#groomPortrait` and `#bridePortrait` with image files owned by the customer. Keep truthful, descriptive alt text. A recommended aspect ratio is 240:333 or 3:4.2. Do **not** use the reference company's example groom/bride photos in a commercial site without permission.

## Testing and limitations

- New tests: `tests/section-couple.spec.mjs` on 320×568, 360×740, 390×844 and 430×932; automatic screenshots, source image checks, section boundaries, accessibility and Reduced Motion.
- Existing tests preserve Section 1/2 scroll handoff and the functional Celebration event information.
- Visual similarity is not pixel-perfect: the original composite garden and original example photos differ deliberately. Real customer photography and physical iPhone/Android checks are still needed for commercial release.
- The base website currently uses original-provider image fallbacks in its earlier Section 1; independent/public redistribution permission must be confirmed.
