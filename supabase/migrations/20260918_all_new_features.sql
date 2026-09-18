-- ==============================================================================
-- PSITS-UA CONSOLIDATED MIGRATION SCRIPT
-- Run this once in your Supabase Project SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Ensure credits column exists in posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS credits JSONB;

-- 2. Create Banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('announcement', 'meeting', 'recruitment', 'forms', 'general')),
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Learn More',
  secondary_link_url TEXT,
  secondary_link_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to banners" ON public.banners;
CREATE POLICY "Allow public read access to banners" ON public.banners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access to banners" ON public.banners;
CREATE POLICY "Allow service role full access to banners" ON public.banners
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);

-- 3. Create Sessions table (for server-backed session logout)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  position TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to sessions" ON public.sessions;
CREATE POLICY "Allow public read access to sessions" ON public.sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access to sessions" ON public.sessions;
CREATE POLICY "Allow service role full access to sessions" ON public.sessions
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);
