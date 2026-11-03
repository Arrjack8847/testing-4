# Section 7 → Section 8 integration handoff (verified against live reference)

**Owner:** Gallery worker (Section 7), branch `feat/section7-gallery-reference-20261103`.  
**Scope:** planning and boundary evidence only; no changes to another worker's Section 6/8 code, no merge to `main`.

## Source order is confirmed

At the live Tasik Kayangan mobile preview, the DOM order is:

1. `#cgv-dress` — **Dress Code**.
2. `#cgv-gallery` — **Our Gallery**.
3. `#cgv-gift` — **Wedding Gift**.

The current Gallery development branch instead has `#dressCode` (Section 6),
`#gallery` (Section 7), then `#rsvp` (Section 8). This is a **known
integration mismatch**, not a Gallery CSS defect.

The source **Wedding Gift** is a plum-colored illustrated band with
`band_plum.webp` as a background layer (source asset reference:
`/images/concierge/packs/tasik-kayangan/band_plum.webp`). Its source
background color is `rgb(92,38,79)` (`#5c264f`).

Avoid using that third-party artwork in commercial builds without appropriate
permission. Use locally stored authorized WebP art for the production Gift band.
There is no new downloaded WebP committed by this handoff.

## Measured mobile boundary

From read-only browser audit
[GitHub Actions 41683117308](https://github.com/Arrjack8847/testing-4/actions/runs/41683117308):

| Measurement | Reference 390px | Reference 320px |
|---|---:|---:|
| Dress Code background | `#faf7fb` | `#faf7fb` |
| Gallery background | `#faf7fb` | `#faf7fb` |
| Wedding Gift background | `#5c264f`, WebP band | `#5c264f`, WebP band |
| Between Dress and Gallery | 0px | 0px |
| Between Gallery and Gift | 0px | 0px |
| Gallery and Gift side padding | 28px | 28px |
| Gallery and Gift vertical padding | 96px | 96px |
| Gallery's final hint | `Tap a frame to view` | same |
| Gift heading | `Wedding Gift` | `Wedding Gift` |

**Caution about source section heights:** the initial boundary audit was run
before the reference's lazy images were reliably in view and reported Gallery
heights smaller than the fully loaded photo audit. Do **not** use those
unloaded heights as final geometry targets. The previous Gallery visual tests
measured all five frames after loading; those metrics remain authoritative
for the Gallery itself.

## Safe integration contract

- Keep the Gallery as Section 7 and preserve its local-only files:
  `assets/gallery/photo-01.webp` through `photo-05.webp`.
- Insert the **Wedding Gift** implementation immediately after the Gallery
  and before RSVP. The Gift worker should own that new section; coordinate
  the canonical section number and whether RSVP becomes Section 9.
- Do not remove or silently rename existing RSVP work. When renumbering,
  audit anchors, section headings, navigation, CSS, script selectors and
  test expectations together.
- Keep the local WebP assets in GitHub only if you own or have permission to
  publish them. Third-party comparison photos in
  `assets/gallery/reference/` are Git-ignored.
- Section 6's **bottom edge** should end in the same `#faf7fb` background
  as Gallery; its current gradient ends differently. Coordinate any change
  with the Dress Code worker instead of overriding its CSS from this branch.
- Section 7's **bottom** is solid `#faf7fb`; the source transitions to
  Gift's plum band at exactly the next section boundary without an extra
  interstitial margin/overlay. The Gift worker should implement its own
  dark hero band and entrance.
- Use a dedicated cross-section smoke test to verify no horizontal overflow,
  0px DOM boundary gap, correct 6→7→8 order, and no broken local image requests.

## What is ready and what is blocked

**Ready:** Gallery frame layout, styling, captions, local-WebP loading,
independent reveal/replay, gallery viewer interactions, dedicated 4-width
Playwright QA. Latest focused Gallery run:
[41682077521](https://github.com/Arrjack8847/testing-4/actions/runs/41682077521)
(passed).

**Blocked:** pixel-exact Gallery photographs/crops until five authorized local
WebPs are supplied; full sequence fidelity until the Gift section is
integrated; Dress Code/Gallery shared paper color until the Section 6 worker
approves their change.

This handoff does not deploy or merge any code.
