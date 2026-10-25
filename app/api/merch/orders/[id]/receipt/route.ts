import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/r2";
import { supabase, supabaseAdmin, findOfficerByEmail } from "@/lib/supabase";
import { validateSessionAction } from "@/lib/session";

export const runtime = "nodejs";

const ADMIN_EMAIL = "psits-ua@antiquespride.edu.ph";

/**
 * GET /api/merch/orders/[id]/receipt
 *
 * Secure private proxy to view an uploaded order receipt.
 * Enforces strict authorization:
 * - Only the student who placed the order can view it.
 * - Only authorized PSITS officers and admins can view it.
 * - Public/unauthenticated access is strictly forbidden (401/403).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    // 1. Extract authentication token from Authorization header, query param, or cookies
    const { searchParams } = new URL(req.url);
    const queryToken = searchParams.get("token");
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const token = bearerToken || queryToken;
    const cookieToken = req.cookies.get("psits_session")?.value;

    let requesterEmail: string | null = null;
    let isAdmin = false;
    let isOfficer = false;

    // Check management portal session
    if (cookieToken || token) {
      try {
        const sessionRes = await validateSessionAction(cookieToken || token || "");
        if (sessionRes.valid && sessionRes.user) {
          requesterEmail = sessionRes.user.email.trim().toLowerCase();
          isAdmin = sessionRes.user.role === "admin" || requesterEmail === ADMIN_EMAIL;
          isOfficer = sessionRes.user.role === "officer";
        }
      } catch {
        // Fallback to Supabase user
      }
    }

    // Check Supabase Auth user
    if (!requesterEmail && token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.email) {
          requesterEmail = user.email.trim().toLowerCase();
          isAdmin = requesterEmail === ADMIN_EMAIL;
          const officer = await findOfficerByEmail(requesterEmail);
          isOfficer = Boolean(officer);
        }
      } catch {
        // Auth failed
      }
    }

    // Check Supabase auth cookies if token not directly provided
    if (!requesterEmail) {
      for (const cookie of req.cookies.getAll()) {
        if (cookie.name.includes("auth-token")) {
          try {
            const raw = decodeURIComponent(cookie.value);
            const parsed = JSON.parse(raw);
            const access = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null);
            if (access) {
              const { data: { user } } = await supabase.auth.getUser(access);
              if (user?.email) {
                requesterEmail = user.email.trim().toLowerCase();
                isAdmin = requesterEmail === ADMIN_EMAIL;
                const officer = await findOfficerByEmail(requesterEmail);
                isOfficer = Boolean(officer);
                break;
              }
            }
          } catch {
            // Ignore
          }
        }
      }
    }

    if (!requesterEmail) {
      return new NextResponse("Unauthorized. Sign in to view receipt.", { status: 401 });
    }

    // 2. Query order record
    const { data: order, error: orderError } = await supabaseAdmin
      .from("merch_orders")
      .select("id, student_email, receipt_key, receipt_filename")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new NextResponse("Order or receipt not found", { status: 404 });
    }

    // 3. Authorization Check:
    // Is the requester the student who placed the order OR an officer/admin?
    const isOwner = requesterEmail.toLowerCase() === order.student_email.toLowerCase();
    if (!isOwner && !isAdmin && !isOfficer) {
      return new NextResponse(
        "Forbidden: You do not have permission to view this confidential receipt.",
        { status: 403 }
      );
    }

    // 4. Fetch the private receipt directly from Cloudflare R2
    const r2Key = order.receipt_key;
    if (!r2Key || r2Key === "pending_upload") {
      return new NextResponse("Receipt file has not been uploaded yet", { status: 404 });
    }

    const s3Res = await getR2Object(r2Key);
    if (!s3Res.Body) {
      return new NextResponse("Receipt file could not be retrieved from vault", { status: 404 });
    }

    const stream = s3Res.Body.transformToWebStream();
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": s3Res.ContentType || "image/webp",
        "Content-Length": s3Res.ContentLength ? String(s3Res.ContentLength) : "",
        "Cache-Control": "private, no-transform, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("GET /api/merch/orders/[id]/receipt error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
