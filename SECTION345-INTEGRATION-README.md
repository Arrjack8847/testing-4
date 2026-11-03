# Sections 3–5 — Integrated mobile reference preview

**Scope:** Read-only source comparison and an integration test of two existing
development branches. This branch does not replace the Section 4 or Section 5
workers' branches and has no changes on main.

## Exact section sequence on localhost:8000

1. Section 3: approved The Couple reference scene from current main.
2. Section 4: Akad Nikah and Wedding Reception with 4-unit countdown,
   actual live-reference paper, individually framed ceremonies and
   scroll-reversible text.
3. Section 5: dark-plum Running Order / Order of the Day with six sample
   schedule items, as implemented in draft PR #16.
4. The former Save the Date scene remains in the DOM for legacy test mode,
   but is hidden by default because the Events section already has a timer.
5. The original Gallery currently follows; a separate worker must handle
   the next reference Dress Code section before claiming full-site parity.

All sections use a single URL: http://localhost:8000/

## Source-verified boundary colors — not a bug

Measured read-only with Chromium on the public Tasik Kayangan page and
compared with the prototype at four mobile viewport widths.

- The original Couple → Events boundary is a **hard artwork cut** from
  the colored lakeside garden to pale ivory paper. Both sections are
  adjacent with a true 0px geometry gap. At 390px the measured source
  center 4px-band RGB before/after was about [142,143,134] →
  [239,233,231], mean RGB step ~94.7/255. Therefore adding an arbitrary
  fade to hide the jump would NOT match the reference.
- The original Events → Order of the Day boundary is an even stronger
  deliberate jump from ivory to dark plum. At 390px the center 4px-band
  was about [238,231,228] → [64,30,48], mean step ~185/255. The old
  prototype incorrectly showed a lavender Save the Date scene at this
  point, which had a step of ~20/255. That old scene was the real
  content mismatch, not a missing margin or broken camera layer.
- No geometric gaps or horizontal overflow were measured at the
  prototype's Section 3→4 boundary on 320, 360, 390 and 430px.
- See the 7-day expiring GitHub Actions artifact at
  https://github.com/Arrjack8847/testing-4/actions/runs/41677045983
  for actual reference and old-prototype seam screenshots and metrics.

## Branch and test strategy

The integration preview was assembled from the current Section 4
reference branch + the Section 5 work of draft PR #16. It retains
the approved main Section 3 edge/overscan correction. It also fixes
the Section 5 camera diagnostic when switching to Reduce Motion.

- Branch: feat/section345-integration-preview-20261104
- Section 4 draft PR: https://github.com/Arrjack8847/testing-4/pull/14
- Section 5 draft PR: https://github.com/Arrjack8847/testing-4/pull/16
- Focused tests: tests/section345-integration.spec.mjs
- Four-phone integration workflow:
  .github/workflows/section345-integration-qa.yml

**Artwork and licensing:** The source-owned imagery is research-only and
not automatically licensed for commercial redistribution. The Section 5
reference band file is deliberately not committed; the worker branch
requires user-permitted local assets for exact visual comparison.
A CSS-only dark plum original fallback is provided. This integrated
preview is not a finished commercial invitation and no pixel-perfect
claim is made.

## Run locally

    git fetch origin
    git switch feat/section345-integration-preview-20261104
    git pull --ff-only origin feat/section345-integration-preview-20261104
    powershell -ExecutionPolicy Bypass -File .\start.ps1

Open http://localhost:8000/ and inspect both ceremony/background seams.
