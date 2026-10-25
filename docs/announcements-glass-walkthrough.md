# Announcements and shared glass controls

Changes continue the approved Antigravity plan, followed by the compact Pokok Doa update requested for release.

## Compact Pokok Doa

Four numbered name cards replace the long name/reason sections. Save and refresh sit directly below the fields; the same glass controls and short labels are used for admin save/refresh actions. Names still write only to Kertas Acara B50:B53. Prayer reasons are retired from both staff and public responses; existing notes files are left untouched and no longer read or written. The compatibility fields remain empty in API responses.

Prayer checks: 14 local-demo workflow assertions, four unit tests, and browser checks at 320/390/768px passed, including refresh cancellation preserving unsaved names.

## Staff workflow

Open Dashboard → Pengumuman. Add a photo, title, optional caption/department, and final display date. The announcement remains public through that date in Jakarta time. Active and expired tabs keep older posts available to staff; editing the date can reactivate them. Deleting requires confirmation and uses the existing Drive deletion workflow.

Public galleries retain poster proportions, support full-image previews and sharing, and hide expired posts. The homepage shows two announcements. Canva remains on the public announcement page and is removed from staff photo management. Older undated Drive posts remain visible until dated; older numeric records retain their caption-only editing restrictions.

## Shared interface

Announcements, event photos, navigation sheets, guest confirmations, spreadsheet restoration, and weekly/prayer reload confirmations use shared dialog controls. Mobile dialogs have handles, desktop dialogs remain centered, and reduced-motion/high-contrast fallbacks are included. Breadcrumbs provide the back action.

Image responses disable caching so a newly expired image cannot remain accessible through the app's previous cache policy. Public pages refresh on focus, periodically, and at Jakarta midnight. Copies already downloaded or cached by external services cannot be revoked.

## Verification

- Production build and TypeScript checks were run during implementation; final build output is saved locally under `work/glass-final-build.log`.
- Local-demo smoke suites passed: announcements 39 checks, dashboard 34, events 28, guests 25.
- Browser checks covered 15 public/home/admin layouts, mobile through desktop; light/dark, Indonesian/English, keyboard focus/Escape, required fields, expiry tabs, confirmation, and contrast fallbacks.
- Browser upload/edit/expire/delete flow passed with disposable demo data. A simulated Jakarta midnight removed an expired public post without reloading.
- Visual inspector reported zero failures and four advisory warnings concerning existing typography and intentionally uneven masonry.

Real Google Drive writes were not exercised. Physical iPhone/Safari, assistive-technology speech output, real on-screen keyboards, and the final drag-to-dismiss adjustment still need device review. No live content was changed by the local-demo tests. Disposable fixtures and the private browser test session were removed.
