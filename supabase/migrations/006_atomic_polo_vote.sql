-- ============================================================================
-- MIGRATION 006: ATOMIC POLO CONTEST VOTING PROCEDURE
-- ============================================================================
-- Consolidates voting config check, submission verification, and vote insertion
-- into a single ACID-compliant database transaction.
-- Eliminates multi-roundtrip network latency and prevents double-voting race conditions
-- during peak campus election windows.
-- ============================================================================

CREATE OR REPLACE FUNCTION cast_polo_vote_atomic(
  p_student_email TEXT,
  p_student_name TEXT,
  p_submission_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config RECORD;
  v_submission RECORD;
  v_existing_vote RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_vote_id UUID;
BEGIN
  -- 1. Fetch and validate voting configuration
  SELECT * INTO v_config FROM polo_voting_config WHERE id = 1;
  IF NOT FOUND OR NOT v_config.voting_enabled THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'error', 'Voting is currently disabled.');
  END IF;

  IF v_config.voting_start_date IS NOT NULL AND v_now < v_config.voting_start_date THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'error', 'Voting has not started yet.');
  END IF;

  IF v_config.voting_end_date IS NOT NULL AND v_now > v_config.voting_end_date THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'error', 'Voting period has concluded.');
  END IF;

  -- 2. Verify submission exists and is approved
  SELECT id, title, student_name INTO v_submission
  FROM polo_submissions
  WHERE id = p_submission_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'error', 'Approved submission not found.');
  END IF;

  -- 3. Check for existing vote by this student
  SELECT id, submission_id INTO v_existing_vote
  FROM polo_votes
  WHERE student_email = p_student_email;

  IF FOUND THEN
    IF v_existing_vote.submission_id = p_submission_id THEN
      RETURN jsonb_build_object('success', false, 'status', 400, 'error', 'You have already voted for this design.');
    END IF;

    IF NOT v_config.allow_vote_change THEN
      RETURN jsonb_build_object('success', false, 'status', 400, 'error', 'You have already submitted your vote. Vote changes are not allowed.');
    END IF;

    -- Update existing vote
    UPDATE polo_votes
    SET submission_id = p_submission_id,
        voted_at = v_now,
        ip_address = p_ip_address,
        user_agent = p_user_agent
    WHERE id = v_existing_vote.id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 200,
      'action', 'updated',
      'message', 'Your vote has been successfully updated.'
    );
  END IF;

  -- 4. Atomically insert new vote
  INSERT INTO polo_votes (student_email, student_name, submission_id, voted_at, ip_address, user_agent)
  VALUES (p_student_email, p_student_name, p_submission_id, v_now, p_ip_address, p_user_agent)
  RETURNING id INTO v_vote_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 200,
    'action', 'created',
    'message', 'Your vote has been successfully recorded.'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'error', 'You have already submitted your vote.');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'status', 500, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION cast_polo_vote_atomic IS 'Performs atomic verification and recording of polo contest votes to handle high-concurrency loads with zero race conditions.';
