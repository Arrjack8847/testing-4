# Section 10 — Main integration (4 November 2026)

The closing section already existed on main and was kept intact. This update advances **only Section 10 visual alignment, local-reference artwork staging, and Section 10 QA**. It does not replace index.html or any earlier section's assets, scripts, or CSS.

- Reference: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en
- Latest validated feature commit: 603fc607aa1d2382a7ca7ff15c2d56e67144b7af
- Feature QA: https://github.com/Arrjack8847/testing-4/actions/runs/41755699619 (three completed successful jobs)
- Closing-section geometry at 390×844: height difference -0.41px, frame X difference 0px and width difference 0px, message X difference 0px and height difference 0px. Contacts and footer still have measured vertical differences and need further review.
- Original reference artwork (25 WebPs, including scene.webp) is already in assets/shared-artwork-20261104, but is not re-committed to main.
- On Windows in the current checkout, run powershell -ExecutionPolicy Bypass -File .\stage-section10-art.ps1 -AllReferenceLayers for local-only reference study. The staged path assets/reference-dev/ is Git-ignored.
- For visual browser comparison, run node tools/section10-compare.mjs in a local environment with Playwright and Python available, with the staged WebP present.
- The reference includes third-party artwork. Verify permission before commercial use or public redistribution; an existing public GitHub upload alone does not demonstrate permission.
- Accuracy is measured but not yet claimed to be pixel-perfect. Source-specific branding/footer and disabled placeholder contact links remain intentionally different.
