import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { isAuthenticated } from "@/lib/adminAuth";
import { getAccessToken, getDriveService, getDepartmentFolderId } from "@/lib/drive";
import { createPhoto } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const department = (formData.get("department") as string) || "Sekolah Sabat";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Limit file size to 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Get access token from cookie
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 401 }
      );
    }

    // Find the department subfolder (e.g., "Sekolah Sabat")
    let targetFolderId = await getDepartmentFolderId(department, accessToken);
    if (!targetFolderId) {
      // Fallback to main folder if subfolder not found
      targetFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID ?? null;
    }
    if (!targetFolderId) {
      return NextResponse.json(
        { error: "Google Drive folder is not configured" },
        { status: 500 }
      );
    }

    // Upload file to Google Drive using a readable stream
    const driveService = getDriveService(accessToken);
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);
    const media = {
      mimeType: file.type,
      body: stream,
    };

    const response = await driveService.files.create({
      requestBody: {
        name: file.name,
        parents: [targetFolderId],
      },
      media,
      fields: "id, name, mimeType, createdTime",
    });

    const driveFileId = response.data.id;
    if (!driveFileId) {
      return NextResponse.json(
        { error: "Google Drive did not return a file ID" },
        { status: 502 }
      );
    }

    // Save to database
    const photo = await createPhoto(
      driveFileId,
      department,
      "admin"
    );

    return NextResponse.json({ photo }, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
