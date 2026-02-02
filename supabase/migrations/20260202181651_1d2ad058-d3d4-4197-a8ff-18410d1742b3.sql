-- Update the function to create downloads without expiration (very far future date)
-- and unlimited downloads when order is marked as paid or delivered
CREATE OR REPLACE FUNCTION public.create_downloads_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only trigger when status changes to 'paid' or 'delivered'
  IF (NEW.status = 'paid' OR NEW.status = 'delivered') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'delivered')) THEN
    
    -- Create download tokens for each digital product in the order
    FOR item IN 
      SELECT oi.product_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = NEW.id
        AND p.category = 'digital'
    LOOP
      -- Insert with no expiration (100 years in future) and unlimited downloads (NULL max_downloads)
      INSERT INTO downloads (order_id, product_id, download_token, expires_at, max_downloads, download_count)
      VALUES (NEW.id, item.product_id, gen_random_uuid()::text, NOW() + INTERVAL '100 years', NULL, 0)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE LOG 'Downloads created for order % (no expiration, unlimited)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;