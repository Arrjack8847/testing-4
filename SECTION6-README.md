# Section 8 — Guest RSVP and Attendance Preview (legacy file names)

The RSVP scene is a **mobile-first RSVP interface**. It is a functional local preview, **not a production RSVP collection service**. It follows the Dress Code and Gallery, without changing previous animation files.

## What guests can do in the prototype

- Enter a name (required; whitespace-only names are rejected).
- Choose **Joyfully accepts** or **Regretfully declines** (required).
- Choose 1–5 guests only when attending; declining resets and disables the guest count.
- Optionally add a message of up to 300 characters.
- Tap **Preview RSVP — not sent** to see a structured summary of their entered response.
- Tap **Copy RSVP text** and manually paste it into their own message. The page does not know the couple's contact information and does not pick any destination.

The copyable text and preview both explicitly say the response has **not been sent**. Browser-native required controls validate input before preview. Editing any field hides an outdated preview.

**No backend, no network submission, no localStorage, no analytics, and no saved attendance records** are implemented. The data only exists in the current open page; resetting the invitation clears the form and preview.

## Production integration is a separate step

Before changing this into a real RSVP collection workflow, choose a trustworthy and authorized endpoint or messaging destination, establish secure HTTPS processing, a privacy notice, spam and abuse controls, and consent appropriate to the actual recipients. Then implement real success/error states driven by confirmed server responses. Do not label local previews as accepted submissions or ask people to type private information into a site that implies a destination has been connected.

No recipient URL, WhatsApp number, email or guest database has been invented.

## Files

- `index.html` — original RSVP scene and accessible fields, initially inert until the invitation opens.
- `section-six.css` — isolated lavender–ivory design, ornamental motion, touch targets and reduced-motion rules.
- `section-six.js` — form validation, attendance/guest-count logic, local-only preview, optional copy and reset-on-cover.
- `tests/section-six.spec.mjs` — browser checks at four mobile widths, validation, declines, preview/copy availability and privacy reset.
- `tests/cross-browser.spec.mjs` — three-engine RSVP accessibility test.

## Test locally

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

At `http://localhost:8000`, tap **Open Invitation**, scroll past **Dress Code** and **Our Memories** to **Kindly Respond**, then try both attendance options and the preview. No message will be submitted.

For automated tests, after installing the Playwright dependencies:

```powershell
npm run test:syntax
npm run test:mobile
npm run test:crossbrowser
```

This RSVP section is an original design and has not been verified as a pixel-accurate counterpart of the commercial reference. Section 1 artwork licensing and authentic wedding details are still required for commercial release.
