import { google } from "googleapis";
import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TOKEN_COOKIE = "google_drive_credentials";
export const DRIVE_STATE_COOKIE = "google_drive_oauth_state";
type DriveCredentials = { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null };

function tokenKey(): Buffer {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SECRET is not configured");
  return createHash("sha256").update(`drive:${secret}`).digest();
}

export async function saveDriveCredentials(credentials: DriveCredentials): Promise<void> {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const stored = { access_token: credentials.access_token, refresh_token: credentials.refresh_token, expiry_date: credentials.expiry_date };
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(stored), "utf8"), cipher.final()]);
  const sealed = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
  (await cookies()).set(TOKEN_COOKIE, sealed, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

async function readDriveCredentials(): Promise<DriveCredentials | null> {
  if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) return { refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN };
  const sealed = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!sealed) return null;
  try {
    const buffer = Buffer.from(sealed, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", tokenKey(), buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString("utf8"));
  } catch { return null; }
}

export function driveOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_DRIVE_FOLDER_ID);
}

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function createOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.GOOGLE_OAUTH_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/drive/auth/callback`
  );
  return oauth2Client;
}

export function getDriveService(accessToken: string) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function getAccessToken(): Promise<string | null> {
  const credentials = await readDriveCredentials();
  if (!credentials || !driveOAuthConfigured()) return null;
  try {
    const client = createOAuthClient();
    client.setCredentials(credentials);
    return (await client.getAccessToken()).token ?? null;
  } catch { return null; }
}

export async function isDriveAuthenticated(): Promise<boolean> {
  return Boolean(await getAccessToken());
}

export function getAuthUrl(state: string) {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
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

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
    });

    const folder = response.data.files?.find(
      (f) => f.name === department
    );
    return folder?.id ?? null;
}
