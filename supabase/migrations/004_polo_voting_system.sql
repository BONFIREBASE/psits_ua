-- ============================================================================
-- POLO SHIRT DESIGN CONTEST - VOTING SYSTEM
-- ============================================================================
-- This migration adds voting functionality to the polo shirt design contest.
-- Features:
--   - One vote per student (enforced by unique constraint)
--   - Vote tracking with timestamps
--   - Voting period control
--   - Analytics support
-- ============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 1. ADD VOTE COUNT TO SUBMISSIONS TABLE                                  │
-- └─────────────────────────────────────────────────────────────────────────┘

ALTER TABLE polo_submissions
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0 NOT NULL;

-- Add index for faster vote count queries
CREATE INDEX IF NOT EXISTS idx_polo_submissions_vote_count 
ON polo_submissions(vote_count DESC);

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 2. CREATE VOTES TABLE                                                   │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS polo_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Voter Information
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  
  -- Voted Submission
  submission_id UUID NOT NULL REFERENCES polo_submissions(id) ON DELETE CASCADE,
  
  -- Timestamps
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Constraints
  CONSTRAINT unique_voter_email UNIQUE (student_email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_polo_votes_submission_id 
ON polo_votes(submission_id);

CREATE INDEX IF NOT EXISTS idx_polo_votes_student_email 
ON polo_votes(student_email);

CREATE INDEX IF NOT EXISTS idx_polo_votes_voted_at 
ON polo_votes(voted_at DESC);

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 3. CREATE VOTING CONFIG TABLE                                           │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS polo_voting_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Voting Period
  voting_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  voting_start_date TIMESTAMP WITH TIME ZONE,
  voting_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  allow_vote_change BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_by TEXT,
  
  -- Ensure only one config row exists
  CONSTRAINT single_config_row CHECK (id = 1)
);

-- Insert default config
-- TESTING MODE: Voting enabled with current dates
-- Production dates: Submission Period (Sept 28 - Oct 5), Voting Period (Oct 5 - Oct 9)
INSERT INTO polo_voting_config (id, voting_enabled, voting_start_date, voting_end_date)
VALUES (1, TRUE, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 4. CREATE FUNCTION TO UPDATE VOTE COUNTS                                │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION update_polo_submission_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment vote count
    UPDATE polo_submissions
    SET vote_count = vote_count + 1
    WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement vote count
    UPDATE polo_submissions
    SET vote_count = GREATEST(vote_count - 1, 0)
    WHERE id = OLD.submission_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote change (if allowed)
    IF NEW.submission_id <> OLD.submission_id THEN
      -- Decrement old submission
      UPDATE polo_submissions
      SET vote_count = GREATEST(vote_count - 1, 0)
      WHERE id = OLD.submission_id;
      
      -- Increment new submission
      UPDATE polo_submissions
      SET vote_count = vote_count + 1
      WHERE id = NEW.submission_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 5. CREATE TRIGGER FOR AUTOMATIC VOTE COUNT UPDATES                      │
-- └─────────────────────────────────────────────────────────────────────────┘

DROP TRIGGER IF EXISTS trigger_update_vote_count ON polo_votes;

CREATE TRIGGER trigger_update_vote_count
AFTER INSERT OR UPDATE OR DELETE ON polo_votes
FOR EACH ROW
EXECUTE FUNCTION update_polo_submission_vote_count();

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 6. CREATE VIEW FOR VOTING ANALYTICS                                     │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE VIEW polo_voting_analytics AS
SELECT
  ps.id,
  ps.title,
  ps.student_name AS designer_name,
  ps.student_course_year AS designer_course_year,
  ps.file_url,
  ps.vote_count,
  ROUND(
    (ps.vote_count::NUMERIC / NULLIF((SELECT SUM(vote_count) FROM polo_submissions WHERE status = 'approved'), 0)) * 100,
    2
  ) AS vote_percentage,
  ps.status,
  ps.created_at
FROM polo_submissions ps
WHERE ps.status = 'approved'
ORDER BY ps.vote_count DESC, ps.created_at ASC;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 7. ROW LEVEL SECURITY POLICIES                                          │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Enable RLS
ALTER TABLE polo_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE polo_voting_config ENABLE ROW LEVEL SECURITY;

-- Public can read voting config
CREATE POLICY "Anyone can view voting config"
ON polo_voting_config FOR SELECT
USING (true);

-- Authenticated users can insert their own vote
CREATE POLICY "Authenticated users can vote"
ON polo_votes FOR INSERT
WITH CHECK (auth.email() = student_email);

-- Users can view all votes (for transparency)
CREATE POLICY "Anyone can view votes"
ON polo_votes FOR SELECT
USING (true);

-- Only service role can update/delete votes
CREATE POLICY "Service role can manage votes"
ON polo_votes FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Only service role can update voting config
CREATE POLICY "Service role can update voting config"
ON polo_voting_config FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 8. COMMENTS FOR DOCUMENTATION                                           │
-- └─────────────────────────────────────────────────────────────────────────┘

COMMENT ON TABLE polo_votes IS 'Tracks student votes for polo shirt designs. One vote per student enforced by unique constraint.';
COMMENT ON TABLE polo_voting_config IS 'Configuration for voting period and settings. Single row table.';
COMMENT ON VIEW polo_voting_analytics IS 'Analytics view showing vote counts and percentages for approved submissions.';
COMMENT ON COLUMN polo_votes.student_email IS 'Email of the voter. Must be unique (one vote per student).';
COMMENT ON COLUMN polo_submissions.vote_count IS 'Total number of votes received. Updated automatically via trigger.';

