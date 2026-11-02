# Section 1 → 2 transition and Section 2 → 3 boundary QA

**Date:** 2026-11-02
**Reference:** Tasik Kayangan English mobile invitation
**Scope:** testing-4 mobile prototype at 320×568, 360×740, 390×844 and 430×932.

## Verified browser result

[Four-phone boundary QA — passed](https://github.com/Arrjack8847/testing-4/actions/runs/41415125698)

- Eight browser tests passed. Each viewport checks 2.25H, 2.50H, 2.75H, 2.95H, 3.00H, reverse scroll to 2.75H/2.25H and forward again to 3H.
- Sticky lake retains top: 0 through the 3H boundary. The track occupies 4H with -1H overlap, so the mauve section starts at document y=3H.
- The mauve band covers the bottom 25%, 50%, 75%, 95%, and 100% respectively at 2.25H/2.5H/2.75H/2.95H/3H.
- Scene art remains pinned; ceremony text travels upward independently. Reverse scrolling retains geometry.
- Mauve section stacks above lake; scene ambient pauses at full coverage.
- No horizontal overflow, JavaScript page errors or document layout gaps were found.
- The Section 2 bottom meets the current Section 3 top within 1 CSS pixel at all four widths.

## Screenshot review

The GitHub Actions artifact holds 24 screenshots: 20 transition checkpoints (five unique scroll ratios × four widths) plus four existing Section 2→3 boundary screenshots.

Visual inspection of the 390px and 320px contact sheet shows the mauve band gradually covering the illustrated lake with no empty white gap or obvious left/right edge shift.

**Aesthetic limitation:** at exactly 3H on 390×844, Section 2 is approximately 762px tall. The bottom ~82px already shows the next section. This matches the measured reference section length (762.4px), but the present independent lilac events design contrasts with the mauve band. Next visual work belongs in Section 3, not an artificial Section 2 height extension.

## QA test correction

The first draft falsely flagged the frame left edge because the hidden pre-reveal frame temporarily has CSS scale(.985). The test was corrected to inspect offsetLeft/offsetWidth of the layout box. The existing Section 2 suite separately checks frame dimensions after its entrance animation.

Only testing and documentation files changed. No production HTML/CSS/JS or Section 1 animation code was changed in this branch.

## Next — reference Section 3: The Couple

The original reference next displays The Couple with a floral canopy, cream architectural arch and two portrait cards. The current testing-4 Section 3 instead shows The Celebration date/venue panel. Build a new reference-structured Couple section before the events details, retaining the existing working date, venue and map features after it. First capture the exact art layers, responsive layout and entry motion at four viewport sizes.

## Release warning

This verifies mobile layout and reference-style mechanics, not pixel-perfect artwork or commercial-use rights. Reference-owned WebPs and hotlinks require replacement or authorization before a commercial release. Physical iOS Safari and Android Chrome QA is still outstanding.