# Phase 20 — licensed artwork migration plan

This phase prepares **the first mobile section only** to receive independently licensed or original artwork without changing the approved HTML/CSS/JS animation choreography.

## Artwork slots

The current implementation uses **25 unique WebP filenames** from `ASSET-MANIFEST.txt` but renders some of them multiple times. Two other externally referenced butterfly images appear directly in `index.html`. There are therefore **27 externally sourced image slots** to resolve before independent publishing. Count refers to image identities, not DOM sprites or actual asset ownership.

| Group | Filename slots | Notes |
| --- | --- | --- |
| Full scene / landscape | scene, sky, palace, reeds, arch, tree_l, tree_r, drape | Preserve transparent-canvas layout when replacing |
| Hanging flowers | hang_1 through hang_4 | Separate anchor rotations and timings |
| Plants | spike_3, spike_4, spike_5, stem_1, stem_2 | Repeat/mirror in layout |
| Leaves and blossoms | leaf_4, leaf_5, leaf_6, bloom_1, bloom_2, bloom_5, bloom_6 | Separate subtle sway |
| Peacocks | peacock | Mirrored to form pair |
| Butterflies | bfly_1, bfly_white | Two external URLs presently embedded in HTML |

The first eight landscape files are **not** equivalent interchangeably cropped photographs; their exact transparent space is part of camera alignment. `palace.webp` has a separate square source canvas; peacock and butterfly sprites have their own proportions. Treat filename matching as necessary but not sufficient.

## A controlled migration

1. Create or license 27 replacement WebPs with the corresponding layer role, transparency, and carefully aligned compositional canvas. Do not copy the competitor's artwork or trace its designs without permission.
2. Place the 25 scene images into `assets/` with names matching `ASSET-MANIFEST.txt`; place the butterfly replacements into the same folder with names `bfly_1.webp` and `bfly_white.webp`.
3. Run `python3 tools/asset-migration-audit.py`. This command is read-only and does not download or upload any assets. You may target a different location using `--art-dir`.
4. Once assets are **visually reviewed**, change the two butterfly `--fly-image` values in `index.html` to relative local URLs, and retire the remote-fallback references in `scene.js`. These changes are deliberately **not yet applied** because the replacement files are absent.
5. Recheck the resting cover, 0.25H, 0.45H, 0.75H, 1.50H, and completed writing. Watch for frame mismatch, cropped peacocks, opaque artwork edges, and off-center waterfalls.
6. After substitutions, run `python3 tools/check-release.py` and the mobile / cross-browser suites. Technical checks do not replace an artwork license review or physical-device QA.

## Safety rule

Never put the original provider's artwork into a public Git commit merely to pass the readiness checker. Keep this repository as a comparison prototype until the replacement artwork is approved. The tester intentionally does not alter the active animation or any deployed URL.
