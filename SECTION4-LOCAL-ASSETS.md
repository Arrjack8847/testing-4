# Section 4 — exact source asset staging (development only)

**Scope:** Section 4 `#eventDetails` only. Source observation is from an earlier reference CSS/DOM audit, not a fresh live browser inventory.

The measured Events section uses:

| File | Exact public source | Visual role |
|---|---|---|
| `paper.webp` | https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp | Events paper/background, source natural size 1080x1920 |
| `arch_event.svg` | https://undangankahwin.com/images/concierge/packs/tasik-kayangan/arch_event.svg | Decorative border around each of two event cards |

The legacy `arch_panel.svg` was incorrectly used in an earlier iteration; `arch_event.svg` superseded it. A hidden `bfly_white.webp` element is requested by the prototype, but the previous DOM audit did not find a visible butterfly in Events, so it is not in this staging list.

## Private local staging

Only if you have authorization to obtain and use these artwork files:

~~~powershell
cd D:\testing-4
git fetch origin
git switch audit/section4-source-art-local-20261104
git pull --ff-only origin audit/section4-source-art-local-20261104
powershell -ExecutionPolicy Bypass -File .\download-section4-reference.ps1 -IHavePermission
powershell -ExecutionPolicy Bypass -File .\download-section4-reference.ps1 -VerifyOnly
powershell -ExecutionPolicy Bypass -File .\start.ps1
~~~

Open http://localhost:8000/. Section 4 prefers locally staged assets when they load, with a remote-URL fallback if they are missing. The local files are intentionally ignored by Git at `assets/reference-dev/`; do not commit or redistribute them.

When `-IHavePermission` is set, the script refreshes from the exact source URLs, validates WebP/SVG structure and prints SHA-256 hashes. `-VerifyOnly` checks file format and hash locally, but does not prove identity with the source unless it has just been fetched.

## Still unresolved

- The live source was not newly inspected in this pass (browser access was unavailable).
- Additional decorations/fonts not exhaustively inventoried; CSS petals still exist.
- Four-phone tests and exact screenshot raster comparisons not rerun on this branch.
- Commercial permission for source-owned artwork not established.

Do not claim exact 1:1 parity until all blockers are resolved.

## Full four-phone artwork inventory (read-only)

The two identified files are not guaranteed to be the *complete* artwork set.
Run this audit on a computer that can access the live reference and your local
`http://localhost:8000/` preview. It does **not** save the provider's images:

~~~powershell
cd D:\testing-4
npm install
npx playwright install chromium
# Start .\start.ps1 in a separate terminal before auditing
node .\tools\section4-exact-asset-audit.mjs
~~~

The script checks the public `#cgv-events` source and local `#eventDetails`
at 320×568, 360×740, 390×844 and 430×932. At each size it visits
three scroll positions (top, middle, bottom), so lazy-loaded/deferred
source artwork can be detected rather than omitted by a top-only scan. It inspects image sources,
CSS background/border/mask/content URLs (including pseudo-elements), fonts,
CSS-drawn moving elements and recorded network outcomes.

The resulting private file is `section4-exact-audit/section4-original-assets.json`.
Read `differences[].referenceAssetsNotMatchedByFilename` first, followed by
`entries[].inventory.assets` and `visibleFonts`. An unavailable live page
is reported as an error, never treated as a passing exact-asset check.

**Limit:** matching filenames cannot prove identical bytes or correct camera,
opacity, masking, animation, appearance, or usage rights. After inventory,
verify the permitted originals by hash and run screenshot comparison. Original
CSS petal silhouettes remain approximate until inspected and resolved.


## Byte-for-byte identity proof for the two identified assets

After permitted local staging, run this independent read-only hash checker:

~~~powershell
cd D:\testing-4
node .\tools\section4-source-hashes.mjs
~~~

Its ignored local report is `section4-exact-audit/section4-source-hashes.json`.
`EXACT_MATCH` means source and local bytes had identical SHA-256 hashes in
this check. `BYTE_MISMATCH` means they differed, and `UNVERIFIED` means
source access or a local file was missing. This check does **not** download
artwork to disk or include vendor assets in GitHub. Exact byte identity for
these two files cannot establish that the entire section has all original
artwork, fonts, animations, or pixel-identical rendering.

## Four-phone, 12-frame screenshot parity pass

Start the local server in one PowerShell terminal, then in another run:

~~~powershell
cd D:\testing-4
node .\tools\section4-visual-parity-4phones.mjs
~~~

The comparison captures the live `#cgv-events` and local `#eventDetails`
at 320×568, 360×740, 390×844 and 430×932, at the top, middle and bottom
of each section: **12 paired frames**. It uses a common viewport, reduced
motion and Malaysian time zone. Reports and screenshots stay only in
the gitignored `section4-exact-audit/` folder:

- `section4-visual-parity.json` — event height delta and pixel error
  within the *overlap* of the visible Events boundaries.
- `screenshots/reference-...png` and `screenshots/local-...png`
  — paired frames for manual analysis.

The score is not the sole pass criterion: vendor chrome/overlays, ticking
countdown values, lazy-loaded animation and font rendering can introduce
pixel differences. A failed source page produces an incomplete report,
not an artificial pass. Recheck the reference visually at the same scroll
positions, and separately verify full interactions and seam behavior.

**Do not merge PR #35 solely because the local files loaded.** Both
byte-identity and all 12 visual comparisons must be checked, and any
remaining original artwork/decorations must be inventoried.


## Exact-source audit acceptance gate

A matching filename is **not sufficient**. The updated asset auditor compares
source URL identities (allowing only the documented locally staged
`paper.webp` and `arch_event.svg` mappings) and checks each observed image
for a successful network response. Hidden fallback images and pseudo-elements
are excluded from the visible asset inventory. Review these JSON fields:

- `referenceAssetsNotMatchedBySourceIdentity`: actual source URLs absent from the local rendering
- `sourceAssetsWithoutSuccessfulLoad` and `localAssetsWithoutSuccessfulLoad`: failed or unverified source requests
- `localAssetsNotMatchedBySourceIdentity`: local illustration assets not found on the reference

**None of these checks replaces the SHA-256 file identity test or full visual
comparison.** If the live source cannot load, the audit must remain incomplete.
