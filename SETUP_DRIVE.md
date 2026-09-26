# Setup Guide — Google Drive Photo Integration

## What was added

### Backend files created:
- `src/lib/drive.ts` — Google Drive OAuth2 client, token management
- `src/lib/db.ts` — Updated with `photos` table (CRUD functions)
- `src/app/api/drive/auth/login/route.ts` — Initiates Google OAuth2 flow
- `src/app/api/drive/auth/callback/route.ts` — Handles Google OAuth2 callback, stores token
- `src/app/api/photos/route.ts` — GET photos with captions from DB
- `src/app/api/photos/upload/route.ts` — POST upload photo to Drive + DB
- `src/app/api/photos/[id]/route.ts` — PATCH update photo caption

### Frontend files created:
- `src/components/PhotoGallery.tsx` — Grid of photo cards
- `src/components/PhotoCard.tsx` — Individual photo card with image + caption
- `src/components/PhotoUploadModal.tsx` — Modal for uploading photos
- `src/components/PhotoEditModal.tsx` — Modal for editing captions

### Modified files:
- `src/app/pengumuman/page.tsx` — Added PhotoGallery below Canva embed
- `src/components/Navbar.tsx` — Added "Connect Drive" button
- `src/lib/db.ts` — Added photos table
- `package.json` — Added `googleapis` dependency
- `next.config.ts` — Added NEXT_PUBLIC_BASE_URL env
- `.env.local` — Added Google credentials

## Before running locally:

### 1. Install the googleapis package
```bash
npm install googleapis
```

### 2. Start the dev server
```bash
npm run dev
```

### 3. On the pengumuman page, click "Connect Drive" in the navbar
This will:
1. Call `/api/drive/auth/login` → returns Google OAuth URL
2. Redirect to Google consent screen
3. After consenting → callback stores token → redirects to `/pengumuman`
4. Drive is now connected for photo operations

### 4. Test the flow
- Navigate to `/pengumuman`
- You should see the photo gallery grid
- Click "Upload Foto" → select image → upload to Drive
- Click edit icon on any card → add caption → save

**No admin login required** — anyone can upload photos and edit captions.

## Database

The `photos` table is created automatically on first run by `ensurePhotoTable()`.

## Note on Drive Token

The Google Drive access token is stored in a cookie (`google_drive_token`). Only one person needs to connect Drive — once connected, the token is used for all upload operations on that browser session.
