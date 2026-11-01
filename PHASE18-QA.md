# Phase 18 — cross-browser, accessibility, and performance QA

This pass focuses exclusively on **Section 1** of the Celestial Lake mobile invitation.

## Automated scope

| Engine | Environment | What is covered |
|---|---|---|
| Chromium | Playwright Linux, 390×844, touch simulation | Native tap, keyboard, accessibility states, reduced motion, scroll, visual overflow and canvas density |
| Firefox | Playwright Linux, 390×844 browser viewport | Keyboard/screen-reader-ready semantics, CSS motion fallbacks, scroll and accessible link navigation |
| WebKit | Playwright Linux, 390×844, touch simulation | Safari-engine rendering behavior, keyboard, scroll, reduced motion, labels and focus |

The new independent suite is `npm run test:crossbrowser` and uses `playwright.crossbrowser.config.mjs`. The existing `npm run test:mobile` remains unchanged and verifies **the same exact artwork alignment** across 320px, 360px, 390px and 430px Chromium viewports.

### Accessibility controls

- A native button launches the invitation. When Enter/Space activates it, the closed cover becomes inert and focus moves to the newly available **Swipe up for wedding message** link.
- On touch activation, focus is not artificially moved.
- Scene artwork and butterflies remain decorative (`aria-hidden`) rather than cluttering screen-reader navigation.
- Names remain selectable text, not flattened into images.
- Under `prefers-reduced-motion: reduce`, the petal canvas, flower/butterfly movement and timed handwriting are disabled without losing any wedding details.
- Tappable controls should meet at least 44×44 CSS pixels. The 390px viewport should have no horizontal scrollbar.
- Keyboard focus must be visible, including the newly activated swipe link.

### Performance and compatibility

The existing petal canvas caps **draws to 30 per second** and its backing-store resolution to **2× device pixel ratio**. Its requestAnimationFrame loop halts for hidden pages, reduced motion, debug freeze and when Section 1 is nearly out of view. These are behavioral checks, **not** claims of a measured FPS, CPU, energy or memory improvement on actual mobile hardware.

The new tests compare the behavior of three browser engines but are **not** a replacement for a physical iPhone Safari / Android Chrome or actual VoiceOver / TalkBack testing.

## Physical-device acceptance

Before treating the prototype as production-ready, use the opt-in `?phoneqa=1` diagnostic on the same Wi-Fi as your computer. Test a real iPhone in Safari, an Android phone in Chrome, and screen-reader announcements if those devices are available. Verify portrait, rotate-to-landscape, an open/close interaction, the 4-viewport sticky garden, re-opening after back/forward navigation, and whether reduced motion disables only decorative animation.

Report performance with the actual phone model and browser; do not infer thermal stability, GPU usage or battery impact from the simulated Playwright sessions.

## Artwork / publication

The prototype still references illustrative WebP assets hosted by the original commercial template provider. GitHub Actions downloads them temporarily to verify this private development comparison. **Do not publish or resell the source assets without suitable rights.** Before Phase 19, substitute original licensed art or obtain permission, and verify attribution requirements. The completed invitation's subsequent sections are still outside this repo's scope.
