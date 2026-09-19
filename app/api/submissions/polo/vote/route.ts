import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED_DOMAIN = "@antiquespride.edu.ph";

// ============================================================================
// HELPER: Authenticate Student
// ============================================================================

async function authenticateStudent(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      error: "Authentication required. Please sign in with your @antiquespride.edu.ph account.",
      status: 401,
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user || !user.email) {
    return { error: "Invalid or expired session. Please sign in again.", status: 401 };
  }

  const email = user.email.trim().toLowerCase();
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return {
      error: `Access restricted: Only ${ALLOWED_DOMAIN} institutional accounts are eligible to vote.`,
      status: 403,
    };
  }

  return { user, email };
}

// ============================================================================
// HELPER: Get Voting Configuration
// ============================================================================

async function getVotingConfig() {
  try {
    const { data, error } = await supabaseAdmin
      .from("polo_voting_config")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Error fetching voting config:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Exception fetching voting config:", err);
    return null;
  }
}

// ============================================================================
// HELPER: Check if Voting is Currently Allowed
// ============================================================================

function isVotingAllowed(config: any): { allowed: boolean; reason?: string } {
  if (!config) {
    return { allowed: false, reason: "Voting configuration not found." };
  }

  if (!config.voting_enabled) {
    return { allowed: false, reason: "Voting is currently disabled." };
  }

  const now = new Date();
  const startDate = config.voting_start_date ? new Date(config.voting_start_date) : null;
  const endDate = config.voting_end_date ? new Date(config.voting_end_date) : null;

  if (startDate && now < startDate) {
    return {
      allowed: false,
      reason: `Voting has not started yet. Opens on ${startDate.toLocaleDateString()}.`,
    };
  }

  if (endDate && now > endDate) {
    return {
      allowed: false,
      reason: `Voting has ended. Closed on ${endDate.toLocaleDateString()}.`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// GET /api/submissions/polo/vote
// Check if user has voted and get their vote
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { email } = auth;

    // Get voting config
    const config = await getVotingConfig();
    const votingStatus = isVotingAllowed(config);

    // Check if user has already voted
    const { data: existingVote, error: voteError } = await supabaseAdmin
      .from("polo_votes")
      .select("id, submission_id, voted_at")
      .eq("student_email", email)
      .maybeSingle();

    if (voteError) {
      console.error("Error checking existing vote:", voteError);
    }

    return NextResponse.json({
      hasVoted: !!existingVote,
      vote: existingVote || null,
      votingEnabled: votingStatus.allowed,
      votingMessage: votingStatus.reason,
      config: {
        voting_enabled: config?.voting_enabled || false,
        voting_start_date: config?.voting_start_date || null,
        voting_end_date: config?.voting_end_date || null,
        allow_vote_change: config?.allow_vote_change || false,
      },
    });
  } catch (err) {
    console.error("GET /api/submissions/polo/vote error:", err);
    return NextResponse.json(
      { error: "Failed to check voting status." },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/submissions/polo/vote
// Cast a vote for a polo shirt design
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, email } = auth;

    // Parse request body
    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required." },
        { status: 400 }
      );
    }

    // Get voting config
    const config = await getVotingConfig();
    const votingStatus = isVotingAllowed(config);

    if (!votingStatus.allowed) {
      return NextResponse.json(
        { error: votingStatus.reason || "Voting is not allowed at this time." },
        { status: 403 }
      );
    }

    // Check if submission exists and is approved
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("polo_submissions")
      .select("id, title, status, student_name")
      .eq("id", submissionId)
      .maybeSingle();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Design submission not found." },
        { status: 404 }
      );
    }

    if (submission.status !== "approved") {
      return NextResponse.json(
        { error: "You can only vote for approved designs." },
        { status: 400 }
      );
    }

    // Check if user already voted
    const { data: existingVote, error: existingVoteError } = await supabaseAdmin
      .from("polo_votes")
      .select("id, submission_id")
      .eq("student_email", email)
      .maybeSingle();

    if (existingVoteError) {
      console.error("Error checking existing vote:", existingVoteError);
    }

    if (existingVote) {
      // User already voted
      if (existingVote.submission_id === submissionId) {
        return NextResponse.json(
          { error: "You have already voted for this design." },
          { status: 400 }
        );
      }

      // Check if vote changes are allowed
      if (!config?.allow_vote_change) {
        return NextResponse.json(
          {
            error:
              "You have already submitted your vote. Vote changes are not allowed.",
          },
          { status: 400 }
        );
      }

      // Update existing vote
      const { error: updateError } = await supabaseAdmin
        .from("polo_votes")
        .update({
          submission_id: submissionId,
          voted_at: new Date().toISOString(),
        })
        .eq("id", existingVote.id);

      if (updateError) {
        console.error("Error updating vote:", updateError);
        return NextResponse.json(
          { error: "Failed to update your vote. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Your vote has been changed to "${submission.title || submission.student_name}".`,
        vote: {
          submission_id: submissionId,
          voted_at: new Date().toISOString(),
        },
      });
    }

    // Get client IP and user agent for audit trail
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Insert new vote
    const { data: newVote, error: insertError } = await supabaseAdmin
      .from("polo_votes")
      .insert({
        student_email: email,
        student_name: user.user_metadata?.full_name || email.split("@")[0],
        submission_id: submissionId,
        voted_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting vote:", insertError);

      // Check for unique constraint violation
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already submitted your vote." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to record your vote. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Your vote for "${submission.title || submission.student_name}" has been recorded!`,
      vote: {
        id: newVote.id,
        submission_id: newVote.submission_id,
        voted_at: newVote.voted_at,
      },
    });
  } catch (err) {
    console.error("POST /api/submissions/polo/vote error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your vote." },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/submissions/polo/vote
// Allow user to remove their vote (if enabled in config)
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateStudent(req);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { email } = auth;

    // Get voting config
    const config = await getVotingConfig();

    if (!config?.allow_vote_change) {
      return NextResponse.json(
        { error: "Vote removal is not allowed." },
        { status: 403 }
      );
    }

    // Delete user's vote
    const { error: deleteError } = await supabaseAdmin
      .from("polo_votes")
      .delete()
      .eq("student_email", email);

    if (deleteError) {
      console.error("Error deleting vote:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove your vote. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your vote has been removed successfully.",
    });
  } catch (err) {
    console.error("DELETE /api/submissions/polo/vote error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while removing your vote." },
      { status: 500 }
    );
  }
}
