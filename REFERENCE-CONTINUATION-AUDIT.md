# Tasik Kayangan reference-continuation audit
Inspection date: 3 November 2026. Benchmark: 390×844. Development comparison only; not a licensed commercial release.

## Verified public source
Read-only browser source: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en
After images loaded, source document 12,721px high; bottom scrollY 11,877.
Regions (document Y, source only):
- Events: 5134–6715 (~1581px): Akad Nikah & Reception, maps, countdown, Add to Calendar.
- Running order: 6715–7366 (~651px): six scheduled items.
- Dress: 7366–8046 (~679px): sage/cream and terracotta/blush.
- Gallery: 8046–9404 (~1359px): five images and darkened modal.
- Gift: 9404–10395 (~990px): two bank copy controls and wishlist.
- RSVP/Wishes: 10395–11612 (~1217px): attendance, 1–5 guests, wish wall.
- Closing: 11612–12721 (~1109px): gratitude, names, contact/footer.

Source backgrounds were viewport-sticky at 844px. Source text came in
from about 52px lower and 0.955 scale; scenes moved while scrolling.
These are measurements of the source, not a claim of local pixel parity.
Source gallery lazy-loading moved later content by ~264px.

## Implementation / remaining differences
- Approved opening, letter, couple: preserved from PR #12 head 593c8212.
- Existing Event scene remains a single original example card, not the source's
  two Akad Nikah/Reception venue cards. Calendar export remains disabled.
- Added a separate H:M:S example countdown for the source's 10:00 AM Malaysia-time
  demonstration ceremony, updating once per second while visible, alongside the
  existing local-calendar-day countdown. It is not a verified customer appointment.
- Added running-order timeline, dress swatches, gift preview, illustrative
  wish wall, and closing message in original independent CSS.
- Existing gallery remains five image placeholders with keyboard/swipe dialog.
  No real customer or vendor photographs are committed.
- Existing RSVP remains a local-only preview, never a fake successful submission.
- Gift buttons are deliberately disabled; no bank/contact/reservation service
  was supplied. Static wishes are explicitly labelled illustrations.
- New sections support cover locking, forward/reverse parallax with rAF and
  Reduce Motion. New camera effect is not source-calibrated pixel-perfect.
- Source also has Call, WhatsApp, fixed controls, functioning maps and
  calendar; these cannot be connected reliably without approved details.
- Original decorative art differs visually from provider artwork.

## Observed reference media inventory — not added to this branch
Sources were found in public DOM/computed CSS, but accessibility does not
imply a redistribution or commercial-use license:
- https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp (events)
- https://undangankahwin.com/images/concierge/packs/tasik-kayangan/band_plum.webp (timeline)
- https://undangankahwin.com/images/concierge/packs/tasik-kayangan/scene.webp (scene/gallery)
- https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_white.webp (events)
- https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_blush.webp (timeline)
- https://undangankahwin.com/images/concierge/packs/serambi-ungu/bfly_1.webp (dress/RSVP)
- https://undangankahwin.com/images/concierge/couples/moody.webp (gallery together)
- https://undangankahwin.com/images/concierge/couples/moody-bride.webp (bride)
- https://undangankahwin.com/images/concierge/couples/moody-groom.webp (groom)
- https://undangankahwin.com/images/concierge/couples/moody-garden.webp (garden)
- https://undangankahwin.com/images/concierge/couples/moody-lake.webp (lake)
- https://down-my.img.susercontent.com/file/3ec07fce7759a329a17cd0dc411fef2a_tn (wishlist thumbnail)
- https://img.lazcdn.com/g/p/99683b91c2b2cfcd5ce838a7a7a0d711.jpg_200x200q80.jpg_.webp (wishlist thumbnail)
Widths, transparency, decode and licensing are NOT confirmed here.
See existing ASSET-MANIFEST.txt and SECTION3-COUPLE-README.md for Sections 1–3.

## Validation and release gate
New Playwright continuation test covers four mobile viewports, ordering,
seams, overflow, forward/reverse scroll, accessibility, and reduced motion.
CI browser runner was fixed to Ubuntu 24.04; past failures were caused by
Playwright 1.56.1 not supporting the hosted Ubuntu 26.04 image.
Do not claim full fidelity or merge until all critical checks pass and
reference/current screenshots at equivalent scroll states are compared.
Vendor artwork, customer photo/identity permission, actual schedule, gift
details and an authorized RSVP endpoint remain commercial-release blockers.

## Local Windows testing
git fetch origin
git checkout feat/tasik-reference-remaining-20261103
powershell -ExecutionPolicy Bypass -File .\start.ps1

Open http://localhost:8000 and tap Open Invitation.
Run npm install; npx playwright install chromium firefox webkit;
npm run test:syntax; npx playwright test tests/reference-continuation.spec.mjs;
npm run test:mobile; npm run test:crossbrowser.

## Latest branch QA note
The original gallery and RSVP mobile specs assumed old direct sibling relationships.
After inserting Dress Code before Gallery and Gift before RSVP, those tests initially
failed only their stale adjacency assertions. They were updated to test the new
adjacent seams instead. A dedicated continuation GitHub Actions workflow now tests
ordering, four phone widths, gallery, RSVP, example countdown and reduced motion.
CI results must be checked on the final head SHA, not extrapolated from earlier passes.
