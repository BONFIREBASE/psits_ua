-- ============================================================================
-- Migration: 20261025_create_merch_orders.sql
-- Description: Create merch_orders table for Official CCIS Polo Shirt Ordering
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  course_year TEXT,
  contact_number TEXT,
  item_id TEXT NOT NULL DEFAULT 'polo-2026',
  item_name TEXT NOT NULL DEFAULT 'Official PSITS Polo Shirt (AY 2026–2027) - NEXGEN TECHTORCH',
  size TEXT NOT NULL CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity = 1),
  unit_price NUMERIC NOT NULL DEFAULT 475,
  total_amount NUMERIC NOT NULL DEFAULT 475,
  notes TEXT,
  receipt_key TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  receipt_filename TEXT,
  receipt_size INT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ordered', 'ready_for_pickup', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification', 'verified', 'rejected')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique index to strictly enforce 1 active order per student email
CREATE UNIQUE INDEX IF NOT EXISTS idx_merch_orders_single_active 
ON public.merch_orders (lower(student_email)) 
WHERE status != 'cancelled';

-- Index for fast order lookups by email and status
CREATE INDEX IF NOT EXISTS idx_merch_orders_email ON public.merch_orders (lower(student_email));
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON public.merch_orders (status);
CREATE INDEX IF NOT EXISTS idx_merch_orders_created_at ON public.merch_orders (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read? No. Orders are private.
-- Students can select their own orders
CREATE POLICY "Students can view own orders" ON public.merch_orders
  FOR SELECT USING (
    lower(auth.jwt() ->> 'email') = lower(student_email)
    OR lower(auth.jwt() ->> 'email') = 'psits-ua@antiquespride.edu.ph'
    OR EXISTS (SELECT 1 FROM public.officers WHERE lower(email) = lower(auth.jwt() ->> 'email'))
  );

-- Students can insert their own orders
CREATE POLICY "Students can create own order" ON public.merch_orders
  FOR INSERT WITH CHECK (
    lower(auth.jwt() ->> 'email') = lower(student_email)
  );

-- Officers & Admins can update orders
CREATE POLICY "Officers can update orders" ON public.merch_orders
  FOR UPDATE USING (
    lower(auth.jwt() ->> 'email') = 'psits-ua@antiquespride.edu.ph'
    OR EXISTS (SELECT 1 FROM public.officers WHERE lower(email) = lower(auth.jwt() ->> 'email'))
  );

-- Two-step onboarding support: allow orders to be placed before paper receipt is uploaded
ALTER TABLE public.merch_orders ALTER COLUMN receipt_key DROP NOT NULL;
ALTER TABLE public.merch_orders ALTER COLUMN receipt_url DROP NOT NULL;

-- Allow bulk orders with multiple quantities and mixed sizes
ALTER TABLE public.merch_orders DROP CONSTRAINT IF EXISTS merch_orders_quantity_check;
ALTER TABLE public.merch_orders ADD CONSTRAINT merch_orders_quantity_check CHECK (quantity >= 1);
ALTER TABLE public.merch_orders DROP CONSTRAINT IF EXISTS merch_orders_size_check;


