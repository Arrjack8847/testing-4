# Tasik Kayangan — Section 5: Order of the Day

Reference: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en

## Verified source structure

Public indexed reference and the prior read-only source audit agree that the
section *immediately after Events* is `Running order / Order of the Day`,
not the Wedding Gift section. It contains six items, in order:

| Time | Title | Source subtitle |
| --- | --- | --- |
| 11:00 am | Guests arrive | Lunch service opens |
| 12:00 pm | The couple arrive | |
| 12:30 pm | Wedding procession | Led by kompang from the main entrance |
| 1:00 pm | Bersanding & photographs | |
| 2:00 pm | Lunch is served | |
| 4:00 pm | Celebration ends | |

Earlier read-only measurement: document Y 6715–7366 = 651px tall at
390×844; the reference uses mobile viewport-sticky atmospheric artwork,
text entrances and a plum floral band (`band_plum.webp`).

## Changes

- Insert `#runningOrder[data-section=5]` **directly after** `#eventDetails`.
- Implement original floral CSS/artwork by default, with explicit
  `?orderReference=1` **development-only** requests for the reference host's
  `band_plum.webp` and `bfly_blush.webp`. No vendor artwork embedded.
- Preserve original 6-stop timeline typography/sequence at four mobile sizes.
- Scroll-aware layered stage with bounded, reversible camera displacement,
  stagger-free observed 52px/0.955 reveal envelope, and Reduced Motion.
- Keep existing legacy `#saveTheDate` logic in the DOM but hide the redundant
  visible scene by default. The Events section already contains a live D/H/M/S
  countdown as the reference does. `?legacySaveDate=1` restores the old scene
  for regression checks; no original date logic was deleted.
- Dates and programme titles are reference examples, not confirmed customer data.

## Limitations

This is not yet certified pixel-perfect. Browser Use live visual access was
blocked by insufficient credits during this pass. Exact current reference
pixel coordinates, colors, band crop, animation curve and app-owned photo
permissions require source-vs-local screenshots. The source background is
not commercially licensed for reuse merely because it is publicly hosted.

This branch only implements Section 5. Section 6 should be Dress Code,
which has not been rebuilt in this isolated branch. Its current next visible
block is the legacy Gallery; it is not a claim of full reference ordering.

## Run locally

```powershell
git fetch origin
git switch feat/section5-order-of-day-reference-20261103
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Visit `http://localhost:8000` (or add `?orderReference=1`
to inspect source art only for development comparison).

```powershell
npm install
npx playwright install chromium
npm run test:syntax
npx playwright test tests/section5-order-of-day.spec.mjs tests/section-four.spec.mjs tests/section-five.spec.mjs --workers=2
```

PR is intentionally stacked onto Section 4 PR #14. Validate section 4
after integrating it and never merge without checking all head-specific CI.


## Verified live visual evidence (GitHub Actions Chromium)

Subsequent direct source/local capture succeeded at 390×844 after
running the checked-out local server. Actual source `.cgv-timeline`
computed background:
`linear-gradient(rgba(20,8,18,.12), rgba(20,8,18,.12)), url(band_plum.webp)`,
with sizes `auto, cover` and positions `0% 0%, 50% 50%`.
The source band has document height 651.3px, with a thin pale frame;
the source heading is Pinyon Script, 46px; timeline list font is
EB Garamond, 18px. These measured details are reflected in
`order-program.css` and in development-only `?orderReference=1`.

Head-specific mobile tests passed 60/60 at 320×568, 360×740,
390×844 and 430×932 on a completed CI run after measured text,
panel and backdrop revisions. The comparison workflow also captured
source and local start/middle/exit checkpoints after direct source
HTTP 200 access.

Known remaining differences visible in those captures: the reference's
global branded header, floating bottom controls, the source's exact
sparse butterfly flight and the following *Dress Code* section.
The current isolated branch intentionally does not replace global
navigation or build the following Dress Code section. Neither
full-page nor animation-timeline pixel parity has been certified.
