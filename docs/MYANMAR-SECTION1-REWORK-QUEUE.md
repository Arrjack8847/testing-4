# Myanmar Luxury — Section 1 original-art correction queue

**Approach: Option A, strict 1:1 replacement.** This brief describes corrections to export canvases, transparent padding and motif locations **inside the WebP files**. It does not authorize editing CSS, JS, camera timing or production code. See the [full 27-file audit](../reports/myanmar-section1-asset-audit.md).

The figures below are normalized image alpha bounds at threshold 24/255. They compare source-image canvas placement, not browser screen position. A difference is a review flag, not proof that an asset is visually wrong.

## Priority 1 — Rebuild the scene silhouette

| Image | Old source bounds | Myanmar bounds | Production-art adjustment |
|---|---|---|---|
| `arch.webp` | y 0–100% | y 13–59% | Restore the gateway's full-frame vertical coverage on the original 1080×1920 canvas, including transparent gaps |
| `tree_l.webp` | y 0–100% | y 6–40% | Repopulate original tree branch/trunk coverage across the 1080×1920 canvas; remove the abrupt lower cutoff |
| `tree_r.webp` | y 0–100% | y 6–40% | Restore original right-tree coverage and soft edges, independently of left tree |
| `reeds.webp` | y 51–100% | y 85–100% | Extend the foreground art farther upward on the original full canvas |
| `drape.webp` | y 0–58% | y 0–15% | Restore long hanging canopy coverage and top-anchored silhouette |
| `peacock.webp` | y 0–100% | y 38–99% | Restore visible head/tail scale within the original 741×1401 image envelope; inspect both mirrored instances |

**Important limitation:** Under Option A the reeds/ground layer is animated away early. Placing a permanent stone path inside that layer will *not* make it stay permanently visible. A persistent pathway would require accepting original motion limitations or separately authorizing Option B.

## Priority 2 — Return flower and plant heights to source bounds

- `spike_3.webp`, `spike_4.webp`, `spike_5.webp`: original coverage begins at canvas top; Myanmar begins around y 43%, 51%, 53%. New plants are much shorter within unchanged canvases.
- `hang_1.webp`: old ends near y 99%, Myanmar y 62%. Restore its long hanging strand while keeping the top pivot.
- `hang_4.webp`: old x 23–99%, Myanmar x 31–66%. Its horizontal coverage is materially narrower.
- `hang_3.webp`, `stem_1.webp`, `stem_2.webp`, `leaf_4.webp`, `leaf_5.webp`: review the alpha envelopes and correct subject placement, matching original bottom/top anchors.
- `hang_2.webp`: smaller 6.1% envelope drift, lower priority.

## Priority 3 — Correct native canvas sizes

| Asset | Old original image | Myanmar current image |
|---|---:|---:|
| `leaf_6.webp` | 287×600 | 417×320 |
| `bloom_1.webp` | 338×516 | 329×320 |
| `bloom_2.webp` | 384×556 | 254×320 |
| `bloom_5.webp` | 306×509 | 367×360 |
| `bloom_6.webp` | 324×518 | 373×360 |
| `bfly_1.webp` | 256×204 | 312×246 |
| `bfly_white.webp` | 256×195 | 312×246 |

Repaint/re-export the art in exact original-size canvases with compatible visible-object scale and alpha placement. Do **not** fill the frame by arbitrarily stretching the entire image. Both butterflies must also pass a human check of the mirrored half-wing CSS system.

## Priority 4 — Fine-tune remaining images

- `palace.webp`: original building visible from y ~31%; Myanmar from y ~38%, despite both being 1920×1920. Reposition artwork *within the WebP*, not by moving the DOM element. Test pavilion roof at cover and after tap-to-open.
- `bloom_1/2/5/6.webp`: after restoring native canvases, check bottom pivots, mirrored occurrences and peacock overlap.
- `scene.webp` and `sky.webp` have comparable 1080×1920 geometry, but this **does not** confirm equal layout or color harmony.

## Recommended production process

1. Freeze source geometry from `scene.js` and `styles.css`, and use the measured target size + old visible alpha envelope for each art brief.
2. Repaint or recrop the **Myanmar artwork**, not the original provider image. Maintain original filenames, image roles and mirror/top-bottom pivots.
3. Create a new art-correction branch based on [strict replacement PR #78](https://github.com/Arrjack8847/testing-4/pull/78). Preserve every old version for comparisons.
4. Rerun the [read-only audit](../tools/myanmar-section1-geometry-audit.py), then inspect cover, opened, 0.45H, 1.5H, 2.15H and reverse-scroll phone captures. Equal alpha bounds alone do not guarantee a good visual match.
5. Validate iPhone Safari repeated scrolling, actual renderer/GPU memory residency, butterfly wing motion and commercial artwork rights before production.

**No code edits, merges to main, or asset rewrites were performed as part of this audit.**
