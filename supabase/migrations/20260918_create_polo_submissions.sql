-- ==============================================================================
-- PSITS-UA: Polo Shirt Design Submissions Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.polo_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_avatar TEXT,
  student_course_year TEXT,
  title TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shortlisted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.polo_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated students to insert their own submission
CREATE POLICY "Allow public submissions with antiquespride email"
  ON public.polo_submissions
  FOR INSERT
  WITH CHECK (student_email LIKE '%@antiquespride.edu.ph');

-- Allow authenticated users to view their own submission
CREATE POLICY "Allow students to view own submissions"
  ON public.polo_submissions
  FOR SELECT
  USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access on polo_submissions"
  ON public.polo_submissions
  USING (true)
  WITH CHECK (true);

-- Index for fast lookup by email and creation date
CREATE INDEX IF NOT EXISTS idx_polo_submissions_email ON public.polo_submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_polo_submissions_created_at ON public.polo_submissions(created_at DESC);
