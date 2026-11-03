# Section 7 — RSVP & Wishes reference-structured prototype

Source: https://undangankahwin.com/concierge-templates/cg-tasik-kayangan?lang=en

## Verified text and structural order (3 November 2026)

The publicly indexed reference shows: an RSVP deadline, **RSVP & Wishes** heading,
guest name input, attendance select, guests select, optional wish, Send RSVP action,
then a public-facing wishes wall with three example messages. The reference
continues to an "Until we meet" closing after the wishes.

The live source could not be loaded in an interactive screenshot browser during
this implementation, so exact fonts, colors, dimensions, artwork and animation
timing are **not verified**. This is a structurally closer prototype, **not a
pixel-perfect match**.

## This branch changes only Section 7

- `index.html`: replaces the old RSVP-only composition with the reference
  field order, separate sample wishes wall and closing.
- `section-six.css`: adds Section 7-specific mobile presentation and maintains
  the shared mauve seam color at the Section 6 → 7 boundary.
- `section-six.js`: switches the attendance radio group to a required
  accessible select, preserving guest-count behavior and local-only preview.
- `tests/section-six.spec.mjs` and `tests/cross-browser.spec.mjs`:
  update form interaction and heading assertions.

## Privacy and safety

There is **no working RSVP backend**. Submitting the form locally only shows
a preview and optionally allows copying text. The action is labeled
**Preview RSVP — not sent**, deliberately differing from the reference's
**Send RSVP** to avoid implying delivery. No messages appear on the wall
after preview. Three wishes shown in this prototype are invented design
examples, not authentic guests or saved records. Do not present them as real.

Date and all sample copy are placeholders and must be configured before
shipping a client's invitation.

## QA target

At 320×568, 360×740, 390×844 and 430×932:
- check opening gate, field focus, required fields, attendance choice,
  disabled/enabled guest count, blank-name rejection, preview and reset
- ensure wishes wall and header never overlap, no horizontal overflow
- inspect Section 6 → Section 7 seam and reverse-scroll transition
- confirm reduced motion displays all content and does not animate decorations
- check iOS Safari and Android Chrome on real phones where available

## Local test

```powershell
cd D:\testing-4
git fetch origin
git switch feat/section7-rsvp-wishes-reference-prototype-20261103
git pull origin feat/section7-rsvp-wishes-reference-prototype-20261103
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

Open http://localhost:8000 and scroll to **RSVP & Wishes** after opening the invitation.

Keep this branch separate from `main` and Sections 1–6 until side-by-side
live-reference visual verification and test results pass.
