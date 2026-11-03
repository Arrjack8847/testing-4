# Section 7 — Our Gallery (Tasik Kayangan reference study)

**Branch:** `feat/section7-gallery-reference-20261103`
**Parent:** `feat/section6-dress-code-reference-20261103`

## Reference order and confirmed content

The indexed public source at
https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en
confirms the order: Section 4 Events → Section 5 Order of the Day →
Section 6 Dress Code → **Section 7 Our Gallery** → later Wedding Gift →
RSVP & Wishes → closing.

Section 7 specifically shows `Moments`, `Our Gallery`, and five named
frames: `Together`, `The Bride`, `The Groom`, `The Garden`,
`The Lake`; the reference invites guests to tap a frame to view.

## Implementation in this isolated branch

- `index.html`: renamed the five original placeholders and gallery heading
  to verified reference content and retained their position after Dress Code.
- `section-five.js`: accessible alt text, matching caption text in the
  existing modal, keyboard arrows, Escape and touch-swipe navigation.
- `section-five.css`: scoped frame captions for real images, uses existing
  original botanical artwork to blend with Dress Code, and preserves the
  matching mauve boundary color.
- `tests/section-five.spec.mjs`: checks reference heading and five labels
  alongside existing mobile bounds, accessibility and modal behavior.

No existing Section 1–6 markup or animation was intentionally changed.
No gallery photographs have been fabricated or embedded; the five local
image slots are `assets/gallery/photo-01.webp` through `photo-05.webp`,
which remain optional until authorized real images are supplied. Without
them, the frames are clearly labeled placeholders and disabled.

## Important visual limitation

This prototype matches the reference's **verified content and frame count**.
The reference's exact photograph files, their crop/focal points, pixel
dimensions, camera movement and animations were not available for
side-by-side screenshot comparison. The visual geometry is therefore
**not certified pixel-perfect**.

Before production: obtain consented images for all five frames, inspect
the original reference at 320×568, 360×740, 390×844 and 430×932,
and compare frame sizes, typography and section entrance/exit on forward
and reverse scroll. Preserve the zero-gap Dress Code → Gallery transition.

## Test locally

```powershell
cd D:\testing-4
git fetch origin
git switch feat/section7-gallery-reference-20261103
git pull origin feat/section7-gallery-reference-20261103
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Visit `http://localhost:8000`, open the invitation and scroll past
**Dress Code** to **Our Gallery**. Do not merge this branch into main
until the focused visual and browser tests pass.

## Phase 2 — verified reference URLs and opt-in photo comparison

All five image links were verified from the live public Tasik Kayangan page
HTML image references (not guessed):

| Caption | Original URL |
|---|---|
| Together | https://undangankahwin.com/images/concierge/couples/moody.webp |
| The Bride | https://undangankahwin.com/images/concierge/couples/moody-bride.webp |
| The Groom | https://undangankahwin.com/images/concierge/couples/moody-groom.webp |
| The Garden | https://undangankahwin.com/images/concierge/couples/moody-garden.webp |
| The Lake | https://undangankahwin.com/images/concierge/couples/moody-lake.webp |

The public HTML order places **Tap a frame to view after the five frames**;
the local section now uses the same DOM order.

Normal guest mode uses only local
`./assets/gallery/photo-01.webp` through `photo-05.webp`. To compare
with source photos temporarily, open:

```text
http://localhost:8000/?galleryReference=1
```

These source photos are remote, never downloaded or committed by this
branch, and are **not licensed for inclusion in commercial customer work**.
A distinct on-page notice identifies the comparison mode; if hotlinking
fails, placeholders remain instead of broken interactive frames.

The comparison mode verifies content and photo identities, **not** exact
CSS dimensions, crop positions, colors, camera motion, or timings. Do not
declare the gallery pixel-perfect until side-by-side mobile screenshots
have been measured and manual device testing has been completed.

Focused CI uses `.github/workflows/section7-gallery-qa.yml`, testing
four mobile sizes, image viewer, remote-image mock, keyboard use, fallback,
reduced motion, and three browser engines.
