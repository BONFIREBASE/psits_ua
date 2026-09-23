import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/submissions/polo/approved
 *
 * Public endpoint — no authentication required.
 * Returns only approved polo shirt design entries with PII stripped.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("polo_submissions")
      .select(
        "id, student_name, student_course_year, title, description, file_url, vote_count, created_at"
      )
      .eq("status", "approved")
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching approved submissions:", error.message);
      return NextResponse.json({ entries: [] });
    }

    return NextResponse.json(
      {
        entries: data || [],
        count: data?.length || 0,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          "CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          "Vercel-CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("Approved submissions endpoint error:", err);
    return NextResponse.json({ entries: [], count: 0 });
  }
}
