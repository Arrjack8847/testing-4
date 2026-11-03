# Section 4 — Tasik Kayangan Events reference-recreation prototype

**Reference:** https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en  
**GitHub:** https://github.com/Arrjack8847/testing-4  
**Section:** HTML #eventDetails, data-section="4". The original source files are
named section-three.css / section-three.js for historical reasons.

## Current implementation (3 November 2026)

The previous one-card "The Celebration" layout has been replaced **only in
Section 4** with two stacked reference-example event cards and an H:M:S
countdown, using the publicly observed source text:

1. Akad Nikah — Saturday, 23 January 2027, 10:00 AM–12:00 PM;
   Masjid Wilayah Persekutuan, Jalan Tuanku Abdul Halim, 50480 Kuala Lumpur.
   Official source sample Google Maps URL retained.
2. Wedding Reception — same day, 7:30 PM–10:30 PM; Grand Ballroom,
   St. Regis Kuala Lumpur, 6, Jalan Stesen Sentral 2, 50470 Kuala Lumpur.
   Official source sample Google Maps and Waze URLs retained.
3. Count down to **example** Akad Nikah 2027-01-23 10:00 +08:00 in
   Days, Hours, Mins, Secs. The timer refreshes while the section is visible
   and the cover is open, and pauses when the tab is hidden.
4. Add to Calendar opens the reference **example** Google Calendar draft;
   the visible disclosure makes clear it is not a confirmed customer's event.

All event details and links are **source example data**, not an invitation
for an actual customer. Never treat this prototype as a confirmed wedding,
or replace it with invented dates, venues, names or addresses.

## Art and animation

- The default site uses independently authored scene gradients and **existing**
  original Couple botanical/garden/lake SVG assets. No new vendor asset files
  were copied into the repo. These backgrounds are decorative only.
- To compare the actual provider artwork, visit **?eventsReference=1**.
  Only this explicit development comparison loads the provider's
  tasik-kayangan/paper.webp (events background) and
  anggerik-nirmala/bfly_white.webp (decorative butterfly) through their
  existing public source URLs. The page records
  data-reference-paper and data-reference-butterfly with loading/loaded/failed
  outcomes, rather than assuming remote hotlinking will succeed.
- Two semantic HTML cards remain on top of the pinned one-viewport scene.
  The scene camera follows bounded scroll position forward and backward,
  with extra drift limited to -20…24 CSS px.
- Card reveal animation uses 52px initial translateY, .955 scale and
  approximately one-second opacity/transform transitions; reduced-motion
  users see all content without entrances.
- At 390×844 the reference Events region was observed at document Y
  5134.1–6715 (height about **1581px**). We set min-height 1581px but
  allow content to grow naturally on narrower phones rather than clipping text.
  The implementation's exact artwork positions, card border radii, timings,
  and pixel similarity are **not verified** as matching the original DOM.

## Files modified

- index.html (Section 4 markup only)
- section-three.css (historically named file but Section 4 scoped)
- section-three.js (historically named file but Section 4 scoped)
- tests/section-three.spec.mjs (Section 4 phone/scroll/content tests)
- tests/cross-browser.spec.mjs and tests/section-couple.spec.mjs
  (update assumptions about Section 4; Section 3 code unchanged)
- .github/workflows/section4-events-qa.yml

## QA acceptance

Verify 320×568, 360×740, 390×844 and 430×932. Check:
two events, real sample URLs, calendar draft, opt-in WebP URL assignment,
reported load/fallback state, countdown tick, reduced motion, reversible
pinned camera, no overflow or text clipping, no gap at Section 3→4 seam,
and 4→5 continuity. Compare captured screenshots against the **live**
reference at equivalent scroll states before claiming visual parity.

The source artwork and commercial photographs remain owned by the source
provider. Public URLs and a research preview do **not** convey commercial
reuse or distribution permission. Production needs separately authorized
artwork and verified customer data.

## Local test (Windows PowerShell)

    git fetch origin
    git checkout feat/section4-events-reference-prototype-20261103
    powershell -ExecutionPolicy Bypass -File .\start.ps1

Open http://localhost:8000/ normally or
http://localhost:8000/?eventsReference=1 to compare provider artwork.

    npm install
    npx playwright install chromium
    npm run test:syntax
    npx playwright test tests/section-three.spec.mjs tests/section-four.spec.mjs tests/section-couple.spec.mjs

No edits to Sections 1–3 or 5 onward are required.


## Measured fidelity pass (3 November 2026)

Read-only GitHub Actions Chromium measurement:
https://github.com/Arrjack8847/testing-4/actions/runs/41661557880

- On source mobile 390x844, Events starts at document Y3446.1 in the
  sampled session (absolute Y varies with loading/other sections) and
  extends 1580.9px.
- Source has **ONE** long cgv-arch wrapper, not two separate card
  borders. Arch rectangle: x26, relative y120, width338, height1163.6.
  The ceremony blocks are x32/w326 and have relative y120 and 666.5.
- Source first event title (Akad Nikah) x62,y224,font42/69.3 Pinyon
  Script; Reception title x62,y770.5,font42, wraps into two lines.
- Source date is **22px/36.3px semibold** EB Garamond; time is
  **14px/23.1px light** EB Garamond; venue 19px/31.35px EB Garamond.
- Source first Maps button at x117,relative y534.5,w156,h44;
  source Calendar x82.5,relative y1413.1,w225,h47.8.
- Source paper.webp natural 1080x1920, rendered image element
  y=-189.7 relative to Events and height1960.4px on the measured page.
- Corrected prototype uses a single shared arch, matching relative
  heading positions, size, line height and date/time typography. The
  reference paper image now uses the measured tall placement in explicit
  ?eventsReference=1 mode. Its WebP loads successfully in the
  GitHub Actions browser comparison (natural 1080x1920).
- Early calibrations showed an extra **58px** from a wrapping Maps+Waze
  row; the Waze width has been reduced to keep the two buttons inline.
- Source uses no distinct butterfly img inside the measured Events
  viewport; the earlier optional comparison butterfly is hidden.

Re-measure with:
https://github.com/Arrjack8847/testing-4/actions/workflows/section4-reference-measure.yml
and re-test four widths with:
https://github.com/Arrjack8847/testing-4/actions/workflows/section4-events-qa.yml

This is a measured structural comparison; screenshots/per-pixel comparison
and licensing clearance remain separate tasks. main has not received
this draft PR's changes.
