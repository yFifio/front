-- Add delivery address fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_city text,
ADD COLUMN IF NOT EXISTS delivery_state text,
ADD COLUMN IF NOT EXISTS delivery_zip text,
ADD COLUMN IF NOT EXISTS delivery_phone text,
ADD COLUMN IF NOT EXISTS tracking_code text;