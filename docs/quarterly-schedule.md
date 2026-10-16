# Quarterly ministry schedule

Public page: `/jadwal-pelayanan`. Read-only; no new credentials, storage, or database.

Source: the saved Kertas Acara workbook under `/admin/settings`.
`churchConfig.sheets.liturgy` in `src/config/church.ts` remains the default
before the first settings save. The dashboard detects replacement tab IDs.
The existing weekly participant workbook (`sheets.schedule`) is separate.

The API reads `B4:CZ33`, using row 4 for dates, column B for roles, and rows
6–33 for assignments. Google gviz omits empty rows, so section dividers are
identified by their labels rather than array offsets. No spreadsheet writes.

Current quarter and year are calculated in Asia/Jakarta. Only Saturdays
inside that quarter are selected. Partial quarters list missing Saturdays;
quarters without matching dates show an unavailable message. Empty
assignments display an em dash; existing `-` and `(TBA)` values are preserved.

Google response caching: five minutes per running server instance, with concurrent reads shared.
Transient failures retry once (eight seconds per attempt). If both attempts fail,
a previously validated response from the same workbook/tab can be used for up to
one hour, with a visible notice. Cache contents are ephemeral, not stored in a
database, and are never reused for a replacement workbook. The page refreshes while visible
every five minutes; the Refresh button bypasses the server source cache.
Names and entered values remain in their original language. UI labels and
dates follow the visitor's ID/EN preference.

The table scrolls within its own container, keeps the role column and date
header visible, highlights the nearest upcoming Sabbath, and highlights
name-search matches without hiding other assignments.
