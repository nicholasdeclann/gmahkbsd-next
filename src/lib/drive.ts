import { google } from "googleapis";
import { cookies } from "next/headers";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function createOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/drive/auth/callback`
  );
  return oauth2Client;
}

export function getDriveService(accessToken: string) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get("google_drive_token");
  return token?.value ?? null;
}

export async function isDriveAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get("google_drive_token");
  return !!token?.value;
}

export function getAuthUrl() {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
}

/** Find a subfolder inside the main Drive folder by name. */
export async function getDepartmentFolderId(
  department: string,
  accessToken: string
): Promise<string | null> {
  const drive = getDriveService(accessToken);
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
      fields: "files(id, name)",
    });

    const folder = response.data.files?.find(
      (f) => f.name === department
    );
    return folder?.id ?? null;
  } catch {
    return null;
  }
}
