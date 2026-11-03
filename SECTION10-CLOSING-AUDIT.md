# Section 10 — Tasik Kayangan closing scene audit

Date: 4 November 2026. Source: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en

## Live 390 × 844 source observations

A read-only Playwright browser executed successfully on GitHub Actions (run [41695486443](https://github.com/Arrjack8847/testing-4/actions/runs/41695486443), job \`closing-reference\`). It captured source-only screenshots at entry/quarter/middle/exit and 0/1/3/5 seconds, plus JSON with computed styles and media inventory.

| Source element | Observed computed style/geometry |
| --- | --- |
| \`.cgv-closing\` | Width 390px; height 1109.41px; #F2ECF3; padding 215px 28px 230px |
| \`.cgv-inner\` | Width 334px; positioned at X=28; height ~664.4px |
| \`.cgv-tframe\` | Left ~30px; width ~330px; height ~688px; border #7e64794d |
| Top label | Uppercase EB Garamond 11px/18.15px, letter spacing 4.95px |
| Message | EB Garamond 18px/29.7px, muted plum #6f5a6c, ~292px wide |
| Horizontal rule | ~76px wide, one-pixel mauve gradient |
| Signoff | Uppercase EB Garamond 11px/18.15px, letter spacing 4.95px |
| Names | Pinyon Script 56px, #5c264f, stacked within ~216px transformed height |
| Contacts | CALL and WHATSAPP, 42px high source buttons |
| Footer | Tiny uppercase letterspaced provider credit |
| Scene | Sticky 390 × 844 img, \`scene.webp\`, source natural 1080 × 1920 |

The source used staggered entrance transitions: initial opacity 0, translateY(52px), scale(.955); opacity .8s and transform .9s with cubic-bezier(.22,.9,.24,1). Observed delays included 0ms, 100ms, 220ms and 340ms. The final visible state had opacity 1 and no transform.

**Dynamic-content caveat:** An earlier source inspection recorded document height 12721px and closing section starting at Y=11612px. The latest source run recorded document height ~12456px and closing start at Y=11346px. The same ~1109px section height remained. The ~265px offset is consistent with observed dynamic lazy-load shifts. Compare using section-relative positions, not fixed absolute page Y.

## Implemented scope

- Replaced *only* existing \`#closingMessage\` contents and attached \`section-ten.css\`, \`section-ten.js\` in the continuation branch. Other workers' section source files are not edited.
- Reproduced closing copy, source color/typography/relative geometry, 330 × 688 frame, corners, 76px rule, signoff, stacked names, contact labels/buttons and footer placement.
- Source-branded vendor credit is **not** presented as our own. Distinct prototype credit and disclosure are used.
- Contact controls intentionally disabled: no approved customer phone or WhatsApp numbers exist.
- JavaScript controls a source-like sticky background offset with section-relative clamping, IntersectionObserver visibility, frame/text reveal, reduced-motion changes and cover-state gating. Motion pauses when not visible.
- Default background uses *original* repo SVG/garden art. To preview a WebP which the developer has independent rights to use, privately stage \`assets/reference-dev/scene.webp\` and append \`?section10LicensedArt=1\`. The original vendor WebP is not in Git and is not fetched by default.

## Verification status

**Visual accuracy:** Source geometry **measured**; visual/pixel comparison with approved original vendor art remains **not verified**. Original fallback artwork necessarily differs from the source. The footer attribution is intentionally different and contact controls are non-functional.

**Functional tests:** \`tests/section-ten.spec.mjs\` covers 320×568, 360×740, 390×844, 430×932; order and seam, text/buttons, page overflow, dimension tolerance, scroll camera reversibility, visibility stopping and Reduced Motion. Do not mark passed until current head GitHub Actions checks complete. The source-metrics runner had passed before the final code was added.

## Local

\`\`\`powershell
git fetch origin
git switch feat/section10-closing-reference-20261104
git pull --ff-only origin feat/section10-closing-reference-20261104
powershell -ExecutionPolicy Bypass -File .\start.ps1
\`\`\`

Open http://localhost:8000, choose **Open Invitation**, and scroll to the very bottom.

Run \`npm install\`, \`npx playwright install chromium\`, then \`npx playwright test tests/section-ten.spec.mjs\`.

Do not merge into \`main\` until the latest Section 9 worker branch is integrated without overwrites and the paired reference/local screenshot review is approved.
