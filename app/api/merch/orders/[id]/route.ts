import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, findOfficerByEmail } from "@/lib/supabase";
import { validateSessionAction } from "@/lib/session";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";

const ADMIN_EMAIL = "psits-ua@antiquespride.edu.ph";
const VALID_STATUSES = new Set([
  "processing",
  "ordered",
  "ready_for_pickup",
  "completed",
  "cancelled",
]);
const VALID_PAYMENT_STATUSES = new Set([
  "pending_verification",
  "verified",
  "rejected",
]);

async function authenticateOfficerOrAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const cookieToken = req.cookies.get("psits_session")?.value;
  const token = bearerToken || cookieToken;

  if (!token) return { isAuthorized: false, officerName: "Officer" };

  try {
    const sessionRes = await validateSessionAction(token);
    if (sessionRes.valid && sessionRes.user) {
      const email = sessionRes.user.email.trim().toLowerCase();
      if (sessionRes.user.role === "admin" || sessionRes.user.role === "officer" || email === ADMIN_EMAIL) {
        return {
          isAuthorized: true,
          officerName: sessionRes.user.displayName || email.split("@")[0],
          email,
        };
      }
    }
  } catch {
    // fallback check
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user?.email) {
      const email = user.email.trim().toLowerCase();
      const officer = await findOfficerByEmail(email);
      if (email === ADMIN_EMAIL || Boolean(officer)) {
        return {
          isAuthorized: true,
          officerName: user.user_metadata?.full_name || email.split("@")[0],
          email,
        };
      }
    }
  } catch {
    // ignore
  }

  return { isAuthorized: false, officerName: "Officer" };
}

/**
 * PATCH /api/merch/orders/[id]
 * Updates order fields: status, payment_status, size, quantity, total_amount, course_year, contact_number, notes.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const { isAuthorized, officerName } = await authenticateOfficerOrAdmin(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access denied. Only PSITS officers and administrators can update orders." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      status,
      payment_status,
      size,
      quantity,
      total_amount,
      course_year,
      contact_number,
      notes,
    } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      if (!VALID_STATUSES.has(status)) {
        return NextResponse.json({ error: "Invalid order status value." }, { status: 400 });
      }
      updates.status = status;
    }

    if (payment_status !== undefined) {
      if (!VALID_PAYMENT_STATUSES.has(payment_status)) {
        return NextResponse.json({ error: "Invalid payment status value." }, { status: 400 });
      }
      updates.payment_status = payment_status;
      if (payment_status === "verified") {
        updates.verified_by = officerName;
        updates.verified_at = new Date().toISOString();
      }
    }

    if (size !== undefined && typeof size === "string" && size.trim()) {
      updates.size = size.trim();
    }

    if (quantity !== undefined) {
      const qNum = parseInt(String(quantity), 10);
      if (!isNaN(qNum) && qNum >= 1) {
        updates.quantity = qNum;
      }
    }

    if (total_amount !== undefined) {
      const aNum = parseFloat(String(total_amount));
      if (!isNaN(aNum) && aNum >= 0) {
        updates.total_amount = aNum;
      }
    }

    if (course_year !== undefined) {
      updates.course_year = String(course_year).trim();
    }

    if (contact_number !== undefined) {
      updates.contact_number = String(contact_number).trim();
    }

    if (notes !== undefined) {
      updates.notes = String(notes).trim();
    }

    const { data: updated, error } = await supabaseAdmin
      .from("merch_orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update merch order:", error.message);
      return NextResponse.json({ error: "Failed to update order in database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: updated,
    });
  } catch (err) {
    console.error("PATCH /api/merch/orders/[id] error:", err);
    return NextResponse.json({ error: "Server error updating order." }, { status: 500 });
  }
}

/**
 * DELETE /api/merch/orders/[id]
 * Deletes an order and purges its receipt image from Cloudflare R2 if present.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const { isAuthorized } = await authenticateOfficerOrAdmin(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access denied. Only PSITS officers and administrators can delete orders." },
        { status: 403 }
      );
    }

    // 1. Fetch order details to check for an uploaded receipt
    const { data: order } = await supabaseAdmin
      .from("merch_orders")
      .select("id, receipt_key")
      .eq("id", orderId)
      .maybeSingle();

    if (order?.receipt_key && order.receipt_key !== "pending_upload") {
      try {
        await deleteFromR2(order.receipt_key);
      } catch (r2Err) {
        console.warn("Could not delete receipt from R2 vault:", r2Err);
      }
    }

    // 2. Delete order row from Supabase
    const { error: delErr } = await supabaseAdmin
      .from("merch_orders")
      .delete()
      .eq("id", orderId);

    if (delErr) {
      console.error("Failed to delete merch order:", delErr.message);
      return NextResponse.json({ error: "Failed to delete order from database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedId: orderId,
    });
  } catch (err) {
    console.error("DELETE /api/merch/orders/[id] error:", err);
    return NextResponse.json({ error: "Server error deleting order." }, { status: 500 });
  }
}
