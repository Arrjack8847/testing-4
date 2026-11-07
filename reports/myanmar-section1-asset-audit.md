# Myanmar Luxury Section 1 — 27-asset geometry audit

> Read-only diagnostic. Option A freezes existing positions, CSS, JS, scrolling and animation timing.
> A green geometry comparison does NOT verify visual semantics or commercial image rights.
> Snapshot from [GitHub Actions run #42393689107](https://github.com/Arrjack8847/testing-4/actions/runs/42393689107) against strict asset swap commit `ace335cf269e9fc8a33c31445280f079b322f206`.

## Source and evaluation method

- New art: `assets/skins/myanmar-luxury/` from the strict 1:1 replacement branch.
- Animation slots: `scene.js` definitions and inherited `styles.css`.
- Reference: original 25 source-slot WebPs downloaded **only inside CI for metrics**, never committed or included in outputs; the two butterfly originals were sourced from their separately referenced artwork packs.
- For each image: real decoded dimensions, alpha presence, visible alpha bounding box (threshold 24/255), edge coverage and theoretical RGBA decode footprint.
- Strict compatibility is NOT implied by matching filenames. Normalized alpha-bounds movement >=4% prompts review; >=8% is high priority. Art differences can still be significant at 0%.

## Artwork-by-artwork results

| Old slot = New Myanmar asset | Role | Old canvas | New canvas | Old visible alpha bounds | New visible alpha bounds | Max alpha drift | Instances / mirrored | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| `scene.webp` | master scene | 1080×1920 | 1080×1920 | 0.00, 0.00, 1.00, 1.00 | 0.00, 0.00, 1.00, 1.00 | 0.0% | 0 / no | **GEOMETRY OK** |
| `sky.webp` | background | 1080×1920 | 1080×1920 | 0.00, 0.00, 1.00, 1.00 | 0.00, 0.00, 1.00, 1.00 | 0.0% | 1 / no | **GEOMETRY OK** |
| `palace.webp` | architecture | 1920×1920 | 1920×1920 | 0.00, 0.31, 1.00, 1.00 | 0.03, 0.38, 0.98, 1.00 | 7.0% | 1 / no | **REVIEW** |
| `reeds.webp` | foreground ground | 1080×1920 | 1080×1920 | 0.00, 0.51, 1.00, 1.00 | 0.00, 0.85, 1.00, 1.00 | 34.2% | 1 / no | **REVIEW** |
| `arch.webp` | foreground gateway | 1080×1920 | 1080×1920 | 0.00, 0.00, 1.00, 1.00 | 0.02, 0.13, 0.94, 0.59 | 41.1% | 1 / no | **REVIEW** |
| `tree_l.webp` | left tree | 1080×1920 | 1080×1920 | 0.00, 0.00, 0.76, 1.00 | 0.00, 0.06, 0.84, 0.40 | 60.0% | 1 / no | **REVIEW** |
| `tree_r.webp` | right tree | 1080×1920 | 1080×1920 | 0.07, 0.00, 1.00, 1.00 | 0.01, 0.06, 1.00, 0.40 | 60.0% | 1 / no | **REVIEW** |
| `drape.webp` | upper canopy | 1080×1920 | 1080×1920 | 0.00, 0.00, 1.00, 0.58 | 0.00, 0.00, 1.00, 0.15 | 43.3% | 1 / no | **REVIEW** |
| `hang_1.webp` | hanging flower | 420×784 | 420×784 | 0.23, 0.00, 0.99, 0.99 | 0.16, 0.00, 0.89, 0.62 | 37.6% | 2 / yes | **REVIEW** |
| `hang_2.webp` | hanging flower | 330×900 | 330×900 | 0.22, 0.00, 0.99, 1.00 | 0.19, 0.01, 0.93, 0.96 | 6.1% | 2 / yes | **REVIEW** |
| `hang_3.webp` | hanging flower | 296×900 | 296×900 | 0.02, 0.00, 0.97, 1.00 | 0.12, 0.01, 0.92, 0.96 | 10.1% | 2 / yes | **REVIEW** |
| `hang_4.webp` | hanging flower | 439×900 | 439×900 | 0.23, 0.00, 0.99, 0.99 | 0.31, 0.01, 0.66, 0.95 | 33.3% | 2 / yes | **REVIEW** |
| `spike_3.webp` | ground plant | 254×900 | 254×900 | 0.02, 0.00, 0.93, 1.00 | 0.04, 0.43, 0.96, 0.99 | 42.9% | 1 / no | **REVIEW** |
| `spike_4.webp` | ground plant | 238×900 | 238×900 | 0.03, 0.00, 0.98, 1.00 | 0.09, 0.51, 0.93, 0.99 | 50.3% | 1 / no | **REVIEW** |
| `spike_5.webp` | ground plant | 262×900 | 262×900 | 0.08, 0.00, 0.98, 1.00 | 0.00, 0.53, 0.95, 0.99 | 53.0% | 2 / yes | **REVIEW** |
| `stem_1.webp` | ground plant | 365×900 | 365×900 | 0.02, 0.00, 0.98, 1.00 | 0.03, 0.14, 0.89, 1.00 | 13.2% | 1 / no | **REVIEW** |
| `stem_2.webp` | ground plant | 420×900 | 420×900 | 0.01, 0.00, 0.92, 1.00 | 0.10, 0.15, 0.94, 0.99 | 14.9% | 1 / yes | **REVIEW** |
| `leaf_4.webp` | lower leaf | 287×600 | 287×600 | 0.22, 0.01, 0.99, 1.00 | 0.14, 0.06, 0.85, 0.98 | 13.6% | 1 / yes | **REVIEW** |
| `leaf_5.webp` | lower leaf | 228×600 | 228×600 | 0.02, 0.01, 0.97, 1.00 | 0.13, 0.05, 0.85, 0.98 | 12.7% | 2 / yes | **REVIEW** |
| `leaf_6.webp` | lower leaf | 287×600 | 417×320 | 0.20, 0.01, 0.99, 1.00 | 0.01, 0.02, 0.99, 0.98 | 18.4% | 1 / no | **REVIEW** |
| `bloom_1.webp` | lower bloom | 338×516 | 329×320 | 0.02, 0.01, 0.96, 1.00 | 0.02, 0.02, 0.98, 0.98 | 1.9% | 2 / yes | **REVIEW** |
| `bloom_2.webp` | lower bloom | 384×556 | 254×320 | 0.02, 0.01, 0.94, 1.00 | 0.02, 0.02, 0.98, 0.98 | 4.7% | 2 / yes | **REVIEW** |
| `bloom_5.webp` | lower bloom | 306×509 | 367×360 | 0.02, 0.01, 0.97, 1.00 | 0.01, 0.01, 0.99, 0.99 | 1.9% | 2 / yes | **REVIEW** |
| `bloom_6.webp` | lower bloom | 324×518 | 373×360 | 0.02, 0.01, 0.97, 1.00 | 0.01, 0.02, 0.99, 0.99 | 1.4% | 2 / yes | **REVIEW** |
| `peacock.webp` | mirrored birds | 741×1401 | 741×1401 | 0.00, 0.00, 1.00, 1.00 | 0.00, 0.38, 0.97, 0.99 | 37.5% | 2 / yes | **REVIEW** |
| `bfly_1.webp` | butterfly wing | 256×204 | 312×246 | 0.01, 0.01, 0.98, 0.99 | 0.04, 0.06, 0.96, 0.87 | 11.5% | 0 / no | **REVIEW** |
| `bfly_white.webp` | butterfly wing | 256×195 | 312×246 | 0.02, 0.02, 0.98, 0.98 | 0.04, 0.06, 0.96, 0.87 | 11.5% | 0 / no | **REVIEW** |

## Precise runtime geometry for each repeated image

The coordinates are from `scene.js`: x in viewport %, y in *--unit* from the top for hanging sprites and bottom for foreground sprites; h is sprite height in *--unit* (unit = min(1lvh, 2.164vw)). These are original source positions, **not recommendations for new CSS**.

| File | Instance | x | y | h | Pivot | Mirror | Sway (degree / duration) |
|---|---:|---:|---:|---:|---|---|---|
| `sky.webp` | 1 | CSS | CSS | CSS | bottom | no | — / — |
| `palace.webp` | 1 | CSS | CSS | CSS | bottom | no | — / — |
| `reeds.webp` | 1 | CSS | CSS | CSS | bottom | no | — / — |
| `arch.webp` | 1 | CSS | CSS | CSS | bottom | no | — / — |
| `tree_l.webp` | 1 | CSS | CSS | CSS | bottom | no | — / — |
| `tree_r.webp` | 1 | CSS | CSS | CSS | bottom | no | — / — |
| `drape.webp` | 1 | CSS | CSS | CSS | bottom | no | — / — |
| `hang_1.webp` | 1 | 4 | -3 | 36 | top | no | 2.462268041237113 / 3.4337078651685395s |
| `hang_1.webp` | 2 | 80 | -5 | 21 | top | yes | 3.1876288659793817 / 4.1977528089887635s |
| `hang_2.webp` | 1 | 12 | -4 | 28 | top | no | 2.7958762886597937 / 2.89438202247191s |
| `hang_2.webp` | 2 | 72 | -6 | 14 | top | yes | 2.465979381443299 / 3.6584269662921347s |
| `hang_3.webp` | 1 | 20 | -5 | 22 | top | no | 2.0742268041237115 / 4.35505617977528s |
| `hang_3.webp` | 2 | 96 | -3 | 34 | top | yes | 1.8416494845360822 / 3.2764044943820223s |
| `hang_4.webp` | 1 | 28 | -6 | 15 | top | no | 3.352577319587629 / 3.8157303370786515s |
| `hang_4.webp` | 2 | 88 | -4 | 28 | top | yes | 1.909278350515464 / 2.737078651685393s |
| `spike_3.webp` | 1 | 13 | 4 | 36 | bottom | no | 2.0148453608247423 / 3.8606741573033707s |
| `spike_4.webp` | 1 | 95 | 4 | 42 | bottom | no | 1.5096907216494846 / 3.3213483146067415s |
| `spike_5.webp` | 1 | 5 | 4 | 44 | bottom | no | 1.1199999999999999 / 2.4s |
| `spike_5.webp` | 2 | 87 | 4 | 35 | bottom | yes | 2.404536082474227 / 2.7820224719101123s |
| `stem_1.webp` | 1 | 9 | 2 | 26 | bottom | no | 2.7134020618556702 / 4.242696629213484s |
| `stem_2.webp` | 1 | 91 | 2 | 26 | bottom | yes | 1.9917525773195877 / 3.703370786516854s |
| `leaf_4.webp` | 1 | 55 | -1 | 8 | bottom | yes | 1.8268041237113404 / 4.085393258426966s |
| `leaf_5.webp` | 1 | 36 | -1 | 10 | bottom | no | 3.270103092783505 / 3.1640449438202247s |
| `leaf_5.webp` | 2 | 64 | -1 | 10 | bottom | yes | 3.105154639175258 / 3.546067415730337s |
| `leaf_6.webp` | 1 | 46 | -1 | 8 | bottom | no | 2.5484536082474225 / 2.6247191011235955s |
| `bloom_1.webp` | 1 | 47 | -2 | 8 | bottom | no | 1.6618556701030929 / 2.4674157303370787s |
| `bloom_1.webp` | 2 | 61 | -2 | 10 | bottom | yes | 2.218556701030928 / 3.3887640449438203s |
| `bloom_2.webp` | 1 | 23 | -1 | 8 | bottom | no | 2.0536082474226807 / 3.7707865168539323s |
| `bloom_2.webp` | 2 | 77 | -1 | 8 | bottom | yes | 2.6103092783505155 / 2.692134831460674s |
| `bloom_5.webp` | 1 | 39 | -2 | 10 | bottom | no | 2.3835051546391752 / 3.006741573033708s |
| `bloom_5.webp` | 2 | 53 | -2 | 8 | bottom | yes | 2.9402061855670105 / 3.928089887640449s |
| `bloom_6.webp` | 1 | 31 | -2 | 9 | bottom | no | 3.331958762886598 / 3.2314606741573035s |
| `bloom_6.webp` | 2 | 69 | -2 | 9 | bottom | yes | 1.888659793814433 / 4.152808988764045s |
| `peacock.webp` | 1 | 20 | -2 | 40 | bottom | no | 2.4478350515463916 / 2.8494382022471907s |
| `peacock.webp` | 2 | 80 | -2 | 40 | bottom | yes | 1.9426804123711339 / 4.310112359550562s |

## Original choreography contract — not to be changed under Option A

- Pavilion: bottom-centered image, cover scale ~0.66, opens to ~0.99, retreat begins 0.22H and ends 0.72H.
- Gateway: normal frame on cover, expands to 2.6× and fades at open, reappears between 0.84H and 1.42H.
- Trees: 70lvh tall, anchored 4lvh above bottom, existing CSS sway/pivots; open scale ~2.1 and fade, return by 1.42H.
- Hanging canopy and garlands: top pivot, existing wind; canopy opens at scale 2.2 and returns to 1 by 1.42H.
- Low plants, leaves, peacocks: bottom-anchored image slots; foreground flowers return ~0.47H–0.78H; peacocks appear 1.06H–1.44H.
- Butterflies: `bfly_1.webp` 52×41 CSS body envelope and `bfly_white.webp` 44×34; CSS mirrors two half-wings. Wing art needs manual shape inspection.
- Names: greeting fades 1.37H–1.67H; scripted names and details continue until ~2.42H; Section 2 covers hero by 3H.
- Original reference lake waterfalls, mist/glow, pink petals and other source-era effects remain under strict Option A; list as creative limitations, do not silently edit.

## Asset-level deviations and manual gates

- **palace.webp** — ALPHA BOUNDS DRIFT >= 4%.
- **reeds.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **arch.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **tree_l.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **tree_r.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **drape.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **hang_1.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **hang_2.webp** — ALPHA BOUNDS DRIFT >= 4%.
- **hang_3.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **hang_4.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **spike_3.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **spike_4.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **spike_5.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **stem_1.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **stem_2.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **leaf_4.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **leaf_5.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **leaf_6.webp** — CANVAS DIMENSIONS DIFFER; ALPHA BOUNDS DRIFT >= 8%.
- **bloom_1.webp** — CANVAS DIMENSIONS DIFFER.
- **bloom_2.webp** — CANVAS DIMENSIONS DIFFER; ALPHA BOUNDS DRIFT >= 4%.
- **bloom_5.webp** — CANVAS DIMENSIONS DIFFER.
- **bloom_6.webp** — CANVAS DIMENSIONS DIFFER.
- **peacock.webp** — ALPHA BOUNDS DRIFT >= 8%.
- **bfly_1.webp** — CANVAS DIMENSIONS DIFFER; ALPHA BOUNDS DRIFT >= 8%; WING STRUCTURE REQUIRES VISUAL CHECK.
- **bfly_white.webp** — CANVAS DIMENSIONS DIFFER; ALPHA BOUNDS DRIFT >= 8%; WING STRUCTURE REQUIRES VISUAL CHECK.

## Acceptance before production

- [ ] Every non-background object matches the old slot's normalized object envelope or the owner explicitly accepts the drift.
- [ ] Original and new cover screenshots compared at exactly the same 320×568 / 360×740 / 390×844 / 430×932 layouts.
- [ ] Tap-to-open, 0.45H, 1.5H, 2.15H and reverse scroll visually checked (browser tests cannot alone prove alignment).
- [ ] Pair of mirrored peacocks, both butterfly half-wing sources, and alpha/cutoff seams visually approved.
- [ ] Decoded image residency and repeated iPhone Safari/Telegram scrolling checked on a physical phone.
- [ ] Original artist rights and any default-page remote provider dependencies reviewed before commercial release.
