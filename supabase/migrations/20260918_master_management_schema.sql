-- 1. DOCUMENTS TABLE (Resolutions, Memos, Minutes)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('Resolution', 'Memo', 'Minutes')),
  reference_no TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Published')),
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TREASURY RECORDS (Income, Expenses, Disbursements, Receipts)
CREATE TABLE IF NOT EXISTS public.treasury_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  amount NUMERIC DEFAULT 0,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ATTENDANCE SYSTEM (Meetings & Scanned Logs)
CREATE TABLE IF NOT EXISTS public.attendance_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'emergency')),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.attendance_meetings(id) ON DELETE CASCADE,
  officer_name TEXT NOT NULL,
  position TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  qr_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')),
  method TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'manual'))
);

-- 4. EVENTS & CALENDAR
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. OFFICERS & COMMITTEES
CREATE TABLE IF NOT EXISTS public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  role_group TEXT NOT NULL,
  year_section TEXT NOT NULL,
  quote TEXT,
  image_url TEXT,
  is_pubmat BOOLEAN DEFAULT FALSE,
  pubmat_role TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PROJECTS SHOWCASE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  demo_url TEXT,
  github_url TEXT,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. AUDIT REPORTS
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Archived')),
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- ALLOW PUBLIC READ ACCESS & SERVICE ROLE WRITE ACCESS
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Read Access" ON %I;', t);
    EXECUTE format('CREATE POLICY "Public Read Access" ON %I FOR SELECT USING (true);', t);
    EXECUTE format('DROP POLICY IF EXISTS "Service Role Full Access" ON %I;', t);
    EXECUTE format('CREATE POLICY "Service Role Full Access" ON %I FOR ALL USING (true);', t);
  END LOOP;
END $$;
