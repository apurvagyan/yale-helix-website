import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, DECK_BUCKET } from "@/lib/supabaseAdmin";

// Issues a one-time signed URL the browser uses to upload the pitch deck directly
// to Supabase Storage (so the file never passes through this function).
export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const path = `${crypto.randomUUID()}.pdf`;
    const { data, error } = await getSupabaseAdmin()
      .storage.from(DECK_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("createSignedUploadUrl error:", error);
      return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 });
    }

    return NextResponse.json({ bucket: DECK_BUCKET, path, token: data.token });
  } catch (err) {
    console.error("upload-url error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
