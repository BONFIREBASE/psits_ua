import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, getPresignedUploadUrl, deleteFromR2 } from "@/lib/r2";
import { supabase, supabaseAdmin, findOfficerByEmail } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";
const ADMIN_EMAIL = "psits-ua@antiquespride.edu.ph";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_SUBMISSIONS_PER_STUDENT = 1; // Strict 1-entry per student
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

async function authenticateStudent(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { error: "Authentication required. Please sign in with your @antiquespride.edu.ph account.", status: 401 };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || !user.email) {
    return { error: "Invalid or expired session. Please sign in again.", status: 401 };
  }

  const email = user.email.trim().toLowerCase();
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return {
      error: `Access restricted: Only ${ALLOWED_DOMAIN} institutional accounts are eligible to submit.`,
      status: 403,
    };
  }

  return { user, email };
}

async function isAuthorizedAdminOrOfficer(email: string): Promise<boolean> {
  if (email === ADMIN_EMAIL) return true;
  try {
    const officer = await findOfficerByEmail(email);
    return Boolean(officer);
  } catch {
    return false;
  }
}

async function getStudentSubmissionCount(email: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from("polo_submissions")
      .select("id", { count: "exact", head: true })
      .eq("student_email", email);

    if (error) {
      console.warn("Could not check submission count from Supabase:", error.message);
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, email: studentEmail } = auth;

    const contentType = req.headers.get("content-type") || "";

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH A: JSON API (Presigned Direct R2 Upload, Finalization & In-Place Edit)
    // ──────────────────────────────────────────────────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await req.json();

      // Step 1: Generate Presigned Direct-to-R2 Upload URL
      if (body.action === "presign") {
        const isUpdate = Boolean(body.isUpdate);

        if (!isUpdate) {
          const currentCount = await getStudentSubmissionCount(studentEmail);
          if (currentCount >= MAX_SUBMISSIONS_PER_STUDENT) {
            return NextResponse.json(
              {
                error: `You have already submitted an official entry. You can view or update your existing design instead.`,
              },
              { status: 400 }
            );
          }
        }

        const fileName = (body.fileName as string || "").trim();
        const fileType = (body.fileType as string || "").toLowerCase().trim();
        const fileSize = Number(body.fileSize) || 0;

        if (!fileName) {
          return NextResponse.json({ error: "File name is required." }, { status: 400 });
        }

        if (fileSize > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File size exceeds the 25MB limit (${(fileSize / (1024 * 1024)).toFixed(1)}MB).` },
            { status: 400 }
          );
        }

        if (!ALLOWED_MIME_TYPES.has(fileType)) {
          return NextResponse.json(
            { error: "Invalid file format. Only JPG, PNG, and WEBP images are allowed. PDF files are not accepted." },
            { status: 400 }
          );
        }

        const submissionId = body.submissionId || crypto.randomUUID();
        const fileExt = fileName.includes(".")
          ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
          : ".png";
        const sanitizedBase = fileName
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 40);

        const r2Key = `submissions/polo/${submissionId}/${sanitizedBase}${fileExt}`;

        const presigned = await getPresignedUploadUrl({
          key: r2Key,
          contentType: fileType,
        });

        return NextResponse.json({
          success: true,
          submissionId,
          uploadUrl: presigned.uploadUrl,
          fileKey: presigned.key,
          publicUrl: presigned.publicUrl,
        });
      }

      // Step 2: Finalize Initial Submission
      if (body.action === "finalize") {
        const currentCount = await getStudentSubmissionCount(studentEmail);
        if (currentCount >= MAX_SUBMISSIONS_PER_STUDENT) {
          return NextResponse.json(
            {
              error: `You have already submitted an official entry. Please edit your existing submission instead.`,
            },
            { status: 400 }
          );
        }

        const {
          submissionId,
          fileKey,
          fileUrl,
          fileName,
          fileSize,
          title,
          description,
          courseYear,
        } = body;

        if (!submissionId || !fileKey || !fileUrl || !fileName) {
          return NextResponse.json(
            { error: "Missing required upload metadata to finalize submission." },
            { status: 400 }
          );
        }

        if (!courseYear || !String(courseYear).trim()) {
          return NextResponse.json(
            { error: "BSINFO Year & Section is required." },
            { status: 400 }
          );
        }

        const studentName =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          studentEmail.split("@")[0];
        const studentAvatar = (user.user_metadata?.avatar_url as string) || null;

        const submissionRecord = {
          id: submissionId,
          student_name: studentName,
          student_email: studentEmail,
          student_avatar: studentAvatar,
          student_course_year: courseYear ? String(courseYear).trim().slice(0, 50) : null,
          title: title ? String(title).trim().slice(0, 100) : null,
          description: description ? String(description).trim().slice(0, 500) : null,
          file_url: fileUrl,
          file_key: fileKey,
          file_name: String(fileName).slice(0, 100),
          file_size: Number(fileSize) || null,
          status: "pending",
          created_at: new Date().toISOString(),
        };

        // Backup metadata JSON in R2
        try {
          const metadataKey = `submissions/polo/${submissionId}/metadata.json`;
          await uploadToR2({
            key: metadataKey,
            body: Buffer.from(JSON.stringify(submissionRecord, null, 2), "utf-8"),
            contentType: "application/json",
          });
        } catch (metaErr) {
          console.warn("Could not save secondary metadata JSON to R2:", metaErr);
        }

        // Insert into Supabase
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
          console.warn("Supabase table insert note (data secured in R2):", dbErr);
        }

        return NextResponse.json({
          success: true,
          submission: dbRecord || submissionRecord,
        });
      }

      // Step 3: In-Place Update of Existing Submission
      if (body.action === "update") {
        // Fetch existing submission for this student
        const { data: existing, error: findErr } = await supabaseAdmin
          .from("polo_submissions")
          .select("*")
          .eq("student_email", studentEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (findErr || !existing) {
          return NextResponse.json(
            { error: "No existing submission found for your account to update." },
            { status: 404 }
          );
        }

        if (existing.status !== "pending") {
          return NextResponse.json(
            { error: `This submission is already marked as '${existing.status}' and can no longer be edited.` },
            { status: 400 }
          );
        }

        const {
          newFileKey,
          newFileUrl,
          newFileName,
          newFileSize,
          title,
          description,
          courseYear,
        } = body;

        if (courseYear !== undefined && !String(courseYear).trim()) {
          return NextResponse.json(
            { error: "BSINFO Year & Section cannot be empty." },
            { status: 400 }
          );
        }

        // Clean up previous image in R2 if student replaced their mockup
        if (newFileKey && existing.file_key && existing.file_key !== newFileKey) {
          try {
            await deleteFromR2(existing.file_key);
          } catch (delErr) {
            console.warn("Could not remove old R2 mockup file:", delErr);
          }
        }

        const updatedRecord = {
          ...existing,
          title: title !== undefined ? (title ? String(title).trim().slice(0, 100) : null) : existing.title,
          description: description !== undefined ? (description ? String(description).trim().slice(0, 500) : null) : existing.description,
          student_course_year: courseYear !== undefined ? (courseYear ? String(courseYear).trim().slice(0, 50) : null) : existing.student_course_year,
          file_url: newFileUrl || existing.file_url,
          file_key: newFileKey || existing.file_key,
          file_name: newFileName ? String(newFileName).slice(0, 100) : existing.file_name,
          file_size: newFileSize !== undefined ? Number(newFileSize) : existing.file_size,
        };

        // Update backup metadata JSON in R2
        try {
          const metadataKey = `submissions/polo/${existing.id}/metadata.json`;
          await uploadToR2({
            key: metadataKey,
            body: Buffer.from(JSON.stringify(updatedRecord, null, 2), "utf-8"),
            contentType: "application/json",
          });
        } catch (metaErr) {
          console.warn("Could not update secondary metadata JSON in R2:", metaErr);
        }

        // Update row in Supabase
        let savedDb = null;
        try {
          const { data, error: updateError } = await supabaseAdmin
            .from("polo_submissions")
            .update({
              title: updatedRecord.title,
              description: updatedRecord.description,
              student_course_year: updatedRecord.student_course_year,
              file_url: updatedRecord.file_url,
              file_key: updatedRecord.file_key,
              file_name: updatedRecord.file_name,
              file_size: updatedRecord.file_size,
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (!updateError && data) {
            savedDb = data;
          } else if (updateError) {
            console.warn("Supabase polo_submissions update note:", updateError.message);
          }
        } catch (dbErr) {
          console.warn("Supabase table update note:", dbErr);
        }

        return NextResponse.json({
          success: true,
          submission: savedDb || updatedRecord,
        });
      }

      return NextResponse.json({ error: "Invalid action requested." }, { status: 400 });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BRANCH B: Fallback Multipart Upload (Buffered Server-side)
    // ──────────────────────────────────────────────────────────────────────────
    const currentCount = await getStudentSubmissionCount(studentEmail);
    if (currentCount >= MAX_SUBMISSIONS_PER_STUDENT) {
      return NextResponse.json(
        {
          error: `You have already submitted an official entry. Please edit your existing submission instead.`,
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null)?.trim() || "";
    const description = (formData.get("description") as string | null)?.trim() || "";
    const courseYear = (formData.get("courseYear") as string | null)?.trim() || "";

    if (!file) {
      return NextResponse.json(
        { error: "A design mockup image (JPG, PNG, or WEBP) is required." },
        { status: 400 }
      );
    }

    if (!courseYear.trim()) {
      return NextResponse.json(
        { error: "BSINFO Year & Section is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has((file.type || "").toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file format. Only JPG, PNG, and WEBP images are allowed. PDF files are not accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    const submissionId = crypto.randomUUID();
    const fileExt = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
      : ".png";
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);

    const r2Key = `submissions/polo/${submissionId}/${sanitizedBase}${fileExt}`;
    const metadataKey = `submissions/polo/${submissionId}/metadata.json`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const studentName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      studentEmail.split("@")[0];
    const studentAvatar = (user.user_metadata?.avatar_url as string) || null;

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
      student_course_year: courseYear ? courseYear.slice(0, 50) : null,
      title: title ? title.slice(0, 100) : null,
      description: description ? description.slice(0, 500) : null,
      file_url: uploadedAsset.url,
      file_key: uploadedAsset.key,
      file_name: file.name.slice(0, 100),
      file_size: file.size,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      await uploadToR2({
        key: metadataKey,
        body: Buffer.from(JSON.stringify(submissionRecord, null, 2), "utf-8"),
        contentType: "application/json",
      });
    } catch (metaErr) {
      console.warn("Could not save secondary metadata JSON to R2:", metaErr);
    }

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
    const auth = await authenticateStudent(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { email: studentEmail } = auth;

    // Check if requester is verified admin or officer
    const isAdmin = await isAuthorizedAdminOrOfficer(studentEmail);

    const { searchParams } = new URL(req.url);
    const mineOnly = searchParams.get("mine") === "true";

    const query = supabaseAdmin
      .from("polo_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    // CRITICAL SECURITY ENFORCEMENT:
    // Non-admin students are strictly locked to their own submissions.
    if (!isAdmin || mineOnly) {
      query.eq("student_email", studentEmail);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({
        submissions: [],
        activeSubmission: null,
        quota: { used: 0, max: MAX_SUBMISSIONS_PER_STUDENT, remaining: 1 },
      });
    }

    const submissions = data || [];
    const mySubmissions = submissions.filter((s: { student_email: string }) => s.student_email === studentEmail);
    const activeSubmission = mySubmissions[0] || null;
    const usedCount = mySubmissions.length;

    return NextResponse.json({
      submissions,
      activeSubmission,
      quota: {
        used: usedCount,
        max: MAX_SUBMISSIONS_PER_STUDENT,
        remaining: Math.max(0, MAX_SUBMISSIONS_PER_STUDENT - usedCount),
      },
    });
  } catch (err) {
    console.error("Fetch submissions error:", err);
    return NextResponse.json({
      submissions: [],
      activeSubmission: null,
      quota: { used: 0, max: MAX_SUBMISSIONS_PER_STUDENT, remaining: 1 },
    });
  }
}
