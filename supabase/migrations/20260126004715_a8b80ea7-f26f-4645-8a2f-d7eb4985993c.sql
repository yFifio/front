-- Add discount and featured fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.products.discount_percent IS 'Percentage discount (0-100)';
COMMENT ON COLUMN public.products.is_featured IS 'Whether the product should be featured/highlighted';