-- Create popups table
CREATE TABLE public.popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  button_text TEXT,
  button_link TEXT,
  popup_type TEXT NOT NULL CHECK (popup_type IN ('homepage', 'funnel')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  discount_percent INTEGER,
  display_delay_seconds INTEGER DEFAULT 0,
  show_on_exit_intent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- Anyone can view active popups
CREATE POLICY "Anyone can view active popups"
ON public.popups
FOR SELECT
USING (is_active = true OR is_admin());

-- Only admins can manage popups
CREATE POLICY "Admins can manage popups"
ON public.popups
FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_popups_updated_at
BEFORE UPDATE ON public.popups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();