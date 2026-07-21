import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { uploadFile } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (images + video)

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const folder = (formData.get("folder") as string) || "uploads";

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" exceeds 20MB limit` }, { status: 400 });
      }
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        return NextResponse.json({ error: `"${file.name}" is not an image or video file` }, { status: 400 });
      }
      const url = await uploadFile(file, folder);
      urls.push(url);
    }

    return NextResponse.json({ success: true, urls, url: urls[0] });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
