-- ==============================================================================
-- PSITS-UA: Add UNIQUE constraint on student_email for polo_submissions
-- Prevents race condition where same student could double-submit simultaneously
-- ==============================================================================

ALTER TABLE polo_submissions
ADD CONSTRAINT unique_polo_submission_email UNIQUE (student_email);
