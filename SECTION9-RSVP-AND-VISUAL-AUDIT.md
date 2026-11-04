# Section 9 RSVP & Wishes — local storage and production plan

## What works locally

With Python installed, stop any old \`python -m http.server\` process on port 8000, then run \`powershell -ExecutionPolicy Bypass -File .\start.ps1\` from the repository root. Open \`http://localhost:8000/\`.

Unlike the previous prototype, **Send RSVP** now POSTs to \`/api/rsvp\`; only a confirmed server save displays "RSVP received". The saved records remain in a private Git-ignored SQLite database \`.private/rsvps.sqlite3\`. The local server binds to \`127.0.0.1\` by default, not your Wi-Fi interface, and never exposes a guest-list endpoint.

Guests must explicitly opt in before a wish can be displayed publicly. Even with consent, it remains **pending** until approved. New approved wishes are shown on \`/api/wishes\`; all other guest response data is private.

### Owner commands (from repository root)

- \`py tools/rsvp-admin.py list\` — inspect receipts, attendance and consent privately
- \`py tools/rsvp-admin.py approve <receipt-uuid>\` — approve only a wish with consent
- \`py tools/rsvp-admin.py reject <receipt-uuid>\` — hide a wish
- \`py tools/rsvp-admin.py delete <receipt-uuid>\` — delete the entire guest response
- \`py tools/rsvp-admin.py export\` — private CSV at \`.private/rsvp-export.csv\`

After approving, reload the website to see the approved wish. Do not commit or share \`.private\` or guest response exports.

### Tests

- \`python3 -m unittest discover -s tests -p 'test_rsvp_api.py' -v\`
- \`node --test tests/rsvp-serverless.test.cjs\`
- \`npx playwright test tests/section-nine.spec.mjs tests/section-ten.spec.mjs\`

## Production setup — not enabled yet

The **current repository is not attached to a dedicated live database or Vercel project**. Existing connected Supabase projects serve other applications and were left unchanged. A deployable Vercel API has been committed under \`api/\`, but it refuses to accept writes until you configure **a dedicated Supabase project**, apply \`database/rsvp_schema.sql\` and provide these Vercel server-only environment variables:

- \`SUPABASE_URL\` — your new project's API URL
- \`SUPABASE_SECRET_KEY\` — server-only credential; never expose in HTML/JS
- \`TURNSTILE_SECRET_KEY\` — server-side Cloudflare Turnstile secret
- \`TURNSTILE_SITE_KEY\` — public Turnstile site key
- \`ALLOWED_ORIGINS\` — comma-separated explicit HTTPS origins where your invitation is hosted

Do not enter real guest data on a public preview until the functions and database are deployed, HTTPS is enabled, an owner reviews database access permissions, the anti-spam challenge is verified, and the submission flow passes a production test. Turnstile is mandatory in the serverless route. The public frontend fetches its site key from \`/api/rsvp/status\`; secrets never enter the browser.

Use the Supabase dashboard to review, approve, delete or export production responses. Database Row Level Security is enabled and anon/authenticated roles have no direct table grants. Owner access is deliberately not available through public HTTP routes.

## Frame-sampled visual parity

\`.github/workflows/section9-rsvp-backend-parity.yml\` stages original vendor WebPs **ephemerally** for private read-only comparison, then captures **21 paired screenshots** at source and local section entry/middle/exit, across matched elapsed timings. It writes per-frame pixel MAE and overlays into a CI artifact without committing or redistributing the source files.

The goal is to **measure** deviations; it does not assert a zero pixel error. Fonts, anti-aliasing, dynamic animations, interactive consent UI, and unavailable redistribution rights can prevent exact frame-level equality. A successful functional test is **not** proof of visual equality.
