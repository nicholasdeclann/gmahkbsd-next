# Google Drive Integration Plan — Photo Gallery for Pengumuman Page

## Overview

Connect the website to a shared Google Drive folder. Photos uploaded to the "Sekolah Sabat" subfolder will appear as a card thread view under the Canva embed on the pengumuman page. Users can add captions to photos via an edit button.

---

## 1. Google Drive Setup

### 1.1 Google Cloud Project
- Enable **Google Drive API** in [Google Cloud Console](https://console.cloud.google.com/)
- Create OAuth 2.0 credentials:
  - **Application type**: Web application
  - **Authorized redirect URI**: `https://your-vercel-url.com/api/drive/auth/callback`
  - Save `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 1.2 Service Account (for backend file access)
- Create a **Service Account** in Google Cloud
- Download the JSON key file
- Share the Drive folder (`10wezmLxbvUd3n6eNCRQZY3FxMzwZQLl4`) with the service account email as **Editor**
- Save `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SERVICE_ACCOUNT_EMAIL`

### 1.3 Folder Structure in Drive
```
10wezmLxbvUd3n6eNCRQZY3FxMzwZQLl4 (shared root)
├── Sekolah Sabat/
│   ├── photo1.jpg
│   ├── photo2.png
│   └── ...
```

---

## 2. Environment Variables

Add these to your Vercel project settings (or `.env.local` locally):

```env
# Google OAuth2
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Google Service Account (for backend Drive API access)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@project-id.iam.gserviceaccount.com

# Google Drive shared folder ID
GOOGLE_DRIVE_FOLDER_ID=10wezmLxbvUd3n6eNCRQZY3FxMzwZQLl4
```

**Note:** The existing project uses `ADMIN_SECRET` and `ADMIN_PASSWORD` via Vercel env vars (see `src/lib/adminAuth.ts`). Follow the same pattern — set env vars in the Vercel dashboard.

---

## 3. Database Schema

Add a new table to the existing Vercel Postgres database:

```sql
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  drive_file_id TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Sekolah Sabat',
  caption TEXT DEFAULT NULL,
  uploaded_by TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_department ON photos(department);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
```

**Why store metadata separately?**
- Google Drive metadata is limited for captions
- Allows captions to be edited without modifying Drive file metadata
- Faster querying for the frontend

---

## 4. Backend API Routes

### 4.1 `src/app/api/drive/auth/login/route.ts`
- **Purpose**: Initiate Google OAuth2 flow for admin users
- **Method**: `POST`
- **Body**: `{ password }` (reuse existing admin auth)
- **Flow**: Verify admin password → redirect to Google OAuth consent screen
- **Reuses**: `isAuthenticated()` from `src/lib/adminAuth.ts`

### 4.2 `src/app/api/drive/auth/callback/route.ts`
- **Purpose**: Handle Google OAuth2 callback
- **Method**: `GET`
- **Flow**: Exchange code for tokens → store access/refresh tokens in encrypted cookie → redirect to admin page

### 4.3 `src/app/api/drive/files/route.ts`
- **Purpose**: List photos from the Google Drive folder
- **Method**: `GET`
- **Query params**: `?department=Sekolah Sabat`
- **Flow**:
  1. Call Google Drive API to list files in the department subfolder
  2. Return file metadata (id, name, thumbnail, mimeType, createdAt)
- **Auth**: Optional — if not authenticated, returns public-accessible files only

### 4.4 `src/app/api/photos/route.ts`
- **Purpose**: Get all photos with captions from the database
- **Method**: `GET`
- **Query params**: `?department=Sekolah Sabat`
- **Flow**: Query `photos` table, join with Drive file metadata
- **Auth**: Public (anyone can view)

### 4.5 `src/app/api/photos/upload/route.ts`
- **Purpose**: Upload a photo to Drive and record metadata
- **Method**: `POST`
- **Body**: `FormData` with `file` and `department`
- **Flow**:
  1. Verify admin auth (`isAuthenticated()`)
  2. Upload file to Google Drive folder using service account
  3. Insert record into `photos` table
  4. Return photo record

### 4.6 `src/app/api/photos/[id]/route.ts`
- **Purpose**: Update photo caption
- **Method**: `PATCH`
- **Body**: `{ caption }`
- **Flow**:
  1. Verify admin auth
  2. Update `caption` in `photos` table
  3. Return updated record

---

## 5. Frontend — Pengumuman Page

### 5.1 Current State
- `src/app/pengumuman/page.tsx` — Only has a Canva embed iframe

### 5.2 New Layout
```
┌──────────────────────────────────┐
│         Canva Embed (existing)   │  ← full width, aspect ratio box
├──────────────────────────────────┤
│                                  │
│   ┌──────┐ ┌──────┐ ┌──────┐   │
│   │ Photo│ │ Photo│ │ Photo│   │  ← card thread view
│   │  1   │ │  2   │ │  3   │   │
│   │caption│ │caption│ │caption│ │
│   │[edit] │ │[edit] │ │[edit] │   │
│   └──────┘ └──────┘ └──────┘   │
│                                  │
│   ┌──────┐ ┌──────┐ ┌──────┐   │
│   │ Photo│ │ Photo│ │ Photo│   │
│   │  4   │ │  5   │ │  6   │   │
│   └──────┘ └──────┘ └──────┘   │
│                                  │
│   [Upload Photo Button]          │  ← admin only, shows when logged in
└──────────────────────────────────┘
```

### 5.3 Components Needed

#### `src/components/PhotoGallery.tsx`
- Fetches photos from `/api/photos`
- Renders photos in a responsive masonry/grid card layout
- Each card shows:
  - Thumbnail image (from Google Drive)
  - Caption text (editable by admin)
  - Edit button (only visible when admin is authenticated)
- Responsive grid: 1 column mobile, 2 tablet, 3-4 desktop

#### `src/components/PhotoCard.tsx`
- Individual photo card
- Displays image with lazy loading
- Shows caption below image
- Edit button opens a modal/popup for caption editing
- Uses `https://drive.google.com/uc?export=view&id={fileId}` for thumbnail

#### `src/components/PhotoUploadModal.tsx`
- Modal/dialog that appears when admin clicks "Upload"
- File picker for selecting images
- Department selector (currently only "Sekolah Sabat")
- Submit button triggers upload to `/api/photos/upload`

#### `src/components/PhotoEditModal.tsx`
- Modal that appears when admin clicks "Edit" on a card
- Text input for caption
- Save button triggers `PATCH /api/photos/[id]`

### 5.4 Google Drive Image URLs
- **Thumbnail**: `https://drive.google.com/uc?export=view&id={fileId}&maxw=400`
- **Full image**: `https://drive.google.com/uc?export=view&id={fileId}`

---

## 6. File Upload Flow

```
User (admin) clicks "Upload"
       │
       ▼
PhotoUploadModal opens
       │
       ▼
User selects file
       │
       ▼
POST /api/photos/upload (FormData)
       │
       ▼
Backend:
  1. isAuthenticated() check
  2. Upload to Google Drive via service account
  3. Insert into photos table
       │
       ▼
Response: { photo: { id, drive_file_id, caption, ... } }
       │
       ▼
Frontend re-fetches photos list
       │
       ▼
New photo appears in gallery
```

---

## 7. Caption Edit Flow

```
Admin clicks "Edit" on a card
       │
       ▼
PhotoEditModal opens with current caption
       │
       ▼
Admin edits caption text
       │
       ▼
PATCH /api/photos/{id} { caption: "New caption" }
       │
       ▼
Backend updates photos table
       │
       ▼
Response: { photo: { ...updated } }
       │
       ▼
Card updates in-place with new caption
```

---

## 8. Google Drive API Methods Needed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `files.list` | Drive API v3 | List files in department folder |
| `files.create` | Drive API v3 | Upload new file to folder |
| `files.get` | Drive API v3 | Get file metadata |
| `files.update` | Drive API v3 | Update file metadata |

**Library needed**: `googleapis` npm package

---

## 9. Security Considerations

| Concern | Solution |
|---------|----------|
| OAuth tokens leaked | Store in httpOnly cookies |
| Unauthorized uploads | Require admin auth on upload route |
| Drive credentials exposed | Keep in server-side env vars only |
| Large file uploads | Limit file size (max 10MB) |
| Rate limiting | Add throttling to Drive API calls |

---

## 10. Implementation Order

1. **Phase 1 — Setup** (Google Cloud + DB)
   - Enable Drive API, create credentials
   - Create `photos` table in Postgres
   - Set environment variables

2. **Phase 2 — Backend** (API routes)
   - `src/lib/drive.ts` — Google Drive client helper
   - `src/app/api/drive/files/route.ts`
   - `src/app/api/photos/route.ts`
   - `src/app/api/photos/upload/route.ts`
   - `src/app/api/photos/[id]/route.ts`

3. **Phase 3 — Frontend** (Pengumuman page)
   - `src/components/PhotoGallery.tsx`
   - `src/components/PhotoCard.tsx`
   - `src/components/PhotoUploadModal.tsx`
   - `src/components/PhotoEditModal.tsx`
   - Update `src/app/pengumuman/page.tsx`

---

## 11. Dependencies to Install

```bash
npm install googleapis
```

---

## 12. Notes

- The project is deployed on **Vercel** — all API routes are serverless functions
- `@vercel/postgres` handles the database connection
- The existing `src/lib/db.ts` pattern should be followed for new tables
- Admin auth pattern (`isAuthenticated()`) should be reused for protected routes
- Google Drive file thumbnails work via `https://drive.google.com/uc?export=view&id={fileId}`
- Service account is preferred over OAuth for backend operations since it doesn't require user interaction
- For admin uploads, combine the existing admin auth with the service account so admins don't need Google login
