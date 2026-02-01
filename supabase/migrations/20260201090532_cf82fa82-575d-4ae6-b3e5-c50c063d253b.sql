-- Function to automatically create downloads when order is marked as paid
CREATE OR REPLACE FUNCTION public.create_downloads_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  expires TIMESTAMPTZ;
BEGIN
  -- Only trigger when status changes to 'paid' or 'delivered'
  IF (NEW.status = 'paid' OR NEW.status = 'delivered') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'delivered')) THEN
    
    -- Set expiration to 30 days from now
    expires := NOW() + INTERVAL '30 days';
    
    -- Create download tokens for each digital product in the order
    FOR item IN 
      SELECT oi.product_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = NEW.id
        AND p.category = 'digital'
    LOOP
      -- Only insert if download doesn't already exist (idempotent)
      INSERT INTO downloads (order_id, product_id, download_token, expires_at, max_downloads, download_count)
      VALUES (NEW.id, item.product_id, gen_random_uuid()::text, expires, NULL, 0)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE LOG 'Downloads created for order %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_create_downloads_on_payment ON orders;

CREATE TRIGGER trigger_create_downloads_on_payment
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_downloads_on_payment();