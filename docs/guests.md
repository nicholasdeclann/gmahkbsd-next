# Daftar Tamu

This feature is being reviewed locally. It has not been deployed or tested against live church Drive permissions.

## Routes and access

- `/tamu`: password-free usher editor, linked from the protected dashboard menu and through a password-free shortcut on the dashboard login page. It is not linked in public site navigation or footer.
- `/tamu/mc?date=YYYY-MM-DD`: separate read-only screen, refreshed automatically every 15 seconds. Copy this link using **Salin Tautan MC**. Date is pinned in shared links.
- Both pages are excluded from search indexing and have their own staff header. No Google sign-in is needed by ushers or the MC.
- These are unlisted, unauthenticated pages, not private access-controlled pages. Anyone with the editor URL can read, add, change, and delete guest entries. The MC screen has no edit controls, but it does not grant a distinct secure role: someone who finds the editor URL can edit. This follows the requested password-free workflow.
- `/api/guests` is deliberately separate from authenticated dashboard APIs. Writes check same-origin requests, length limits, input validation, and basic per-instance rate limits (60 writes/minute/IP). These controls do not replace authentication or distributed abuse prevention.

## Weekly workflow

The default date is today if it is Saturday in Jakarta, otherwise the upcoming Saturday. Only valid Saturdays are accepted. Each entry contains guest type, name/family name, home congregation, and number of people. **Perorangan** fixes the count at 1; **Keluarga / Rombongan** enables a count of 2–999. Names are required; home congregation may be blank if unknown. Groups count as one entry with their full headcount. Totals count saved entries only.

Rows save individually or through **Simpan Semua Perubahan**. Failed saves retain input and show row-specific errors. Changing weeks or manually refreshing asks before discarding unsaved changes. Background refresh in the editor pauses while there are edits. Deleting a saved record requires confirmation. The MC can copy a numbered text list.

## Drive storage

Uses the existing server-side church OAuth client and **shared** `GOOGLE_DRIVE_REFRESH_TOKEN`, never a visitor's browser Google connection. No new environment variables, database, or spreadsheet are required.

On the first live save, the server creates **Daftar Tamu** in the church account's My Drive, then a year folder and one folder for each Saturday, e.g. `Daftar Tamu/2026/Sabat 2026-10-17/`. This root is separate from the announcements folder so it does not inherit that folder's sharing. It does not grant additional permissions or share Drive files publicly. The server reads it with the same church connection.

Each guest/group is a small JSON file. The description mirrors the JSON payload so a weekly folder listing can retrieve names and counts without downloading every file. Public Drive custom properties contain only the application marker, date, and request ID. Listing/publishing events does not include these records. Never manually edit the JSON file or move managed folders; the dashboard is the supported editing route.

Create requests retain a stable request UUID for retries. Edits and deletes check the current entry revision and use `If-Match` when Drive returns an ETag. Writes to one record are serialized within a server process. This prevents ordinary stale edits and avoids replacing the whole weekly list when another usher adds a different guest. If Drive does not return an ETag, cross-server simultaneous edits of the exact same row are not guaranteed atomic; reload after a conflict and coordinate same-row edits. Deleted Drive files go to Trash.

Local demo mode stores `guests` alongside existing ignored fixtures in `work/dashboard-demo.json`. Automated smoke checks refuse non-local/non-demo servers and clean up their own records. Drive adapter tests use mock files only. A real guest save requires a valid shared church refresh token and available Drive quota; this must be confirmed during production setup.
