-- ==============================================================================
-- PSITS-UA: Faculty Leadership (Dean & Adviser) Management Schema
-- Created: October 5, 2026
-- Purpose: Dynamic management of CCIS Dean and PSITS Faculty Adviser
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.faculty_leadership
    (
        id                    TEXT PRIMARY KEY, -- 'dean' | 'adviser'
        name                  TEXT NOT NULL   ,
        credentials           TEXT DEFAULT '' ,
        title                 TEXT NOT NULL   ,
        department_or_college TEXT NOT NULL   ,
        institution           TEXT NOT NULL   ,
        image_url             TEXT            ,
        updated_at            TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
    )
;
-- Seed default initial records matching data/officers.ts
INSERT INTO public.faculty_leadership
    (
        id                   ,
        name                 ,
        credentials          ,
        title                ,
        department_or_college,
        institution          ,
        image_url
    )
VALUES
    (
        'dean'                                         ,
        'Dr. John C. Amar'                             ,
        'DM'                                           ,
        'Dean'                                         ,
        'College of Computing and Information Sciences',
        'University of Antique — Main Campus'          ,
        '/assets/dean.png'
    )
    ,
    (
        'adviser'                                      ,
        'Carl Spence Percy'                            ,
        'MIT'                                          ,
        'BSIT Program Head / PSITS Adviser'            ,
        'College of Computing and Information Sciences',
        'University of Antique — Main Campus'          ,
        NULL
    )
    ON CONFLICT
    (
        id
    )
    DO NOTHING;
-- Enable Row Level Security (RLS)
ALTER TABLE public.faculty_leadership
    ENABLE ROW LEVEL SECURITY;
-- Allow public read access for visitors to view faculty cards on /officers
DROP POLICY
IF EXISTS "Public Read Faculty Leadership" ON public.faculty_leadership;
    CREATE POLICY "Public Read Faculty Leadership" ON public.faculty_leadership FOR
    SELECT
    USING
        (true);
    -- Allow service role full access for server actions
    DROP POLICY
    IF EXISTS "Service Role Faculty Leadership" ON public.faculty_leadership;
        CREATE POLICY "Service Role Faculty Leadership" ON public.faculty_leadership FOR ALL USING (true);