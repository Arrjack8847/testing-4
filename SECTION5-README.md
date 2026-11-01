# Section 5 — Our Memories Gallery

The fifth mobile section is an **original gallery design**, not an exact or verified reproduction of the commercial template's fifth section.

## Behavior

- One large portrait frame and four smaller frames in a balanced two-column arrangement.
- Continuity with Section 4's lilac–ivory–gold palette, drawn entirely in CSS.
- Five clearly labeled photo placeholders. **No sample people or fictional couple photographs** are inserted into the site.
- A card is disabled unless its corresponding local image successfully loads.
- Once a real image loads, tapping the frame opens a native accessible photo dialog with previous/next, Arrow keys, Escape to close, touch swipe, and focus restoration.
- A broken/missing image shows the placeholder, never a browser broken-image icon.
- All photos are local-only. This section does not request any third-party photos, social profiles or external storage.
- Artwork-loading starts when the gallery approaches the viewport; the decorative reveal is disabled under Reduce Motion.
- The gallery is inaccessible while the invitation is still on the closed cover.

## Adding approved photographs

Put **five** appropriately licensed and consented images in `assets/gallery/`:

```
assets/gallery/photo-01.webp
assets/gallery/photo-02.webp
assets/gallery/photo-03.webp
assets/gallery/photo-04.webp
assets/gallery/photo-05.webp
```

The first image is the featured portrait. The remaining four are supporting images. Aim for a 4:5 or portrait crop and keep critical faces away from frame edges. Since the rendering uses `object-fit:cover`, review facial cropping at 320px, 360px, 390px, and 430px.

Edit the `PHOTOS` array near the beginning of `section-five.js` to replace **generic alt text** with truthful descriptions and, if appropriate, change the captions. For commercial use, only use images the couple authorized for this invitation. Keep local paths inside `./assets/gallery/`; other or external paths are rejected.

While photographs are absent, the five slots remain disabled and labeled as awaiting photographs. That is intentional.

## Files

- `index.html`: gallery markup and native dialog after Section 4.
- `section-five.css`: isolated gallery, decoration, viewer and reduced-motion rules.
- `section-five.js`: local photo loader and viewer interactions.
- `tests/section-five.spec.mjs`: four phone widths, placeholder/failure state, injected synthetic WebP QA and viewer accessibility.
- `tests/cross-browser.spec.mjs`: empty-gallery behavior checked on Chromium, Firefox and WebKit.

## QA / release

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Open `http://localhost:8000`, tap **Open Invitation**, and scroll through Section 5. Missing photos do not prevent layout testing.

The original reference-provider artwork in Section 1 still requires redistribution/commercial-use clearance. The new gallery does not change or resolve that restriction. Photos and actual wedding data must be verified before public release.
