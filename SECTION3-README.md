# Section 4 — Wedding Celebration and Venue (legacy module name section-three)

This preserved celebration scene now follows the new Section 3 The Couple, which itself follows the existing Section 2 invitation letter. It is an **original mobile design** using CSS ornamentation; it is not certified as a frame-accurate recreation of the provider's third scene.

## What's included

- Lilac-to-ivory transition, animated botanical edges, gold filigree and a calendar-style date card.
- Sample **Saturday, 23 January 2027** (the same demonstration date already shown in the first two sections).
- Time and venue are explicitly labeled **To be confirmed** / **Venue to be announced**. No address, ceremony time or map link has been invented.
- An initially hidden directions link that can appear only when a venue name and valid HTTPS Maps/Waze URL are supplied.
- Accessible headings, a semantic `<time>`, first-section cover gating using `inert` and `aria-hidden`, and reduced-motion support.
- One-time scroll-reveal; no new external images or dependencies.

## Replace demonstration information

Edit the `EVENT` object near the top of `section-three.js`: `time`, `venueName`, `venueAddress` and `directionsUrl`. If time is unknown, leave it blank. The directions link appears only when both a venue name and approved HTTPS map URL are present.

The January 23 date is **sample only**, authored in `index.html` at the `#eventDetails` `<time>` element. When actual wedding details are provided, update that date and the sample-date notice, plus the matching date in Sections 1 and 2. Do not publish sample event information as if it were real.

## Files

- `index.html` — Section 4 Celebration content, after the new Couple section.
- `section-three.css` — legacy filename for Section 4's scoped event styling with independent reduced-motion rules.
- `section-three.js` — event metadata, map-link safeguards, cover accessibility state, reveal.
- `tests/section-three.spec.mjs` — 4 mobile phone-size browser checks, screenshots, and accessibility cases.
- `tests/cross-browser.spec.mjs` — Chromium, Firefox and WebKit event scene smoke check.

## Run tests

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

In another terminal, after `npm install` and Playwright browser installation:
```powershell
npm run test:syntax
npm run test:mobile
npm run test:crossbrowser
```

Open the local mobile preview, tap **Open Invitation**, then scroll through the garden and letter to the event date and details. Real phone testing and checking artwork rights for Section 1 remain outstanding. Do not treat passing browser tests as licensing clearance or commercial readiness.
