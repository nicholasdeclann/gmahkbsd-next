# Local dashboard — first implementation

With the local dev server running, `npm run test:dashboard` checks authentication,
cell validation, stale saves, persistence and public/private prayer notes. It
requires Node.js 22.18+ and refuses writes unless the server reports demo mode.

Run `npm ci`, configure `.env.development.local`, then `npm run dev` and open
`http://localhost:3000/admin`. All dashboard pages and management APIs require
the shared admin password. `ADMIN_SECRET` must contain at least 32 characters.
Password/secret changes invalidate existing signed sessions. Password sign-in
has a best-effort per-process throttle; production needs a Vercel/platform rate
limit shared across instances. There are no individual staff accounts.

## Local practice mode

Set `DASHBOARD_DEMO_MODE=true` only in `.env.development.local`. This mode is
enforced only when `NODE_ENV=development` and stores practice Kertas Acara and
prayer values in ignored `work/dashboard-demo.json`. It never calls Google or
Postgres for these flows. Practice announcements store image files under ignored
`work/announcements` and their metadata in the demo JSON. Delete
the demo JSON file to reset it. Demo hymn/date options are fixtures, not a live
copy of the workbook. Public Kertas Acara preview/export still uses the existing
live sources, so practice edits are not reflected in that preview.

## Google Sheets connection

Configure `GOOGLE_SERVICE_ACCOUNT_JSON` and explicitly share
the workbook with its service-account email. No staff Google sign-in is needed.
For local setup, keep `DASHBOARD_DEMO_MODE=true` and set
`GOOGLE_SHEETS_LIVE_MODE=true` to connect only Kertas Acara. Prayer/announcement data
stays in practice mode while its Sheets migration is unfinished. Production
never uses practice mode. Leave `GOOGLE_SHEETS_WRITES_ENABLED=false` while
checking the connection, then enable it once the workbook and access are verified.
To import a downloaded JSON key without copying secrets into shell history, run
`npm run connect:sheets -- "C:\path\to\downloaded-key.json"` (Node.js 22.18+).
It validates the key, verifies the configured workbook/tab IDs through a read-only
Sheets API call, and saves credentials to ignored `.env.development.local` only
after success. Other environment settings are preserved. The command enables
live reads for Kertas Acara, leaves live writes disabled, and never changes cell
contents. Restart the local server after importing, verify the form loads the
current spreadsheet data, then set `GOOGLE_SHEETS_WRITES_ENABLED=true`.
The form reads the configured `Kertas Acara` tab, `C2:C7`, `J6:J7`, valid dates
from `U81:U185`, and hymns from `Lagu Sion!B2:C526`. Start with a test copy: update
the liturgy/export IDs in `src/config/church.ts` together before enabling writes.

`GOOGLE_SHEETS_WRITES_ENABLED` defaults to false. When enabled, saving updates
only changed input cells, with an atomic Sheets batch restricted to
`userEnteredValue`. It preserves labels, date validation, formatting and all
other formulas. Date values use Sheets serial numbers without timezone shifts.
Input strings are literal text, never interpreted as formulas. Saving affects
the current live worksheet; there is no future-sermon draft store yet.

A revision comparison detects edits made since opening the form. It cannot
guarantee locking against a simultaneous Sheets editor between comparison and
write. Saves are read back and mismatches are reported. Existing arbitrary
formulas in input cells block editing rather than being overwritten.

## Drive connection

Configure OAuth credentials, `GOOGLE_OAUTH_BASE_URL`, and the intended Drive
folder. Register `<base-url>/api/drive/auth/callback` with Google. Only dashboard
settings can start the flow. The callback checks a short-lived OAuth state and
the admin session; credentials are encrypted in an HttpOnly cookie and refreshed
automatically for that browser. This is a transitional connection, not yet the
planned shared persistent integration store. `GOOGLE_DRIVE_REFRESH_TOKEN`, when
configured securely on the server, takes precedence and provides shared access.
The `drive.file` scope requires the target folder to be authorized for the app;
a folder ID by itself is insufficient. Give the service account Viewer access
to the dedicated announcement folder and enable Drive API for server-side public
reads. The OAuth connection needs write access to that same folder. No project
IAM roles are required. A shared server refresh token lets all password-authenticated
staff publish without making a separate Google connection in each browser.

## Announcement board

`/admin/photos` now manages the Papan Pengumuman Jemaat for every department.
Uploads accept JPG, PNG and WebP up to 4 MB, with an optional department label
(default `Umum`) and a description of up to 2,000 characters. Publishing is
immediate; drafts/scheduling are not implemented yet. Canva remains available.

New posts store the image, description and department in one Drive file creation,
using the file description and custom properties (`kind=gmahkbsd-announcement`,
`department`). No database is required for new posts. Images can remain private
in Drive: the public image endpoint serves only tagged images in the configured
folder, through the service account, and never arbitrary Drive file IDs. The
read permission is checked before publishing. Existing Postgres photo records
are included when the legacy database connection is configured; nothing is migrated
or deleted. The public board shows all departments, full-poster previews, and
copy/WhatsApp links to individual posts or the whole board. Editing captions is
password protected. Upload errors remain visible and never masquerade as success.

`npm run test:announcements` tests publishing, all-department visibility, public
images, caption editing and protected APIs using disposable local fixtures. It
refuses to publish unless the server reports local demo mode.

## Existing data and later phases

Prayer management uses the Sheets/Drive flow described below. Only optional legacy
photo metadata still uses the Postgres adapter. Existing database records are not
deleted. Public prayer responses omit private reasons and management metadata.

Canva announcements are preserved. Public pages no longer show Drive connection,
upload, or caption-edit controls. The caption API now checks the admin session.
Downloads, editable church information, quarterly source switching, and shared
persistent Drive-token management remain later phases. The dashboard requires
Next.js server hosting (Vercel); the legacy GitHub Pages static workflow does
not support it. No deployment or live workbook writes are part of local setup.

## Pokok Doa: four weekly slots

Prayer management now uses Google Sheets and Drive, without Postgres. The dashboard reads the service date from Kertas Acara C2 and the four names from B50:B53. Saving replaces those four cells only, writing `1. Name` through `4. Name`; blank slots clear their cells without shifting other slots or changing formatting. Existing spreadsheet names are retained and can still be edited directly in Sheets. Formula cells disable dashboard writes.

Reasons are stored separately in a private church-owned JSON file identified by `GOOGLE_PRAYER_NOTES_FILE_ID`, tagged `kind=gmahkbsd-prayer-notes`, and shared only with the dashboard service account as Editor. Keep this file outside the public announcement folder and never enable public/link or domain sharing. The service account accesses it directly, so prayer management does not depend on staff OAuth browser sessions. The file is initialized as `{ "version": 1, "date": "", "slots": [...] }`, with exactly four `{ "name": "", "note": "", "note_public": false }` entries.

Private reasons are returned only by the protected management endpoint. Public reasons require explicit opt-in and a matching name, slot, and service date. Direct spreadsheet name changes or a changed service date detach old reasons. The homepage shows names only for the current Sunday–Saturday week in Jakarta. Staff replace the four slots each week; there is no fifth entry or automatic deletion of spreadsheet names.

The protected `PUT /api/prayer/manage` accepts `{ revision, slots }`; stale revisions return 409. Earlier unlimited-add and per-entry mutation endpoints now return 409 after authentication rather than accessing a database. Existing legacy database records are left untouched, but are no longer displayed. No production database was configured during migration.

Sheets and Drive cannot share one transaction: reasons are saved first, then the four name cells, followed by verification. If either service fails, the form retains the draft and reports an error. Reload and review the latest values before retrying. Conflicts are checked immediately before saving but Google Sheets does not provide an atomic compare-and-swap for these two services.

Validation: `npm run test:prayer` covers slot limits, protected saves, public-note privacy, empty slots, and stale revisions. Run against a local practice server on port 3001, or set `DASHBOARD_TEST_URL`. Never run the smoke test against production.
