# Section 8 — source-driven wishlist parity handoff (2026-11-04)

Repository: Arrjack8847/testing-4. This document records a read-only
reference/local browser comparison for Wedding Gift, not permission to
redistribute third-party artwork or financial details.

## Verified closed-state geometry

At width 390, reference section height 990.33px; local 991px.
Across widths 320, 360, 390 and 430, the section heights, plum
background color (#5c264f), and padding (96px top/bottom, 28px sides)
are matched to within 1px. This does **not** establish image parity.

## Observed expanded-state deltas (last fully completed source audit)

For 390px screenshot evidence, reference expanded height 1266.6px,
local expanded height 1245.2px (**local 21.4px shorter**).

The audit was taken at different absolute scroll offsets. Normalized
coordinates relative to the section itself show the CTA and the
wishlist panel top virtually match. The next corrections should not
reintroduce a 47px CTA shift.

Reference wishlist panel height 514.9px; local height 446.3px:
local panel is **68.6px shorter**. The first source item is about
185.5px high; the first local item about 103.9px. Source thumbnail
68×68px; local placeholder about 54×64px. The source has product
photography; local/published demo uses vector glyphs unless licensed
local thumbnails have been supplied.

## Audit limitation corrected in this branch

The original full-section source screenshot did not reveal the
wishlist content at all because the source's scroll-triggered reveal
had not fired. The updated tools/audit-section8-live.mjs scrolls the
wishlist into view and waits for its entrance before taking
-390-wishlist-inview.png, captures source/local normalized panel,
product-card and thumbnail geometry for each phone width, and emits
numeric expanded-height/wishlist/product deltas in measurements.json.

Use the new evidence to tune the actual list items and overall panel
height. Do not stretch the outer section merely to force dimensions.

## Visual and production constraints

The reference's high-relief embossed plum botanical texture is from
third-party band_plum.webp. The repository's original SVG fallback
is not an exact visual equivalent. Local-only authorized artwork can
be placed at assets/reference-dev/band_plum.webp with automatic
loopback detection; do not commit or hotlink the vendor's artwork
without redistribution rights.

Demo bank numbers and reservations are intentionally not operational;
do not transcribe the reference's public sample account numbers as
real customer payment instructions. Real payments require verified
recipient details; reservations require a backend or service.

## Merge criteria

1. Inspect updated source/local wishlist-inview screenshot pairs at
   390px and the numeric card geometry at all four widths.
2. Fix remaining visual differences on a dedicated Section 8 branch.
3. Verify no Gallery→Gift→RSVP gaps, sideways document overflow, or
   regressions to Sections 7, 9 or 10.
4. Obtain passing current-main four-phone browser and accessibility
   checks before claiming QA completion.
5. Verify original assets **with permission** in the local preview;
   GitHub CI fallback screenshots alone cannot certify original art.

## New completed four-phone reference audit, run 41789080486

The revised Section 8 branch `02058ad` passed its four-phone browser
regression, syntax checks and reference/local screenshot capture. Complete
reference/local geometry, in pixels, before the next caption/spacing patch:

| Width | Reference wishlist y | Local wishlist y | Reference wishlist h | Local wishlist h | Expanded height reference/local |
| --- | ---: | ---: | ---: | ---: | --- |
| 320 | 798.1 | 748.1 | 513.2 | 542.5 | 1367.4 / 1347.4 |
| 360 | 676.4 | 655.3 | 529.6 | 518.2 | 1289.1 / 1268.5 |
| 390 | 655.7 | 655.4 | 514.9 | 524.2 | 1266.6 / 1274.5 |
| 430 | 666.5 | 672.4 | 443.8 | 454.5 | 1199.0 / 1221.7 |

The latest follow-up correction replaces multi-line demo captions with
short truthful labels (without inventing availability or transactions), removes
the third item subtitle that the source does not display, and targets
wishlist margins separately at 320, 360 and 430. It also adds
per-viewport geometry and adjacency checks. **Do not call the follow-up
patch validated until its own new-head four-phone CI and screenshot
evidence are inspected.**

Artwork remains a rights-gated issue: the original source has heavily
embossed plum botanical art and two branded photos; the published fallback
uses an independently created SVG and nontransactional placeholders.
