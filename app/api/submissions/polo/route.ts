import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user from Supabase session token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in with your @antiquespride.edu.ph account." },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    const studentEmail = user.email.trim().toLowerCase();
    if (!studentEmail.endsWith(ALLOWED_DOMAIN)) {
      return NextResponse.json(
        { error: `Access restricted: Only ${ALLOWED_DOMAIN} institutional accounts are eligible to submit.` },
        { status: 403 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null)?.trim() || "";
    const description = (formData.get("description") as string | null)?.trim() || "";
    const courseYear = (formData.get("courseYear") as string | null)?.trim() || "";

    if (!file) {
      return NextResponse.json(
        { error: "A design mockup file (image or PDF) is required." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    // 3. Prepare File Buffer & Unique Cloudflare R2 Key
    const timestamp = Date.now();
    const fileExt = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : ".png";
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);

    const submissionId = `polo_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
    const r2Key = `submissions/polo/${submissionId}/${sanitizedBase}${fileExt}`;
    const metadataKey = `submissions/polo/${submissionId}/metadata.json`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const studentName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      studentEmail.split("@")[0];
    const studentAvatar = (user.user_metadata?.avatar_url as string) || null;

    // 4. Upload Design Asset directly to Cloudflare R2
    const uploadedAsset = await uploadToR2({
      key: r2Key,
      body: buffer,
      contentType: file.type || "application/octet-stream",
      metadata: {
        submissionId,
        studentEmail,
        studentName,
        title,
        uploadedAt: new Date().toISOString(),
      },
    });

    const submissionRecord = {
      id: submissionId,
      student_name: studentName,
      student_email: studentEmail,
      student_avatar: studentAvatar,
      student_course_year: courseYear || null,
      title: title || null,
      description: description || null,
      file_url: uploadedAsset.url,
      file_key: uploadedAsset.key,
      file_name: file.name,
      file_size: file.size,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    // 5. Save metadata copy to R2 storage alongside the asset
    try {
      await uploadToR2({
        key: metadataKey,
        body: Buffer.from(JSON.stringify(submissionRecord, null, 2), "utf-8"),
        contentType: "application/json",
      });
    } catch (metaErr) {
      console.warn("Could not save secondary metadata JSON to R2:", metaErr);
    }

    // 6. Record submission in Supabase Database (if table exists)
    let dbRecord = null;
    try {
      const { data, error: dbError } = await supabaseAdmin
        .from("polo_submissions")
        .insert(submissionRecord)
        .select()
        .single();

      if (!dbError && data) {
        dbRecord = data;
      } else if (dbError) {
        console.warn("Supabase polo_submissions insert note:", dbError.message);
      }
    } catch (dbErr) {
      console.warn("Supabase table insert skipped (data secured in R2):", dbErr);
    }

    return NextResponse.json({
      success: true,
      submission: dbRecord || submissionRecord,
    });
  } catch (err) {
    console.error("Polo submission upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal upload error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if user is logged in
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Check if requester asks for their own submissions
    const { searchParams } = new URL(req.url);
    const mineOnly = searchParams.get("mine") === "true";

    const query = supabaseAdmin
      .from("polo_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (mineOnly) {
      query.eq("student_email", user.email);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ submissions: [] });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err) {
    console.error("Fetch submissions error:", err);
    return NextResponse.json({ submissions: [] });
  }
}
