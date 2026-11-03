# Section 3 — The Couple (single-URL reference-recreation prototype)

## Default behavior

The approved Tasik Kayangan reference-based Section 3 is now the **only active Section 3 view** on the local website:

- http://localhost:8000/
- http://localhost:8000/?coupleReference=1 (old bookmarks still work but no longer change the result)

The `coupleReference` URL flag is **not checked** by the code. `#couple` starts in `data-art="reference"` state before deferred JavaScript executes; reference art is configured on every normal page load. Sections 1 and 2 and the existing Sections 4–7 have not been modified.

Old original-art SVG files remain in the repository for historical purposes but are **not displayed or used as portrait fallbacks**. A transparent placeholder is used if an external example portrait fails to load, avoiding a broken-image icon or substitution of the retired illustrated style. `data-reference-photo-fallback` is exposed on affected portraits for debugging. No third-party photos are committed into the repository.

## Reference artwork inventory

The Section 3 reference comparison uses the same local scene.webp as Section 1 when available, with the reference host used as a fallback. The two example portraits remain remote, and the arch is still externally referenced. These are three visual WebP roles and one SVG border:

| Role | Source URL |
| --- | --- |
| Lake/garden | `https://undangankahwin.com/images/concierge/packs/tasik-kayangan/scene.webp` |
| Groom example portrait | `https://undangankahwin.com/images/concierge/couples/moody-groom.webp` |
| Bride example portrait | `https://undangankahwin.com/images/concierge/couples/moody-bride.webp` |
| Arched panel border | `https://undangankahwin.com/images/concierge/packs/tasik-kayangan/arch_panel.svg` |

This is a **development-comparison prototype**, not an authorization to commercially copy or redistribute third-party artwork, photography or identities. Use licensed/original material before publication. Remote image serving and hotlink restrictions can affect the rendered result.

## Measured mobile layout and motion

At 390×844 CSS pixels, the original reference Section 3 runs from approximately y=3294.4 to y=5134.1 (about 1840px tall). The live DOM has a 52px Pinyon Script couple title, portraits approximately 240.5×332.7px, a carved arch between x=12 and x=378, and portrait reveal animations. The first card starts approximately 359px below Section 3 start; the second at 1116px.

The independent reference camera is driven by a clamped 0.0427px-per-scroll-pixel interpolation, measured from these original site checkpoints:

| Document scroll Y | Approximate camera displacement |
| --- | --- |
| 2743px | −44.8px |
| 3165px | −26.8px |
| 3587px | −8.8px |
| 4220px | +18.2px |

The background painting now extends 64px above and below the viewport-sized camera box. Its original transform geometry remains unchanged while the extra artwork covers the measured −44.8px to +20px vertical drift, avoiding empty 40–45px strips. It uses the locally available Section 1 `assets/scene.webp` first; when absent, JavaScript selects the original reference URL.

Its DOM/CSS implementation is an approximation of measured behavior, **not a claim of pixel-perfect source DOM parity**. Reverse scrolling recomputes the background displacement; Reduced Motion disables extra camera movement and fades.

## Verification

Run the single canonical URL `http://localhost:8000/`, click **Open Invitation** and scroll to Section 3. The section reports:

- `data-art="reference"` — reference layout always active.
- `data-reference-scene-source` — `local`, `remote`, or `unavailable`; the first-scene local painting is preferred.
- `data-reference-webp-count` — count of the three WebPs that actually loaded (0–3).
- `data-reference-webp-state` — `loading`, `ready` or `partial`.
- `data-reference-webp-missing` — unavailable asset keys, if any.
- `data-reference-camera-offset` — current calibrated camera displacement.

Playwright coverage is provided by `tests/section-couple.spec.mjs` for 320×568, 360×740, 390×844 and 430×932 layouts, including forward/reverse camera sampling, section adjacency, image roles, reduced-motion accessibility, and matching behavior of the no-flag URL and legacy flag URL.

Test outcomes depend on the environment. Do not treat a passing syntax check as proof that all remote art is visible or all animations have passed browser-level QA.
