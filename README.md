# Church Website Template

A modern, responsive church website template built with Next.js 15, TypeScript,
and MUI. Designed to be **forked and customized by any church** with minimal
effort — most churches only need to edit a single configuration file.

It ships with four pages out of the box:

| Page | Route | What it does |
|------|-------|--------------|
| Home | `/` | Welcome hero, worship/online meeting info, social card, and an embedded map |
| Kertas Acara | `/kertas-acara` | Weekly worship order/schedule, pulled live from Google Sheets |
| Ulang Tahun | `/ulang-tahun` | Congregation birthdays for the current week, from Google Sheets |
| Pengumuman | `/pengumuman` | Announcements, embedded as a Canva slideshow |

> The UI is in Indonesian by default (it originated as an Adventist church site).
> You can translate the visible strings in the page components as needed.

There is **no backend, no database, and no authentication** — the site is fully
static and reads its data client-side from public Google Sheets, then deploys to
GitHub Pages.

---

## Quick Start (for a new church)

1. **Fork this repository** on GitHub (or use it as a template).
2. **Edit `src/config/church.ts`** — this is the only file you must change.
   Fill in your church name, service times, Zoom/meeting link, Instagram, Google
   Maps embed, Canva embed, and your Google Sheet IDs.
3. **Replace the images** in `public/assets/images/` with your own (keep the same
   filenames, or update the `assets` block in the config to match your filenames).
4. **Set up your Google Sheets** — see [SETUP.md](./SETUP.md) for the exact
   spreadsheet structure the app expects.
5. **Enable GitHub Pages** in your repo: Settings → Pages → Source =
   "GitHub Actions". Push to `main` and the included workflow builds and deploys
   automatically.

That's it. The deployment base path is derived automatically from your
repository name (see below), so there is nothing else to configure.

---

## Configuration

All church-specific values live in **`src/config/church.ts`**. It is fully typed,
so your editor will guide you. Highlights:

- **Branding** — `name`, `shortName`, `description`, `welcomeHeading`,
  `welcomeSubtitle`
- **Assets** — filenames inside `public/assets/images/`
- **Services** — the list of worship service cards shown on the homepage
- **Zoom / online meeting** — id, password, join URL
- **Instagram** — handle + URL
- **Maps** — Google Maps embed URL
- **Announcements** — Canva embed URL
- **Google Sheets** — the sheet IDs (and tab `gid`s) for schedule, liturgy, and
  birthdays
- **Kertas Acara liturgy** — hymnal prefix, fixed hymn numbers, and the parsing
  keywords that map your schedule sheet's rows into sections. See
  [SETUP.md](./SETUP.md) for how these relate to your sheet layout.

### Base path (GitHub Pages)

GitHub Pages project sites are served under `https://<user>.github.io/<repo-name>`.
The build reads `NEXT_PUBLIC_BASE_PATH` to prefix all asset URLs accordingly.

- **In CI:** the included GitHub Actions workflow sets this automatically to
  `/<repo-name>` — no action needed.
- **Locally:** leave it unset for root-relative dev, or set it to match if you
  want to preview the exact production paths:

  ```bash
  NEXT_PUBLIC_BASE_PATH=/your-repo-name npm run build
  ```

If you deploy to a custom domain at the root (e.g. `www.yourchurch.org`), leave
`NEXT_PUBLIC_BASE_PATH` unset and remove/adjust the `env` block in
`.github/workflows/deploy.yml`.

---

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into ./out
npm run lint
```

## Project Structure

```
├── src/
│   ├── config/
│   │   └── church.ts          # ← the ONE file each church edits
│   ├── lib/
│   │   └── asset.ts           # basePath-aware asset URL helper
│   ├── components/
│   │   └── Navbar.tsx
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx           # Home
│       ├── kertas-acara/      # Worship schedule (Google Sheets)
│       ├── ulang-tahun/       # Birthdays (Google Sheets)
│       └── pengumuman/        # Announcements (Canva embed)
├── public/assets/images/      # logo, meeting logo, birthday header (placeholders)
├── .github/workflows/deploy.yml
├── SETUP.md                   # Google Sheets setup guide
└── next.config.ts
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **Language**: TypeScript
- **UI**: MUI (Material UI) v7 + Emotion
- **Styling**: Tailwind CSS
- **Data**: Public Google Sheets (client-side fetch)
- **Hosting**: GitHub Pages via GitHub Actions

## License

MIT
