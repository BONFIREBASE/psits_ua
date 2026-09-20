-- Create posts table for PSITS-UA Blog & Announcements
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  full_content TEXT NOT NULL,
  image_url TEXT,
  highlight_quote TEXT,
  quote_author TEXT,
  post_url TEXT,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all visitors
CREATE POLICY "Allow public read access" ON public.posts
  FOR SELECT USING (true);

-- Allow service role full access for server actions
CREATE POLICY "Allow service role full access" ON public.posts
  FOR ALL USING (true);

-- Create index on slug and date
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
