-- ============================================================================
-- Migration: Update Polo Shirt Design Competition Voting Window
-- Date: October 6, 2026
--
-- Opening: Friday, October 9, 2026 at 12:00:00 PM PHT (UTC+8) / 04:00:00 UTC
-- Closing: Friday, October 9, 2026 at 11:59:59 PM PHT (UTC+8) / 15:59:59 UTC
-- ============================================================================
UPDATE
    polo_voting_config
SET
    voting_enabled    = TRUE                                    ,
    voting_start_date = '2026-10-09T12:00:00+08:00'::TIMESTAMPTZ,
    voting_end_date   = '2026-10-09T23:59:59+08:00'::TIMESTAMPTZ,
    updated_at        = NOW()
WHERE
    id = 1;