import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import { uploadToR2 } from "@/lib/r2";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

/**
 * POST /api/merch/orders/receipt
 * Allows a student to upload their paper payment receipt to their active order.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token required." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    const email = user.email.trim().toLowerCase();
    if (!email.endsWith(ALLOWED_DOMAIN)) {
      return NextResponse.json(
        { error: `Only ${ALLOWED_DOMAIN} institutional accounts are allowed.` },
        { status: 403 }
      );
    }

    // Rate limiting: 10 uploads / 60s per student
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rlKey = `receipt:${email}:${clientIp}`;
    const rateLimit = await checkRateLimit(rlKey, "order");

    if (!rateLimit.success) {
      const waitSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: `Too many upload attempts. Please wait ${waitSeconds}s before retrying.`,
        },
        { status: 429 }
      );
    }

    // Find student's active order
    const { data: existingOrders, error: findError } = await supabaseAdmin
      .from("merch_orders")
      .select("*")
      .eq("student_email", email)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1);

    if (findError || !existingOrders || existingOrders.length === 0) {
      return NextResponse.json(
        { error: "No active order found. Please place your order details first." },
        { status: 404 }
      );
    }

    const activeOrder = existingOrders[0];

    const formData = await req.formData();
    const receiptFile = formData.get("receipt") as File | null;

    if (!receiptFile || typeof receiptFile === "string" || receiptFile.size === 0) {
      return NextResponse.json(
        { error: "Please select a valid image of your payment receipt." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(receiptFile.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Receipt must be an image file (PNG, JPG, or WebP)." },
        { status: 400 }
      );
    }

    if (receiptFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Receipt image exceeds 15MB limit. Please compress or take a clearer photo." },
        { status: 400 }
      );
    }

    // Upload to R2
    const extension = receiptFile.type.includes("webp")
      ? "webp"
      : receiptFile.name.split(".").pop() || "jpg";
    const sanitizedKey = `merch/receipts/${activeOrder.id}-${Date.now()}.${extension}`;

    const fileBytes = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(fileBytes);

    await uploadToR2({
      key: sanitizedKey,
      body: buffer,
      contentType: receiptFile.type || "image/webp",
      cacheControl: "private, max-age=31536000, immutable",
      metadata: {
        orderId: activeOrder.id,
        studentEmail: email,
        uploadedAt: new Date().toISOString(),
      },
    });

    const receiptProxyUrl = `/api/merch/orders/${activeOrder.id}/receipt`;

    // Update order in Supabase
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("merch_orders")
      .update({
        receipt_key: sanitizedKey,
        receipt_url: receiptProxyUrl,
        receipt_filename: receiptFile.name,
        receipt_size: receiptFile.size,
        payment_status: "pending_verification",
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeOrder.id)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      console.error("Error updating order receipt:", updateError);
      return NextResponse.json(
        { error: "Failed to record payment receipt. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment receipt uploaded successfully.",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("POST /api/merch/orders/receipt error:", err);
    return NextResponse.json(
      { error: "Internal server error while processing receipt." },
      { status: 500 }
    );
  }
}
