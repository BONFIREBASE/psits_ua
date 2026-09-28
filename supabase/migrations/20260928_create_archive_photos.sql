-- Create archive_photos table for PSITS Archive stack on About Page
CREATE TABLE IF NOT EXISTS public.archive_photos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  caption TEXT,
  year TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'staging', 'vault')),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.archive_photos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to archive photos
CREATE POLICY "Allow public read access to archive_photos" ON public.archive_photos
  FOR SELECT USING (true);

-- Allow service role full access for management actions
CREATE POLICY "Allow service role full access to archive_photos" ON public.archive_photos
  FOR ALL USING (true);

-- Indexes for efficient ordering and status filtering
CREATE INDEX IF NOT EXISTS idx_archive_photos_status ON public.archive_photos(status);
CREATE INDEX IF NOT EXISTS idx_archive_photos_display_order ON public.archive_photos(display_order);
