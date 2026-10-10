import type { drive_v3 } from "googleapis";

/** Drive can omit parents for files reached through link sharing. Verify membership through the folder listing in that case. */
export async function isFileInDriveFolder(drive: drive_v3.Drive, fileId: string, parents: string[] | null | undefined, folderId: string): Promise<boolean> {
  if (parents?.length) return parents.includes(folderId);
  let pageToken: string | undefined;
  do {
    const result = await drive.files.list({ q: `'${folderId}' in parents and trashed = false and properties has { key='kind' and value='gmahkbsd-announcement' }`,
      fields: "nextPageToken,files(id)", pageSize: 100, pageToken, supportsAllDrives: true, includeItemsFromAllDrives: true });
    if (result.data.files?.some(file => file.id === fileId)) return true;
    pageToken = result.data.nextPageToken ?? undefined;
  } while (pageToken);
  return false;
}
