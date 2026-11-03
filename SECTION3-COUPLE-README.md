# Section 3 — The Couple (original reference-structured prototype)

## Source of measurements

Reference: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en, inspected read-only at 390×844 and 320×568 on 2 November 2026.

At 390px the reference Couple section begins at document y=3294.4 and ends y=5134.1 (1839.7px). Its content column starts 225px into the section at x=28, 334px wide. Its ivory arch occupies x=12–378, from 129px down to 1700px. The heading is a 52px Pinyon Script 'The Couple'; the two vertically stacked picture cards are each ~240.5×332.7 with 5px white borders and 16px corners. First card starts at section +359px; second at +1116px. Script names and family details follow each photo, separated by an ornamental ampersand. The reference has its own photographs; those images are not copied here.

## What is implemented

- An original long wisteria garden, lake/arch background at `assets/couple-garden-original.svg` and an original CSS ivory/gold arched frame.
- An original exit scene at `assets/couple-lake-finish-original.svg` with stone balustrades, carved ornaments, lavender water and botanical edging. It sits behind the arch and is revealed only at the end, reducing the abrupt empty-lavender strip before the preserved Celebration section.
- A higher-density **original** botanical overlay at `assets/couple-botanical-edges-original.svg`: hand-authored wisteria and hydrangea clusters, ivy stems, gilded side tracery and stone urns around the panel. The artwork is decorative and stays behind the couple's actual text.
- `assets/couple-arch-relief-original.svg` adds a subtle carved cream/gold floral texture and crest over the original arch silhouette without changing its measured dimensions. Both new SVGs are authored specifically for this prototype and are not downloaded from the reference website.
- Groom and bride portraits are **illustrated sample placeholders**: `assets/couple-groom-art-original.svg`, `assets/couple-bride-art-original.svg`. No individual is being represented as the actual couple. Replace both sources with owned/licensed wedding photographs before publication.
- The sample-portrait disclaimer remains in accessible text and the images retain placeholder alt text. The visible bottom caption is suppressed in original-art mode because it crowded the painted lakeside footer in 390px live QA; test-only placeholder information is documented here instead.
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

## Optional reference-art comparison (development only)

To compare the approved layout against the actual vendor artwork, open `http://localhost:8000/?coupleReference=1` or append `?coupleReference=1` to a commit-specific public preview URL. This **opt-in** view uses the reference website's existing `scene.webp` background, `arch_panel.svg`, and example `moody-groom.webp` / `moody-bride.webp` by direct URL without committing downloaded vendor assets. It also fills reference example names and family lines for typography comparison. Hotlinking may fail or be blocked by the provider; the portrait elements fall back to our original illustrations when that happens. The no-flag default uses only our original Section 3 art and dummy text.

This preview mode is for visual comparison, **not production or redistribution**. Referenced artwork, photography, and example identities require appropriate permission before commercial use. Sections 1–2 and Sections 4–7 are unchanged by the flag.

## Verified Section 3 source-image inventory (3 November 2026)

A read-only browser inventory of the live Tasik Kayangan **Couple** DOM,
computed CSS and scroll resource requests found **three distinct active WebP
URLs plus one SVG arch** in Section 3:

| Asset | Source URL | Role | Connected in comparison mode |
| --- | --- | --- | --- |
| Garden | `https://undangankahwin.com/images/concierge/packs/tasik-kayangan/scene.webp` | Sticky shared lake/garden scene | Yes |
| Groom | `https://undangankahwin.com/images/concierge/couples/moody-groom.webp` | Groom card photograph | Yes |
| Bride | `https://undangankahwin.com/images/concierge/couples/moody-bride.webp` | Bride card photograph | Yes |
| Arch (SVG, not WebP) | `https://undangankahwin.com/images/concierge/packs/tasik-kayangan/arch_panel.svg` | Arched border image | Yes |

The reference's `arch_event.svg`, `band.webp`, and `band_plum.webp` were
present among shared style variables but **not actively rendered by this
Section 3** in the inspected view. The flowerbed container contained no
additional image sources. This is an observed inventory, not a guarantee
that the upstream provider will never add assets.

In `?coupleReference=1`, the three WebPs are assigned without embedding
or rehosting third-party images. Open DevTools and inspect the
`#couple` element attributes:

- `data-reference-webp-count`: number of the three WebPs that actually loaded (0–3)
- `data-reference-webp-state`: `loading`, `ready` or `partial`
- `data-reference-webp-missing`: keys of missing / fallback assets, if any

This distinguishes **URL implementation** from real image decoding. The
source returned HTTP 200 during the read-only inspection, but the cloud
browser's image proxy failed decoding, so HTTP 200 alone is insufficient
to certify all images render in every environment. Source-photo fallback
continues to use our illustration rather than showing a broken box.

The source layers a faint paper-colored wash at 0.1 opacity between the
scene and the arched panel. Our reference-only CSS now adds the same
layering order without touching original-art mode. Its backdrop is still
implemented as a CSS scene with calibrated camera transform, rather than
the source's DOM `img` and sticky wrapper; parity of all source DOM
mechanics is therefore **not claimed**.

These assets are for development comparison; their appearance in a
prototype does not grant commercial licensing or redistribution rights.

## Reference-mode animation calibration (3 November 2026)

The opt-in reference scene is a one-viewport composite image positioned over the 1,840px Couple section. It now reproduces the reference's *measured* background camera offset, rather than holding the image perfectly fixed. At 390×844, the four source checkpoints are document scroll Y=2743 (-44.8px), Y=3165 (-26.8px), Y=3587 (-8.8px) and Y=4220 (+18.2px). The preview computes a clamped linear interpolation (0.0427px of camera displacement per scroll pixel) while retaining the correct sticky frame and full section height. Reverse scrolling recalculates the camera in both directions. Reduced Motion sets the extra camera shift to zero. The reference preview also uses a 52px/95.5% opacity reveal, while normal original-art mode retains its own previous animation.

These measurements apply to the opted-in development comparison only. The 25 original Section 1 image layers and Sections 2, 4–7 have not been modified. Reference imagery may be blocked by the remote host and is not embedded in or redistributed with this repository.
