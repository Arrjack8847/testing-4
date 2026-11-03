# Section 6 — Dress Code (Tasik Kayangan reference study)

Base branch: `feat/section5-order-of-day-reference-20261103`.
Development branch: `feat/section6-dress-code-reference-20261103`.

## Reference-verified structure
On the public Tasik Kayangan English mobile invitation, **Dress Code** comes directly
after **Order of the Day**, before **Our Gallery**. The audited source occupies
approximately document Y 7366–8046 (about 679 px at a 390×844 mobile viewport).

Text (from the public reference):
- Attire; Dress Code
- We would be delighted if you could dress along with our chosen palette.
- Groom's Side — Sage Green & Cream — Sage, soft sage, cream.
- Bride's Side — Terracotta & Blush — Terracotta, blush, sand.

## Implementation
- `index.html`: visible Section 6 inserted after the hidden legacy countdown,
  before the gallery, with the original reference wording.
- `dress-code.css`: compact 679px mobile composition at 390px, twin swatch cards,
  original botanical art, subtle wings, edge continuity, 52px / .955 reveal.
- `dress-code.js`: opens only with the invitation; viewport-triggered reveals,
  forward/reverse parallax, reduced-motion fallback, and no guest data collected.
- `tests/section-six-dress.spec.mjs`: wording, gating, ordering, continuity,
  responsive overflow and reduced-motion checks.

No production dress requirement has been confirmed. The sample palette must be
reviewed by the couple before commercial release. The default image is original.
For *development-only visual comparison* with source-hosted images, append
`?dressReference=1`; do not redistribute their files without permission.

The source's exact CSS geometry, colours and animation timeline have **not**
been verified by side-by-side pixel screenshots, so **this is not yet an
exact/pixel-identical match**. A direct 390×844 reference/local comparison
and four-width review (320, 360, 390, 430) are the final fidelity gates.

## Local test
```powershell
cd D:\testing-4
git fetch origin
git switch feat/section6-dress-code-reference-20261103
powershell -ExecutionPolicy Bypass -File .\start.ps1
```
Then visit `http://localhost:8000`, open the invitation and scroll to Dress Code.
Run `npm install` and `npm run test:syntax` plus
`npx playwright test tests/section-six-dress.spec.mjs` to validate.
