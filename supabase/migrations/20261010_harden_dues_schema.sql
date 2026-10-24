-- Migration: Harden Membership Dues Schema & Prevent Name Normalization Drift
-- Date: 2026-10-10
-- Purpose:
--   1. Add student_id (FK to public.students) and student_no to membership_dues.
--   2. Add database triggers to guarantee automatic punctuation-free normalization.
--   3. Backfill existing membership_dues records with student_id and student_no.
--   4. Harden RLS policies so write access is restricted to service_role.

-- 1. Add Relational Columns to membership_dues
ALTER TABLE public.membership_dues
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_no TEXT;

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_dues_student_id ON public.membership_dues(student_id);
CREATE INDEX IF NOT EXISTS idx_dues_student_no ON public.membership_dues(student_no);

-- 2. Backfill existing records with student_id and student_no from students table
UPDATE public.membership_dues d
SET 
  student_id = s.id,
  student_no = s.student_no
FROM public.students s
WHERE d.student_name_normalized = s.full_name_normalized
  AND (d.student_id IS NULL OR d.student_no IS NULL);

-- 3. Automatic Normalization Trigger Function
-- Ensures that NO script, API call, or manual SQL query can EVER insert un-normalized names
CREATE OR REPLACE FUNCTION public.fn_normalize_student_name()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'membership_dues' THEN
    NEW.student_name_normalized := lower(regexp_replace(NEW.student_name, '[^\w\s]', '', 'g'));
  ELSIF TG_TABLE_NAME = 'students' THEN
    NEW.full_name_normalized := lower(regexp_replace(NEW.full_name, '[^\w\s]', '', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to membership_dues
DROP TRIGGER IF EXISTS trg_normalize_membership_dues ON public.membership_dues;
CREATE TRIGGER trg_normalize_membership_dues
  BEFORE INSERT OR UPDATE OF student_name ON public.membership_dues
  FOR EACH ROW EXECUTE FUNCTION public.fn_normalize_student_name();

-- Apply trigger to students
DROP TRIGGER IF EXISTS trg_normalize_students ON public.students;
CREATE TRIGGER trg_normalize_students
  BEFORE INSERT OR UPDATE OF full_name ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.fn_normalize_student_name();

-- 4. Harden RLS on membership_dues
DROP POLICY IF EXISTS "Allow public read access to membership_dues" ON public.membership_dues;
CREATE POLICY "Allow public read access to membership_dues" ON public.membership_dues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access to membership_dues" ON public.membership_dues;
CREATE POLICY "Allow service role full access to membership_dues" ON public.membership_dues
  FOR ALL TO service_role USING (true) WITH CHECK (true);
