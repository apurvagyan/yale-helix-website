import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, RESUME_BUCKET } from "@/lib/supabaseAdmin";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

// Issues a one-time signed URL the browser uses to upload the resume directly
// to Supabase Storage (so the file never passes through this function).
export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }
    const extension = "." + (fileName.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `File type not supported. Accepted types: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 },
      );
    }

    const path = `${crypto.randomUUID()}${extension}`;
    const { data, error } = await getSupabaseAdmin()
      .storage.from(RESUME_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("createSignedUploadUrl error:", error);
      return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 });
    }

    return NextResponse.json({ bucket: RESUME_BUCKET, path, token: data.token });
  } catch (err) {
    console.error("upload-resume error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
