-- Create dues_term_config table for global academic year and semester management
CREATE TABLE IF NOT EXISTS public.dues_term_config
    (
        id                       INTEGER PRIMARY KEY DEFAULT 1              ,
        active_academic_year     TEXT NOT NULL DEFAULT '2026-2027'          ,
        active_semester          TEXT NOT NULL DEFAULT '1st Semester'       ,
        available_academic_years TEXT[] NOT NULL DEFAULT ARRAY['2026-2027'  ,
        '2025-2026'                                                         ,
        '2024-2025'                                                         ,
        '2023-2024']                                                        ,
        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_by TEXT                                                     ,
        CONSTRAINT single_dues_config_row CHECK (id = 1)
    )
;
-- Seed default configuration if not present
INSERT INTO public.dues_term_config
    (
        id                  ,
        active_academic_year,
        active_semester     ,
        available_academic_years
    )
VALUES
    (
        1                ,
        '2026-2027'      ,
        '1st Semester'   ,
        ARRAY['2026-2027',
        '2025-2026'      ,
        '2024-2025'      ,
        '2023-2024']
    )
    ON CONFLICT
    (
        id
    )
    DO NOTHING;
-- Enable Row Level Security (RLS)
ALTER TABLE public.dues_term_config
    ENABLE ROW LEVEL SECURITY;
-- Allow public read access (for public dues page transparency)
CREATE POLICY "Allow public read access to dues_term_config" ON public.dues_term_config FOR
SELECT
USING
    (true);
-- Allow service role full access (for officer management actions)
CREATE POLICY "Allow service role full access to dues_term_config" ON public.dues_term_config FOR ALL USING (true);