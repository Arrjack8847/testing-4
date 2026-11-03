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

## 4 November source screenshot and geometry audit

Completed run: https://github.com/Arrjack8847/testing-4/actions/runs/41696384616
Its GitHub Actions artifact contains 390px source/local screenshots and geometry JSON.

| Width | Reference height | First local height | Difference |
|---:|---:|---:|---:|
| 320 | 1042.52px | 1130.95px | +88.44px |
| 360 | 1012.83px | 1137.20px | +124.38px |
| 390 | 990.33px | 1119.84px | +129.52px |
| 430 | 922.73px | 1119.84px | +197.11px |

Both sides had the measured plum #5c264f and 96px/28px padding and zero
horizontal overflow. The source heading is 46px/52.9px Pinyon Script 400,
normal tracking, #f3dff0. The old local heading was 52px/59.8px with
the wrong color/tracking and 16px bottom margin.

Screenshot evidence shows source embossed floral plum art, an inset fine
double frame, pale text, drifting decorative petals, and a closed cream
SEND GIFT pill in the default view. The first local implementation showed
expanded bank cards and plain gradient artwork instead. The source uses
band_plum.webp and bfly_blush.webp, which are not licensed for distribution
by this repository.

Subsequent source-driven changes: 46px title, framed plum band, collapsed
and accessible Send Gift disclosure, original independent botanical SVG
fallback, responsive minimum-height calibration and reverse-scroll QA.
The new safe source click audit records the real Send Gift interaction without
initiating bank transfers, reservations, or checkout. Its result is pending.

The earliest focused QA run logged 84 passes and 8 failures: two test
assertions each failed on all four viewports (a strict-mode check on two
bank-copy buttons and a reveal-state regex matching the substring "in"
inside "heading"). Both checks were repaired after this run. Do not
claim the latest commit passes until its own QA completes.

A separate cross-engine Save the Date test fails because that legacy
section is intentionally hidden. It is outside Section 8 ownership.
No neighbor's content was edited to bypass it.

Remaining: review latest 390px screenshot overlays, bank popup behavior,
item geometry/typography, authorized photo/assets, petal/butterfly motion
and source-to-local exit after Gallery and before RSVP.
