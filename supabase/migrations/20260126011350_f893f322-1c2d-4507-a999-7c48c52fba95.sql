-- Drop permissive INSERT policies on orders and order_items
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

-- Drop permissive INSERT/UPDATE policies on payments (edge functions use service role)
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

-- The edge functions will use the service role key to insert orders, order_items, and payments
-- Regular users can only SELECT their own data through existing policies