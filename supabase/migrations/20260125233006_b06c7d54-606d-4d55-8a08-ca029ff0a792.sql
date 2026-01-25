-- Update category constraint to support digital and physical products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE public.products ADD CONSTRAINT products_category_check CHECK (category IN ('digital', 'physical'));