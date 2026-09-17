# Google Sheets Setup Guide

This site reads all of its data from **public Google Sheets** at runtime using
Google's Visualization API (`gviz/tq`). No API key is required — the sheets just
need to be shared as "Anyone with the link can view".

You need **three** things, all configured in `src/config/church.ts` under the
`sheets` key:

1. A **schedule** spreadsheet (who serves in which role each Saturday)
2. A **liturgy** spreadsheet (worship order details + hymnal lookup)
3. A **birthdays** spreadsheet (congregation member birthdays)

The schedule and birthdays can be separate spreadsheets; the liturgy spreadsheet
holds two tabs (identified by their `gid`).

---

## Finding a Sheet ID and gid

For a URL like:

```
https://docs.google.com/spreadsheets/d/1AbCdEfG.../edit#gid=1234567890
                                       └── sheetId ──┘         └── gid ─┘
```

- **sheetId** is the long string between `/d/` and `/edit`.
- **gid** is the number after `#gid=` (each tab has its own gid).

Make each spreadsheet viewable: **Share → General access → Anyone with the link
→ Viewer**.

---

## 1. Schedule sheet (`sheets.schedule.sheetId`)

This drives the **Kertas Acara** page. Layout expectations:

- **Row 1** is a header row where columns represent **dates** (Saturdays). The
  app matches the current/next Saturday by looking for the day + month text
  (e.g. "07 Feb") in these header cells.
- **Column A** (index 0) holds the **role name** for each row.
- **Each date column** holds the **person** assigned to that role for that date.
- Data rows start at **row 5** (index 4); rows 2–4 are ignored.

### Sections

Rows are grouped into sections using marker rows and keywords, all configurable
in `church.ts` under `kertasAcara.parsing`:

| Section | How it's detected (default keywords) |
|---------|--------------------------------------|
| Sekolah Sabat | Everything after a row whose role contains `DEWASA` (`ssSectionMarker`) |
| Khotbah | Everything after a row whose role contains `KHOTBAH` (`khotbahSectionMarker`) |
| Diakonia | Rows whose role contains `diakon`, `diakones`, or `bwa` (`diakoniaKeywords`) |
| Pelayanan Musik | Rows whose role contains `pelayanan musik`, `pianist`, or `keyboardist` (`pelayananKeywords`) |

Rows whose role contains any `skipRoleKeywords` (default: `penyedia potluck`,
`koordinator`) are ignored entirely.

### Two-person roles

Some roles are filled by two people. If a role matches `multiPersonKeywords`
(default: `diakon persembahan`, `diakones`, `bwa`), the app reads the **next
row's** person (when that next row has a blank role) as the second person.

### The rotating "Dorongan" role

One role rotates its label by which Saturday of the month it is. Configure it
under `kertasAcara.parsing.dorongan`:

- `matchKeyword` (default `dor`) **and** any of `subKeywords`
  (default `pp`, `rt`, `kesehatan`) must appear in the role text.
- `rotation` maps the Saturday-of-month number (1–5) to a display label, e.g.
  1st/3rd/5th → "Dorongan PP", 2nd → "Rumah Tangga", 4th → "Kesehatan".

### Specific row keys read by the components

The section components look up rows by their **lowercased role text**. If your
sheet uses different labels, update the components in
`src/app/kertas-acara/components/`. The defaults expect keys such as:

- Sekolah Sabat: `pemimpin`, `ayat inti/doa buka ss`, `berita mission`,
  `kuis sekolah sabat`, `diskusi sekolah sabat`, `lagu pujian`,
  `dor. pp/rt/kesehatan`
- Khotbah: `doa syafaat`, `bacaan persembahan`, `pembicara`, `khotbah`,
  `cerita anak`, `lagu pujian` / `lagu pujian 1` / `lagu pujian 2`,
  `ayat bersahutan & inti`

---

## 2. Liturgy sheet (`sheets.liturgy`)

One spreadsheet, two tabs:

### a) Kertas Acara tab (`kertasAcaraGid`)

- **Column B** (index 1) holds a label, **column C** (index 2) holds the value,
  and **column J** (index 9) holds the Sekolah Sabat variant where relevant.
- Recognized labels (lowercased): `lagu buka`, `lagu tutup`, `judul khotbah`,
  `ayat inti`, `ayat bersahutan`.
  - `lagu buka` / `lagu tutup` — the opening/closing hymn numbers (col C for the
    main service, col J for Sekolah Sabat).
  - `judul khotbah`, `ayat inti`, `ayat bersahutan` — text shown alongside the
    order of service.

### b) Lagu Sion tab (`laguSionGid`)

The hymnal lookup table:

- **Column B** (index 1) = hymn number
- **Column C** (index 2) = hymn title

Hymns are displayed as `<hymnalPrefix> <number> | <title>` (e.g.
`LSEL 421 | ...`). Set `kertasAcara.hymnalPrefix` and the four
`kertasAcara.fixedHymns` numbers to match your hymnal and worship order.

---

## 3. Birthdays sheet (`sheets.birthdays.sheetId`)

Drives the **Ulang Tahun** page.

- **Row 1** is a header and is skipped.
- **Column B** (index 1) = member **name**. The app reverses word order for
  display (e.g. "Surname Firstname" → "Firstname Surname").
- **Column C** (index 2) = **birth date**. Google Sheets serves dates in the form
  `Date(1998,0,27)` (month is 0-indexed); the app parses this automatically.

Only members whose birthday falls in the current week (Sunday–Saturday) are
shown.

---

## Tips

- After changing sheet contents, the site fetches fresh data on each page load
  (`cache: "no-store"`), so updates appear immediately — no rebuild needed.
- If a page shows "Jadwal tidak ditemukan" / "Gagal memuat", double-check the
  sheet is shared publicly and that the date header format matches.
- The parsing keywords are case-insensitive.
