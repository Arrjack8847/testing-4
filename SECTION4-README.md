# Section 4 — Save the Date

Section 4 is an **original mobile-first continuation** of the existing invitation. It is not claimed to reproduce the commercial reference's fourth section exactly; that content was not accessible for reliable inspection.

## Experience

- An ivory-and-lavender date scene following Section 3, with CSS-only floral ornaments, subtle halo lighting and a circular countdown portal.
- Live **calendar-days-remaining** number for the existing demonstration date, **Saturday, 23 January 2027**. This deliberately does NOT count hours/minutes to an unknown ceremony time.
- The browser's local calendar date determines the number of days; UTC calendar-day differences avoid daylight-saving shifts affecting the day count.
- A sample-date disclaimer and **disabled Save to Calendar** button. No event time or venue is fabricated.
- When a real date is verified, setting `DATE_CONFIG.confirmed = true` in `section-four.js` enables a client-side downloadable `.ics` **all-day date reminder**, not a timed ceremony appointment. Update the date across Sections 1–3 too, and change the date's display text if it differs.
- No backend, user tracking, network dependency, external images or extra fonts were added in this scene.

## Files

- `index.html` — semantic Section 4 markup, including `<time>`, sample disclosures, and initially inert/hidden-from-screen-readers state.
- `section-four.css` — isolated layout, transitions, decorative atmosphere, and reduced-motion rules.
- `section-four.js` — validated date-only arithmetic, one-minute updates only while visible, cover accessibility gating, scroll reveal and disabled-by-default calendar export.
- `tests/section-four.spec.mjs` — viewport checks across 320/360/390/430px and screenshots.
- `tests/cross-browser.spec.mjs` — updated three-engine smoke test.

## Release and customization

The wedding date and all wedding names displayed in the current prototype are **examples**, not real customer details. Calendar export must not be enabled merely to demonstrate a button. Only publish after verifying actual couple, date, ceremony time (if presented), and venue details. For an all-day reminder, do not falsely label it as the ceremony time.

The provider's Section 1 artwork is still loaded through the reference host as a fallback; independent commercial rights and replacement/self-hosting remain release blockers.

## Local testing

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Open `http://localhost:8000`, tap **Open Invitation**, and swipe through all four mobile sections.

In another terminal, after installing Node and Playwright browsers:
```powershell
npm install
npx playwright install chromium firefox webkit
npm run test:syntax
npm run test:mobile
npm run test:crossbrowser
```

Automated browser checks don't certify real-device animation smoothness, actual invitation content, or commercial artwork rights.
