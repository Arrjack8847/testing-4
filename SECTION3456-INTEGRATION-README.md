# Sections 3–6 integrated reference preview

This branch is a **temporary research integration** combining latest approved Sections 1–4 (main) with the worker implementations of Section 5 (Order of the Day) and Section 6 (Dress Code). It does not modify main or either worker branch.

## Single localhost preview sequence

1. Opening lake and letter (latest main).
2. The Couple (Section 3, latest main).
3. Akad Nikah + Wedding Reception and countdown (Section 4, latest main).
4. **Order of the Day** (Section 5): six source-ordered timeline rows, a custom original plum-embossed SVG, butterfly/petal motion and Reduced Motion support. The reference has a dark-plum botanical panel rather than the legacy lavender Save the Date scene.
5. **Dress Code** (Section 6): source example's two families, six palette swatches, measured semi-transparent cards and staggered reveals.
6. Existing Gallery (renumbered Section 7) and RSVP (renumbered Section 8).

The previous Save the Date remains in the DOM but is hidden by default; optional URL query ?legacySaveDate=1 reveals it for regression testing only.

## Source continuity and licensing

- Tasik Kayangan's Couple-to-Events cut changes from a painted lake scene directly to pale invitation paper. Events-to-Order cuts directly from ivory to dark plum. These are intentional source transitions, **not** layout gaps.
- The prior source/prototype seam audit is at
  https://github.com/Arrjack8847/testing-4/actions/runs/41677045983.
- Section 5 uses original SVG artwork in this snapshot. Source-owned comparison WebP assets are not committed; ?orderReference=1 requires a person with rights to stage them locally.
- Section 6 layout, cards, colors and typography were previously measured against the source. Its botanical background and animation remain approximations; ?dressReference=1 is developer comparison only.
- Public reference assets and sample names/dates are not automatically licensed for commercial use. Replace source-owned assets with original or properly licensed visuals and confirm actual event content before selling this invitation.
- No pixel-perfect claim is made based on mobile browser tests alone.

## Branches and testing

Integration: feat/section3456-integration-preview-20261104

Section 5 worker PR: https://github.com/Arrjack8847/testing-4/pull/16

Section 6 worker: feat/section6-dress-code-reference-20261103

To preview in PowerShell, stop the existing server with Ctrl+C, then:

    cd D:\testing-4
    git fetch origin
    git switch feat/section3456-integration-preview-20261104
    git pull --ff-only origin feat/section3456-integration-preview-20261104
    powershell -ExecutionPolicy Bypass -File .\start.ps1

Open http://localhost:8000/

Tests (after npm install):

    npm run test:syntax
    npx playwright test tests/section3456-integration.spec.mjs tests/section5-order-of-day.spec.mjs tests/section-six-dress.spec.mjs --workers=2

The four-phone CI workflow is .github/workflows/section3456-integration-qa.yml.
