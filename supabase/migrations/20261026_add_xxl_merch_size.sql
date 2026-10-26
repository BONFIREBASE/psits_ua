-- ============================================================================
-- Migration: 20261026_add_xxl_merch_size.sql
-- Description: Update size constraint on merch_orders to support XXL size
-- ============================================================================

DO $$
BEGIN
  -- Drop existing constraint if present
  IF EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'merch_orders' AND constraint_name = 'merch_orders_size_check'
  ) THEN
    ALTER TABLE public.merch_orders DROP CONSTRAINT merch_orders_size_check;
  END IF;

  -- Add updated constraint including XXL and custom multi-size breakdown strings
  ALTER TABLE public.merch_orders 
    ADD CONSTRAINT merch_orders_size_check 
    CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL') OR length(size) > 0);
END $$;
