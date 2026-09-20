import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, findOfficerByEmail } from "@/lib/supabase";

export const runtime = "nodejs";

const ADMIN_EMAIL = "psits-ua@antiquespride.edu.ph";

// ============================================================================
// HELPER: Authenticate Admin/Officer
// ============================================================================

async function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { error: "Authentication required.", status: 401 };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user || !user.email) {
    return { error: "Invalid or expired session.", status: 401 };
  }

  const email = user.email.trim().toLowerCase();

  // Check if admin or officer
  const isAdmin = email === ADMIN_EMAIL;
  const officer = await findOfficerByEmail(email);

  if (!isAdmin && !officer) {
    return {
      error: "Access denied. Admin or officer privileges required.",
      status: 403,
    };
  }

  return { user, email, isAdmin, isOfficer: !!officer };
}

// ============================================================================
// GET /api/submissions/polo/analytics
// Get voting analytics for admin dashboard
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateAdmin(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get voting config
    const { data: config } = await supabaseAdmin
      .from("polo_voting_config")
      .select("*")
      .eq("id", 1)
      .single();

    // Get vote statistics from analytics view
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from("polo_voting_analytics")
      .select("*");

    if (analyticsError) {
      console.error("Error fetching analytics:", analyticsError);
      return NextResponse.json(
        { error: "Failed to fetch voting analytics." },
        { status: 500 }
      );
    }

    // Get total vote count
    const { count: totalVotes, error: countError } = await supabaseAdmin
      .from("polo_votes")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting votes:", countError);
    }

    // Get detailed voter list with their votes
    const { data: voterList, error: voterError } = await supabaseAdmin
      .from("polo_votes")
      .select(
        `
        id,
        student_email,
        student_name,
        voted_at,
        submission_id,
        polo_submissions (
          id,
          title,
          student_name,
          file_url
        )
      `
      )
      .order("voted_at", { ascending: false });

    if (voterError) {
      console.error("Error fetching voter list:", voterError);
    }

    // Calculate summary statistics
    const totalSubmissions = analytics?.length || 0;
    const submissionsWithVotes = analytics?.filter((a) => a.vote_count > 0).length || 0;
    const highestVotes = Math.max(...(analytics?.map((a) => a.vote_count) || [0]));
    const averageVotes =
      totalVotes && totalSubmissions > 0
        ? Math.round((totalVotes / totalSubmissions) * 10) / 10
        : 0;

    // Get top 3 designs
    const topDesigns = analytics
      ?.sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 3)
      .map((design, index) => ({
        rank: index + 1,
        id: design.id,
        title: design.title,
        designer_name: design.designer_name,
        vote_count: design.vote_count,
        vote_percentage: design.vote_percentage,
        file_url: design.file_url,
      }));

    // Get voting timeline (votes per day)
    const { data: timeline, error: timelineError } = await supabaseAdmin.rpc(
      "get_voting_timeline",
      {},
      { count: "exact" }
    );

    // If the RPC doesn't exist, we'll calculate it manually
    const votingTimeline =
      timeline ||
      (voterList
        ? voterList.reduce((acc: any[], vote) => {
            const date = new Date(vote.voted_at).toLocaleDateString();
            const existing = acc.find((item) => item.date === date);
            if (existing) {
              existing.count += 1;
            } else {
              acc.push({ date, count: 1 });
            }
            return acc;
          }, [])
        : []);

    return NextResponse.json({
      config: {
        voting_enabled: config?.voting_enabled || false,
        voting_start_date: config?.voting_start_date || null,
        voting_end_date: config?.voting_end_date || null,
        allow_vote_change: config?.allow_vote_change || false,
      },
      summary: {
        total_votes: totalVotes || 0,
        total_submissions: totalSubmissions,
        submissions_with_votes: submissionsWithVotes,
        highest_votes: highestVotes,
        average_votes: averageVotes,
      },
      analytics: analytics || [],
      top_designs: topDesigns || [],
      voters: voterList || [],
      timeline: votingTimeline,
    });
  } catch (err) {
    console.error("GET /api/submissions/polo/analytics error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/submissions/polo/analytics
// Update voting configuration
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateAdmin(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { email } = auth;
    const body = await req.json();

    const {
      voting_enabled,
      voting_start_date,
      voting_end_date,
      allow_vote_change,
    } = body;

    // Update voting config
    const { data: updatedConfig, error: updateError } = await supabaseAdmin
      .from("polo_voting_config")
      .update({
        voting_enabled:
          voting_enabled !== undefined ? voting_enabled : undefined,
        voting_start_date:
          voting_start_date !== undefined ? voting_start_date : undefined,
        voting_end_date:
          voting_end_date !== undefined ? voting_end_date : undefined,
        allow_vote_change:
          allow_vote_change !== undefined ? allow_vote_change : undefined,
        updated_at: new Date().toISOString(),
        updated_by: email,
      })
      .eq("id", 1)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating voting config:", updateError);
      return NextResponse.json(
        { error: "Failed to update voting configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Voting configuration updated successfully.",
      config: updatedConfig,
    });
  } catch (err) {
    console.error("POST /api/submissions/polo/analytics error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
