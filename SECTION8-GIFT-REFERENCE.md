# Section 8 — Wedding Gift reference worker

Branch: feat/section8-wedding-gift-reference-20261104  
Base: feat/section7-gallery-reference-20261103 (keeps Section 7 worker untouched).

## Confirmed source identity and layout

The live public source includes the following visible sequence:

- Section 7: Our Gallery (light #faf7fb), ending with “Tap a frame to view”.
- Section 8: Wedding Gift, dark plum #5c264f with band_plum.webp; “Your presence...”, Send Gift (Maybank, CIMB), Gift Wishlist (Philips cooker, Philips kettle, IKEA Gift Card).
- Section 9: RSVP & Wishes.

The prior read-only 390×844 source audit recorded Gift document bounds Y=9404–10395, approximately 990px high *after images load*. The Gallery handoff confirmed both sections have 96px vertical/28px horizontal padding, no gap at their boundary, and the source Gift band artwork path /images/concierge/packs/tasik-kayangan/band_plum.webp. Source section ID #cgv-gift is reported in the handoff. Width and font metrics for *individual Gift cards*, canvas content, and Gift-specific animation easing were not independently established at the time this branch was created.

## Implementation

- Isolated #weddingGift / data-section=8 between the existing #gallery and #rsvp; only RSVP data-section was updated to 9. No Gallery, Dress Code or RSVP HTML body/CSS/JS overwritten.
- CSS source-confirmed dark plum, padding and seams, with original procedural fallback art. Neither the source band nor vendor thumbnails are committed or hotlinked.
- Authorized **local developer-only** comparison asset: assets/reference-dev/band_plum.webp; this folder is .gitignore'd. The browser attempts this local asset only on localhost/127.0.0.1 and falls back to independent CSS art if missing. Upload only when you have the rights.
- Two bank cards and three-item wishlist reproduce the source *content order*. Real bank numbers, holder data, purchase URLs and stock claims are omitted. All transfer and reservation actions are disabled without verification and a real backend. Optional bank copy becomes available when a pre-loaded window.WEDDING_GIFT_CONFIG.bankAccounts entry is explicitly verified=true and has validated bank, holder and number.
- Reversible per-element IntersectionObserver entrance: 52px below at 0.955 scale, 1s opacity / 1.1s transform. Reduced Motion removes transitions. These values are observed for the source Gallery/shared reference treatment, **not independently measured for the source Gift**; treat them as an approximation pending timed source inspection.

## Test / fidelity status

Focused four-phone functional tests: tests/section-eight-gift.spec.mjs.
Automated source/local audit: tools/audit-section8-live.mjs, captured screenshots and measurements under section8-evidence/ (workflow artifacts).
Workflow: .github/workflows/section8-gift-qa.yml.

The read-only Browser Use inspection attempted 2026-11-04 was blocked by insufficient credits. Older successful public-source measurements and text extraction supplied the geometry/content above. Detailed card metrics, end-to-end visual similarity, original media permissions and Gift-specific animation timeline **remain unverified**. Do not claim pixel-perfect parity. Do not merge this draft to main until review and cross-section QA pass.

Local review on the feature branch:
1. git fetch origin && git switch feat/section8-wedding-gift-reference-20261104
2. powershell -ExecutionPolicy Bypass -File .\start.ps1
3. Open http://localhost:8000/ and tap Open Invitation; scroll to Wedding Gift.
4. npm install && npx playwright install chromium && npx playwright test tests/section-eight-gift.spec.mjs

When permitted local WebP is available, compare with reference at 390×844 from Gallery exit through Gift and RSVP entry. Keep any vendor artwork privately stored.
