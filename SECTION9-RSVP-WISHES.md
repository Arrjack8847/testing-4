# Section 9 — Tasik Kayangan RSVP & Wishes

## Scope and branch

- Reference: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en
- Source research run (390×844, timed): https://github.com/Arrjack8847/testing-4/actions/runs/41695458698
- Isolated working branch: `feat/section9-rsvp-wishes-reference-20261104`
- Based on `feat/tasik-reference-remaining-20261103` (`c2b1377a`) so the existing Section 8 Wedding Gift and Section 10 Closing markup are preserved.
- Unmerged draft; this **does not** include final integrations of workers 5–8. Port only Section 9's markup, `section-nine.css/js`, tests and stylesheet/script tags into a future integration branch based on the newest neighbor branches. Keep those workers' files unchanged.

## Verified live source (Chromium at 390 × 844)

Actual reference node: `section#cgv-rsvp`; immediate previous section `#cgv-gift`, next `.cgv-closing`. This is the **ninth section**, not a later instance of the old local Section 6/7 RSVP.

| Reference measurement | Source value |
| --- | ---: |
| Total section height | 1215.89px |
| Background | rgb(250, 247, 251) / `#FAF7FB` |
| Section padding | 96px 28px |
| Eyebrow (relative top) | 96px |
| Heading (relative top) | 144.3px |
| Heading (font/line height) | Pinyon Script 52px / 59.8px |
| Name label (relative top) | 240.1px |
| Attendance and Guests label (relative top) | 342.3px |
| Wish label (relative top) | 444.5px |
| Label font | EB Garamond 11px, tracking 3.3px |
| Label form columns | x=28/202px, 160px each |
| Main live image | `tasik-kayangan/paper.webp` (WebP) |
| Decorative butterfly | `serambi-ungu/bfly_1.webp` (WebP), 52×41px, split animated wings |
| CSS details | 4 frame corners, opacity/scale/52px-Y enter transforms |

Measured over entry, middle and exit, sampled at 0, 1, 3 and 5 seconds. Reveal begins near 0 opacity, scale .955 and 52px down, then settles by approximately 3s with opacity 1 and no transform. Reverse scroll re-arms the reveal. Section source script has no section-local canvas element in the captured DOM. Content: deadline 31 December 2026, title RSVP & Wishes, name field, Attendance select, Guests select, wish textarea, Send RSVP and three example wishes. A source sample says wishes become public; **this prototype does not submit, publish, save or invent any user wish**.

## Source assets and licensing

The public repository commits **no vendor WebP** for Section 9 and makes **no vendor image requests** at runtime in this new section. Default artwork is independently drawn CSS paper and butterfly only, visibly different from vendor original. `?section9Reference=1` loads an **optional local** `assets/reference-dev/section9/paper.webp` for permission-cleared research. The directory is Git-ignored; missing files fall back automatically. Real-source image screenshot captures in ephemeral Action artifacts are for comparative research only; commercial reuse and redistribution require permission.

## Implementation

- `index.html`: only the `#rsvp` fragment is replaced while preserving neighboring `#weddingGift` and `#closingMessage`. Navigation retains `#rsvp`.
- `section-nine.css`: isolated source geometry, original replacement art, accessible form and ambient motion; scoped `.s9-*`.
- `section-nine.js`: own intersection lifecycle, offscreen pause, live Reduced Motion, cover gate, empty-state validation, **local preview only**, optional local art.
- `tests/section-nine.spec.mjs`: four-phone geometry, seams, form, privacy, motion and screenshots.
- `tests/section-six.spec.mjs`: old RSVP section-number tests replaced with a regression guard for its migration to Section 9; does not touch Dress Code worker tests.
- `tools/measure-section9-reference.mjs`, `tools/compare-section9-visual.mjs`: reference and local screenshot/geometry measurement; `tools/compare-section9-images.py`: diagnostic screenshot MAE. Actions save screenshots, diff images, JSON evidence and traces.

## QA status and review gates

Reference investigation succeeded: https://github.com/Arrjack8847/testing-4/actions/runs/41695458698

The first four-width CI run found exactly one strict 390px visual-geometry mismatch: name and subsequent rows were 6px high, while 23 other focused cases passed. Corrected Section 9 heading's bottom margin from 30px to 36px in commit `0d127456`; **the corrected commit must be verified in its own CI run before approval**.

Focused test workflow: `.github/workflows/section9-rsvp-qa.yml`.
Paired screenshot/geometry workflow: `.github/workflows/section9-visual-compare.yml`.
Check these Actions runs and record **actual** conclusion and screenshot geometry before declaring visual and functional completion.

### Open blockers

1. The exact source `paper.webp` and butterfly sprite are not shipped, so **pixel-perfect visual parity is not claimed**; source and independently drawn artwork differ.
2. The source's submission handler/back-end cannot safely be assumed or copied; form is intentionally a non-submitting research preview.
3. Section 9 is built against the existing continuation branch, not all latest separately authored Section 5–8 branches; create an integration branch from newest upstream worker state and transfer only the Section 9 fragment/files before merging.
4. Check four viewports, forward/back scroll, seam and Reduced Motion results independently from visual accuracy. Do not merge until both are reviewed.
