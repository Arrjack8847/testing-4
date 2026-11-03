# Section 5 reference feature — Wedding Gift & Wishlist

Scope: Tasik Kayangan **Wedding Gift** reference-recreation *prototype* in
`Arrjack8847/testing-4`, built on the isolated Section 4 PR #14 branch.

## Source observation (3 November 2026)

The read-only public source at
https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en
places a Wedding Gift section **after Gallery and before RSVP**, approximately
document Y 9404–10395 (about 990px at a 390×844 viewport). It contains:
a heading/introduction; a Send Gift area with two bank-copy controls;
a three-item gift wishlist with shop/reservation states; and floral/lilac decoration.
This is a feature label from the **reference**, not a claim that repository
`data-section=5` is the Gift block (that number already denotes the original
Save the Date countdown). The inserted Gift block is `data-section=7`;
the original RSVP becomes 8. Section 4, Save the Date and Gallery remain intact.

## Recreated, safely

- Source-inspired composition, original CSS ornament and 990px baseline,
  with responsive layout at 320, 360, 390 and 430.
- Motion uses scroll rAF, ±20px botanical displacement, reversible 52px/0.955
  element entrances, and Reduced Motion support. No persistent animation loop.
- Cover gating uses `inert` and `aria-hidden` until the invitation opens.
- Both reference bank labels and all three wishlist item titles are displayed
  as *examples*. **No real account numbers, holder details, live merchant
  checkout URLs or confirmed stock counts** are asserted. Copy/purchase/reserve
  controls are intentionally disabled pending verified customer records and
  a real reservation service. No fake transactions are stored or submitted.
- Default renders original CSS thumbnails. `?giftsReference=1` optionally
  requests two public vendor product thumbnails for visual comparison;
  loading failures show original CSS placeholders. No vendor image bytes
  are committed, and this does not authorize commercial reuse.

## Files and QA

- `index.html`: inserts Wedding Gift between Gallery and RSVP.
- `gift-reference.css` and `gift-reference.js`: scoped visual/interaction code.
- `tests/section5-gifts-reference.spec.mjs`: four-phone accessibility,
  geometry, source order, safe controls, reverse-scroll, and Reduce Motion.
- `tests/section-six.spec.mjs`: update RSVP adjacency/section number.
- `.github/workflows/section5-gifts-qa.yml`: isolated Actions test suite.

Local test (after checking out this branch):

```powershell
npm install
npx playwright install chromium
npm run test:syntax
npx playwright test tests/section5-gifts-reference.spec.mjs tests/section-five.spec.mjs tests/section-six.spec.mjs --workers=2
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

The reference's exact camera/typography/assets still need side-by-side visual
comparison. The prototype is not a licensed commercial reproduction. Do not
merge until the head-specific QA passes.
