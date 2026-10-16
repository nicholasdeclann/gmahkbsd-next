# Dashboard spreadsheet settings

Open `/admin/settings`, under **Tautan Spreadsheet**. Paste:

1. The Kertas Acara workbook link. Required tab names: `Kertas Acara`,
   `Lagu Sion`, `Jadwal Kuartal`. Their IDs are detected automatically.
2. The quarterly participant spreadsheet link, including its `gid` from
   the `Khotbah & SS` tab. This is separate from the annual schedule tab.

**Periksa Tautan** previews workbook titles, detected tabs and dates. It
checks public readability and the service account's edit capability without
writing sample data. The replacement workbook needs the same template/cell
layout. It must be shared with the configured Google service account as
Editor. The permission check does not grant permissions automatically.

**Gunakan Tautan Ini** repeats validation before saving. This switches:
the public worship order, hymn lookup, quarterly table, weekly editor,
prayer-name sheet cells, and PDF/JPG export. Birthday sources are unchanged.
The previous two sources are retained for **Pulihkan Tautan Sebelumnya**;
rollback also checks that the previous spreadsheets remain accessible.

Production persistence is one app-created private JSON file at the church
Google Drive root (`kind=gmahkbsd-sheet-settings`), using the existing shared
refresh token. No new database or OAuth scopes. Existing source constants
remain defaults before the first save. Public readers cache source settings
for 15 seconds per instance; staff forms resolve them afresh. Reload open
pages after switching. Weekly and prayer form revisions include the source
configuration so a form loaded before a switch cannot save into the new
workbook using the previous workbook's values.

Local demo saves use the ignored `work/dashboard-demo.json` only. Preview
still reads the actual linked Google spreadsheets. No real settings file or
spreadsheet content is changed by local demo saves.

Settings writes are serialized within a server instance and check the prior
revision. Avoid simultaneous source changes from multiple admins; Drive
does not provide a database transaction across server instances. Duplicate
settings files fail explicitly rather than choosing one silently.

Checks: `node --test scripts/sheet-settings.test.mjs`, TypeScript, and local
HTTP/UI checks for authenticated preview/save and cross-origin rejection.
