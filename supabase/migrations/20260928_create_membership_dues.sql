-- Create membership_dues table for tracking semestral PSITS dues (Php 25.00)
CREATE TABLE IF NOT EXISTS public.membership_dues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_name_normalized TEXT NOT NULL,
  program TEXT NOT NULL DEFAULT 'BSIT',
  year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 4),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E')),
  year_section TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  academic_year TEXT NOT NULL DEFAULT '2025-2026',
  semester TEXT NOT NULL DEFAULT '2nd Semester',
  recorded_by TEXT,
  paid_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_student_dues_per_term UNIQUE (student_name_normalized, year_section, academic_year, semester)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.membership_dues ENABLE ROW LEVEL SECURITY;

-- Allow public read access to membership_dues
CREATE POLICY "Allow public read access to membership_dues" ON public.membership_dues
  FOR SELECT USING (true);

-- Allow service role full access for management actions
CREATE POLICY "Allow service role full access to membership_dues" ON public.membership_dues
  FOR ALL USING (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dues_year_section ON public.membership_dues(year_section);
CREATE INDEX IF NOT EXISTS idx_dues_term ON public.membership_dues(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_dues_created_at ON public.membership_dues(created_at DESC);
