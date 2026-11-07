# Myanmar Luxury — Section 1 strict 1:1 asset geometry contract

**Current chosen approach: Option A.** Replace only the 27 image files. Keep CSS and JS positioning, scale curves, animation timings, classes, mirroring and viewport behavior byte-for-byte unchanged. The master image is a reference, not a reason to change the animation.

## Contract source
- Source of truth: [scene.js](../scene.js) definitions and [styles.css](../styles.css).
- Required scene names: [ASSET-MANIFEST.txt](../ASSET-MANIFEST.txt) (25); butterflies are two further named slots.
- Original artwork sizes and visible alpha bounds must be **measured from the source assets**, not guessed from the intended art direction. The two original butterfly image URLs are referenced by `index.html` and belong to separate art packs.
- New visual equivalents live at `assets/skins/myanmar-luxury/<same filename>`. The skin loader already supports `?skin=myanmar-luxury` without vendor fallback for scene assets.
- **Do not add an extra pathway sprite, adjust pavilion translate, retouch CSS or recolor global petals.** Those are Option B changes and would break the strict experiment.

## Fixed scene geometry

- Reference artwork stage: 1080×1920 (9:16), bottom-aligned phone stage, width `max(100%, 56.25lvh)`.
- `scene.webp`: full flattened 9:16 fallback, same visual object locations as the assembled animation at the corresponding camera state.
- `sky.webp`: entire scene background, centered on same 9:16 coordinates.
- `palace.webp`: image anchored horizontally at center and vertically to bottom, displayed at cover scale 0.66 and opened scale 0.99. Its **transparent padding and building placement inside the canvas** are critical. Do not recenter the building differently.
- `reeds.webp`: foreground at viewport base, early movement and fade; any path painted solely in `reeds.webp` will disappear during opening/retreat.
- `arch.webp`: bottom-centered gateway frame; cover normal, opened zoom 2.6 and fade, returns between .84H and 1.42H.
- `tree_l.webp`, `tree_r.webp`: each a 1080×1920 transparent canvas in the existing template, rendered 70lvh tall, bottom 4lvh; keep exact trunk/branch alpha location and clean edge alpha. CSS sway pivots are left 18%/12%, right 82%/12%.
- `drape.webp`: center/top canopy; CSS top -11lvh, width 104vw; top-anchored floral movement.
- `hang_1–4.webp`: upper hanging garlands, top pivot. Several files are reused on both sides with CSS mirroring.
- `spike_3–5.webp`, `stem_1–2.webp`: lower plants, bottom pivot. Image's visible stem-base must stay fixed within its canvas.
- `leaf_4–6.webp`, `bloom_1/2/5/6.webp`: lower leaf/bloom sprites, reused and mirrored at original JS coordinates.
- `peacock.webp`: a *single* image reused at x=20% and x=80%, one side mirrored. Both instances must look correct.
- `bfly_1.webp`, `bfly_white.webp`: image content compatible with the original two-half-wing CSS system, unlike an ordinary complete butterfly illustration. CSS butterfly envelopes 52×41 and 44×34.

## Animation invariants

- **Cover** shows the already-layered scene when art is ready, not a guaranteed static image. The still `scene.webp` is fallback/master. 
- **Tap** animates into the original garden camera, without editing any timing curves.
- **0.22H–0.72H** pavilion scroll retreat; **0.84H–1.42H** arch and trees return.
- **0.47H–0.78H** lower flowers return; **1.06H–1.44H** peacocks become visible.
- **1.37H–1.67H** greeting and subsequent name handwriting; **~2.42H** details; **3H** Section 2 overlays hero.
- Original water glow, waterfall/mist, mauve petals and other reference-era art effects are **known limitations of Option A**, not automatically corrected.

## Audit output

The companion [read-only audit script](../tools/myanmar-section1-geometry-audit.py) writes:
- `reports/myanmar-section1-asset-audit.md` — 27-row geometry comparison and repeated-sprite instance table
- `reports/myanmar-section1-asset-audit.json` — machine-readable alpha-bounds, sizes and flags

These are diagnostic reports. An image may pass dimensional checks but still be visually unsuitable, especially when the artist placed the motif in a different area of the same-size transparent canvas.

## Strict acceptance gate

1. 27 required slots present and decodable.
2. Real old/new source dimensions and visible alpha envelopes compared.
3. Divergent assets explicitly listed for **re-cropping/re-rendering**, never fixed by moving CSS under Option A.
4. Cover/entered/scroll/reverse-scroll captures pass at 320, 360, 390 and 430 px plus a short iPhone browser height.
5. Mirrored peacock + both half-wing butterflies visually verified; no visible hard-cut seams.
6. iPhone Safari repeated scroll and performance checked; image rights reviewed before a commercial launch.

**This branch contains audit tooling and documentation only. It does not alter the 27-asset strict-replacement PR, main or the production website.**
