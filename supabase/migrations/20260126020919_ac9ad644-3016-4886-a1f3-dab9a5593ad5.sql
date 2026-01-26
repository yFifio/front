-- Fix critical security vulnerability: Downloads table has permissive RLS policies
-- This allows anyone to enumerate and steal download tokens

-- Drop the insecure policies
DROP POLICY IF EXISTS "Anyone can view downloads by token" ON public.downloads;
DROP POLICY IF EXISTS "System can manage downloads" ON public.downloads;

-- Create secure policies
-- Users can only view their own downloads (based on order ownership)
CREATE POLICY "Users can view own downloads" ON public.downloads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = downloads.order_id 
      AND (orders.customer_id = auth.uid() OR is_admin())
    )
  );

-- Only admins can manage downloads directly via the client
-- Edge functions use service role which bypasses RLS
CREATE POLICY "Admins can manage downloads" ON public.downloads
  FOR ALL USING (is_admin());