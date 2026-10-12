# Kegiatan Jemaat

Local review only; no production configuration or Drive files were changed during implementation.

- Homepage shows up to 12 published photos from the previous calendar month in Asia/Jakarta. Empty months hide the section. Event date determines the month, not upload time.
- Carousel advances every 10 seconds, with floating Material UI arrow icons and a pause/play control. Hover, keyboard focus, open photo preview, and hidden browser tabs pause advancement. Reduced-motion preferences start playback paused. No photo counter appears on the homepage.
- `/kegiatan` is the public monthly archive (100 photos per page, with Load More).
- `/admin/events` uses existing dashboard authentication and the shared church Drive connection. Staff upload up to 12 photos per batch; each file is sent separately to stay under the existing 4 MB request limit. Photos are resized to at most 1600 pixels and converted to JPEG in the browser. Failed batches retain remaining files for retry; already saved photos are not sent again.
- Drafts are excluded from public listings and image endpoints. Images are served without persistent browser/CDN caching so unpublishing prevents new image requests. Previously downloaded copies cannot be recalled.
- Changing an event date moves its Drive file to the correct month folder. Deleting moves the file to Drive Trash.

## Drive setup for a future production release

Existing `GOOGLE_DRIVE_FOLDER_ID`, service-account JSON, and shared OAuth refresh token are reused. By default, the app creates `Kegiatan Jemaat` under the existing announcement folder on the first upload, then `2026/09 - September` and equivalent folders on demand. Existing announcements stay in place.

Optionally configure `GOOGLE_EVENTS_FOLDER_ID` as a separate root owned by the church. Share it as Viewer with the existing service account, and ensure the app's church OAuth connection has access to this folder (drive.file does not automatically grant access to arbitrary manually created folders). App-created folders under the already authorized announcement root are the simplest initial setup. Upload and date edits verify service-account readability before saving a photo.

Drive descriptions store `Kegiatan: <event name>` on the first line, followed by the photo caption. Public custom properties store `kind=gmahkbsd-event`, `eventDate=YYYY-MM-DD`, and `published=true/false`; they are readable by both the OAuth writer and service-account reader. Folder properties store `eventFolder=root`, the year, or `YYYY-MM`. Folder names are for human organization; IDs and metadata drive lookups. Direct Drive uploads are not automatically published. Avoid manually moving managed photos/folders; use the dashboard to correct dates.

Google Drive folder names are not unique. Concurrent creation within one server is serialized; after creation the app selects the oldest matching folder. A rare cross-server race may leave an empty duplicate folder. Review these before deleting; never delete folders containing uploaded photos.

Public metadata is cached for 60 seconds and invalidated on successful mutations. The public list reads only the selected month, not the full archive. There is no database or new spreadsheet requirement. Storage still counts against the church account's Drive quota.

## Checks

Run `npm run test:events` with the local demo server on port 3001 (or set `DASHBOARD_TEST_URL` to the chosen localhost origin). The test refuses non-local and non-demo servers and cleans up its disposable photos. Drive adapter tests use mocks and never access Google. An actual Drive upload should be checked during production setup; local demo tests do not prove live Google permissions.
