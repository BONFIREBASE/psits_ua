-- Create banners table for Home Page & Announcement Hero Banners
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active banners
CREATE POLICY "Allow public read access to banners" ON public.banners
  FOR SELECT USING (true);

-- Allow service role full access for management actions
CREATE POLICY "Allow service role full access to banners" ON public.banners
  FOR ALL USING (true);

-- Indexes for efficient ordering and status lookups
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);
