import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { supabase, supabaseAdmin, findOfficerByEmail, type MerchOrderRow, type PoloShirtSize } from "@/lib/supabase";
import { validateSessionAction } from "@/lib/session";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";
const ADMIN_EMAIL = "psits-ua@antiquespride.edu.ph";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB max receipt
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const POLO_PRICE = 475;
const VALID_SIZES = new Set(["XS", "S", "M", "L", "XL"]);

/**
 * Authenticates either a student (via Supabase auth token) or an admin/officer
 */
async function authenticateUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    // Also check cookie for management portal
    const cookieToken = req.cookies.get("psits_session")?.value;
    if (cookieToken) {
      try {
        const sessionRes = await validateSessionAction(cookieToken);
        if (sessionRes.valid && sessionRes.user) {
          const email = sessionRes.user.email.trim().toLowerCase();
          return {
            user: { email, name: sessionRes.user.displayName },
            email,
            isAdmin: sessionRes.user.role === "admin" || email === ADMIN_EMAIL,
            isOfficer: sessionRes.user.role === "officer",
          };
        }
      } catch (err) {
        console.warn("Cookie session check failed:", err);
      }
    }
    return { error: "Authentication required. Please sign in with your institutional email.", status: 401 };
  }

  // 1. Check management session token
  try {
    const sessionRes = await validateSessionAction(token);
    if (sessionRes.valid && sessionRes.user) {
      const email = sessionRes.user.email.trim().toLowerCase();
      const isAdmin = sessionRes.user.role === "admin" || email === ADMIN_EMAIL;
      const isOfficer = sessionRes.user.role === "officer";
      return {
        user: { email, name: sessionRes.user.displayName },
        email,
        isAdmin,
        isOfficer,
      };
    }
  } catch {
    // Fallback to Supabase Auth token
  }

  // 2. Supabase Auth token (Student or Officer)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user || !user.email) {
    return { error: "Invalid or expired session. Please sign in again.", status: 401 };
  }

  const email = user.email.trim().toLowerCase();
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return {
      error: `Access restricted: Only ${ALLOWED_DOMAIN} institutional accounts can access merch orders.`,
      status: 403,
    };
  }

  const isAdmin = email === ADMIN_EMAIL;
  const officer = await findOfficerByEmail(email);

  return {
    user: {
      ...user,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0],
    },
    email,
    isAdmin,
    isOfficer: Boolean(officer),
  };
}

/**
 * GET /api/merch/orders
 * If query param `all=true` and caller is officer/admin, returns all orders.
 * Otherwise returns the logged-in student's active order.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true";

    // Admin / Officer request for all orders
    if (fetchAll) {
      if (!auth.isAdmin && !auth.isOfficer) {
        return NextResponse.json(
          { error: "Access denied. Admin or officer authorization required." },
          { status: 403 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("merch_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all merch orders:", error.message);
        return NextResponse.json({ orders: [] });
      }

      return NextResponse.json({ orders: data || [] });
    }

    // Student request: Get caller's own order
    const { data, error } = await supabaseAdmin
      .from("merch_orders")
      .select("*")
      .eq("student_email", auth.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch student order:", error.message);
      return NextResponse.json({ order: null });
    }

    // Return the student's latest order so updates (including cancelled, ready_for_pickup, etc.) reflect immediately
    const activeOrder = data?.[0] || null;
    return NextResponse.json({
      order: activeOrder,
      allOrders: data || [],
    });
  } catch (err) {
    console.error("GET /api/merch/orders error:", err);
    return NextResponse.json({ error: "Failed to retrieve orders" }, { status: 500 });
  }
}

/**
 * POST /api/merch/orders
 * Places an order for the official CCIS polo shirt.
 * Strictly 1 order per student account.
 * Requires physical receipt upload.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Upstash Rate Limiting: 5 requests / 60s per student to prevent mass order surges
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rlKey = `${auth.email}:${clientIp}`;
    const rateLimit = await checkRateLimit(rlKey, "order");

    if (!rateLimit.success) {
      const waitSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: `Too many order attempts. Please wait ${waitSeconds}s before trying again.`,
          retryAfter: waitSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(waitSeconds),
          },
        }
      );
    }

    // Strictly 1 order per student: Check if active order already exists
    const { data: existingOrders, error: checkError } = await supabaseAdmin
      .from("merch_orders")
      .select("*")
      .eq("student_email", auth.email);

    const formData = await req.formData();
    const size = (formData.get("size") as string)?.trim().toUpperCase();
    const courseYear = (formData.get("course_year") as string)?.trim() || "";
    const contactNumber = (formData.get("contact_number") as string)?.trim() || "";
    const notes = (formData.get("notes") as string)?.trim() || "";
    const receiptFile = formData.get("receipt") as File | null;

    const isBulk = formData.get("is_bulk") === "true";
    const bulkBreakdown = (formData.get("bulk_breakdown") as string)?.trim() || "";
    const quantityRaw = parseInt((formData.get("quantity") as string) || "1", 10);
    const quantity = Math.max(1, isNaN(quantityRaw) ? 1 : quantityRaw);

    if (!checkError && existingOrders) {
      const activeOrder = existingOrders.find((o) => o.status !== "cancelled");
      if (activeOrder) {
        // If active order has no receipt yet (or is pending_upload) and receipt is now being uploaded:
        const hasReceipt = Boolean(
          activeOrder.receipt_key &&
          activeOrder.receipt_key !== "pending_upload" &&
          activeOrder.receipt_url !== "/api/merch/orders/pending"
        );
        if (!hasReceipt && receiptFile && typeof receiptFile !== "string" && receiptFile.size > 0) {
          if (!ALLOWED_MIME_TYPES.has(receiptFile.type.toLowerCase())) {
            return NextResponse.json(
              { error: "Receipt must be an image file (PNG, JPG, or WebP)." },
              { status: 400 }
            );
          }
          if (receiptFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: `Receipt image exceeds ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB limit.` },
              { status: 400 }
            );
          }

          const extension = receiptFile.type.includes("webp") ? "webp" : receiptFile.name.split(".").pop() || "jpg";
          const sanitizedKey = `merch/receipts/${activeOrder.id}-${Date.now()}.${extension}`;
          const fileBytes = await receiptFile.arrayBuffer();

          await uploadToR2({
            key: sanitizedKey,
            body: Buffer.from(fileBytes),
            contentType: receiptFile.type || "image/webp",
            cacheControl: "private, max-age=31536000, immutable",
            metadata: {
              orderId: activeOrder.id,
              studentEmail: auth.email,
              uploadedAt: new Date().toISOString(),
            },
          });

          const receiptProxyUrl = `/api/merch/orders/${activeOrder.id}/receipt`;

          const { data: updated, error: updateError } = await supabaseAdmin
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

          if (updateError || !updated) {
            return NextResponse.json({ error: "Failed to update receipt." }, { status: 500 });
          }

          return NextResponse.json({
            success: true,
            message: "Receipt attached to order successfully.",
            order: updated,
          });
        }

        return NextResponse.json(
          {
            error:
              "You already have an active order placed for the official PSITS polo shirt. Strictly one polo shirt order is allowed per student account.",
            order: activeOrder,
          },
          { status: 400 }
        );
      }
    }

    // Validate size for new orders
    let finalSize = size;
    if (isBulk) {
      if (!bulkBreakdown || quantity < 1) {
        return NextResponse.json(
          { error: "Please select sizes and quantities for your bulk order." },
          { status: 400 }
        );
      }
      finalSize = bulkBreakdown;
    } else {
      if (!size || !VALID_SIZES.has(size)) {
        return NextResponse.json(
          { error: "Invalid shirt size selected. Allowed sizes: XS, S, M, L, XL." },
          { status: 400 }
        );
      }
    }

    if (!courseYear) {
      return NextResponse.json(
        { error: "Course and Section (e.g. BSINFO 3-A) is required." },
        { status: 400 }
      );
    }

    // Generate Order ID
    const orderId = crypto.randomUUID();
    let sanitizedKey: string | null = null;
    let receiptProxyUrl: string | null = null;
    let receiptFilename: string | null = null;
    let receiptSize: number | null = null;

    // Optional receipt upload on initial order creation
    if (receiptFile && typeof receiptFile !== "string" && receiptFile.size > 0) {
      if (!ALLOWED_MIME_TYPES.has(receiptFile.type.toLowerCase())) {
        return NextResponse.json(
          { error: "Receipt must be an image file (PNG, JPG, or WebP)." },
          { status: 400 }
        );
      }

      if (receiptFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Receipt image exceeds ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB limit.` },
          { status: 400 }
        );
      }

      const extension = receiptFile.type.includes("webp") ? "webp" : receiptFile.name.split(".").pop() || "jpg";
      sanitizedKey = `merch/receipts/${orderId}-${Date.now()}.${extension}`;
      const fileBytes = await receiptFile.arrayBuffer();

      await uploadToR2({
        key: sanitizedKey,
        body: Buffer.from(fileBytes),
        contentType: receiptFile.type || "image/webp",
        cacheControl: "private, max-age=31536000, immutable",
        metadata: {
          orderId,
          studentEmail: auth.email,
          uploadedAt: new Date().toISOString(),
        },
      });

      receiptProxyUrl = `/api/merch/orders/${orderId}/receipt`;
      receiptFilename = receiptFile.name;
      receiptSize = receiptFile.size;
    }

    // Student Name: prefer registered student directory name if available, else user name
    let studentFullName = auth.user.name || auth.email.split("@")[0];
    try {
      const { data: studentRecord } = await supabaseAdmin
        .from("students")
        .select("name, full_name, year_section")
        .eq("email", auth.email)
        .maybeSingle();

      if (studentRecord) {
        studentFullName = studentRecord.full_name || studentRecord.name || studentFullName;
      }
    } catch {
      // Fallback
    }

    const totalAmount = quantity * POLO_PRICE;
    const finalNotes = isBulk
      ? notes
        ? `${notes} [Bulk: ${bulkBreakdown}]`
        : `Bulk order: ${bulkBreakdown}`
      : notes || null;

    const newOrderData: Partial<MerchOrderRow> = {
      id: orderId,
      student_name: studentFullName,
      student_email: auth.email,
      course_year: courseYear || null,
      contact_number: contactNumber || null,
      item_id: "polo-2026",
      item_name: "Official PSITS Polo Shirt (AY 2026–2027) - NEXGEN TECHTORCH",
      size: finalSize as PoloShirtSize,
      quantity,
      unit_price: POLO_PRICE,
      total_amount: totalAmount,
      notes: finalNotes,
      receipt_key: sanitizedKey || "pending_upload",
      receipt_url: receiptProxyUrl || "/api/merch/orders/pending",
      receipt_filename: receiptFilename || null,
      receipt_size: receiptSize || null,
      status: "processing",
      payment_status: "pending_verification",
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("merch_orders")
      .insert(newOrderData)
      .select()
      .single();

    if (insertError) {
      console.error("Database error inserting merch order:", insertError.message);
      let errorMsg = "Failed to record your order in database. Please contact an officer.";
      if (insertError.code === "23505") {
        errorMsg = "You already have an active order for this polo shirt.";
      } else if (insertError.code === "23514") {
        errorMsg = "Bulk orders require updated database check constraints. Please execute the migration SQL in Supabase.";
      }
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Your polo shirt order has been placed successfully!",
      order: inserted,
    });
  } catch (err) {
    console.error("POST /api/merch/orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to place order." },
      { status: 500 }
    );
  }
}
