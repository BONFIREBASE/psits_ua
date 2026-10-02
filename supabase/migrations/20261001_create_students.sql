-- Create students table for tracking the official IT student class list
-- Source: University of Antique Master Class List (Excel)
-- Contains all registered BSIT students across all year levels and sections

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_no TEXT NOT NULL,
  full_name TEXT NOT NULL,
  full_name_normalized TEXT NOT NULL,
  year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 4),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E')),
  year_section TEXT NOT NULL,
  program TEXT NOT NULL DEFAULT 'BSIT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_student_no UNIQUE (student_no)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow public read access (students can look themselves up)
CREATE POLICY "Allow public read access to students" ON public.students
  FOR SELECT USING (true);

-- Allow service role full access for management actions
CREATE POLICY "Allow service role full access to students" ON public.students
  FOR ALL USING (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_student_no ON public.students(student_no);
CREATE INDEX IF NOT EXISTS idx_students_year_section ON public.students(year_section);
CREATE INDEX IF NOT EXISTS idx_students_name_normalized ON public.students(full_name_normalized);
CREATE INDEX IF NOT EXISTS idx_students_year_level ON public.students(year_level);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students(is_active) WHERE is_active = true;
