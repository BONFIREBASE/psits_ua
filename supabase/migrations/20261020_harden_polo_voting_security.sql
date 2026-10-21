-- ==============================================================================
-- PSITS-UA: HARDEN POLO CONTEST VOTING SECURITY & ACCESS CONTROL
-- Purpose:
--   1. Protect ballot secrecy (prevent public harvesting of student emails, votes, and IPs).
--   2. Lock down polo_submissions (prevent unauthorized updates to vote_count, status, or title).
--   3. Secure polo_voting_config (prevent client-side alteration of dates or voting switches).
--   4. Ensure all vote processing routes strictly through atomic server procedures.
-- ==============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 1. SECURE POLO_VOTES (BALLOT SECRECY & PII PROTECTION)                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

ALTER TABLE public.polo_votes ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies
DROP POLICY IF EXISTS "Anyone can view votes" ON public.polo_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.polo_votes;
DROP POLICY IF EXISTS "Service role can manage votes" ON public.polo_votes;
DROP POLICY IF EXISTS "Service role full access on polo_votes" ON public.polo_votes;
DROP POLICY IF EXISTS "Students can view own vote" ON public.polo_votes;

-- Only service_role (the Next.js backend API / RPC) can manage votes
CREATE POLICY "Service role full access on polo_votes"
  ON public.polo_votes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated students can ONLY inspect their own vote record
CREATE POLICY "Students can view own vote"
  ON public.polo_votes
  FOR SELECT
  TO authenticated
  USING (
    student_email = (auth.jwt()->>'email')
  );

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 2. SECURE POLO_SUBMISSIONS (PREVENT VOTE_COUNT & TITLE TAMPERING)           │
-- └─────────────────────────────────────────────────────────────────────────────┘

ALTER TABLE public.polo_submissions ENABLE ROW LEVEL SECURITY;

-- Drop permissive or blanket policies
DROP POLICY IF EXISTS "Service role full access on polo_submissions" ON public.polo_submissions;
DROP POLICY IF EXISTS "Authenticated can manage polo submissions" ON public.polo_submissions;
DROP POLICY IF EXISTS "Authenticated can delete polo submissions" ON public.polo_submissions;
DROP POLICY IF EXISTS "Service role manages polo_submissions" ON public.polo_submissions;
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.polo_submissions;
DROP POLICY IF EXISTS "Allow students to view own submissions" ON public.polo_submissions;
DROP POLICY IF EXISTS "Students can view own submissions" ON public.polo_submissions;

-- Public read access: ONLY view approved or shortlisted submissions
CREATE POLICY "Public can view approved submissions"
  ON public.polo_submissions
  FOR SELECT
  USING (status IN ('approved', 'shortlisted'));

-- Authenticated students can view their own submission (even if pending)
CREATE POLICY "Students can view own submissions"
  ON public.polo_submissions
  FOR SELECT
  TO authenticated
  USING (
    student_email = (auth.jwt()->>'email')
  );

-- Only backend service_role can update or delete submissions (protects vote_count)
CREATE POLICY "Service role manages polo_submissions"
  ON public.polo_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ 3. SECURE POLO_VOTING_CONFIG (PREVENT DATE & SWITCH TAMPERING)              │
-- └─────────────────────────────────────────────────────────────────────────────┘

ALTER TABLE public.polo_voting_config ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view voting config" ON public.polo_voting_config;
DROP POLICY IF EXISTS "Service role can update voting config" ON public.polo_voting_config;
DROP POLICY IF EXISTS "Service role manages polo_voting_config" ON public.polo_voting_config;

-- Anyone can read the voting schedule and configuration
CREATE POLICY "Anyone can view voting config"
  ON public.polo_voting_config
  FOR SELECT
  USING (true);

-- Only service_role can alter voting configuration
CREATE POLICY "Service role manages polo_voting_config"
  ON public.polo_voting_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
