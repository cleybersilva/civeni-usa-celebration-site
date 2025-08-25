-- Update RLS policies for event_category to be more flexible
DROP POLICY IF EXISTS "event_category_public_read" ON public.event_category;
DROP POLICY IF EXISTS "event_category_admin_all" ON public.event_category;

-- Create new policy for public read (only active categories)
CREATE POLICY "event_category_public_read" ON public.event_category
  FOR SELECT 
  USING (is_active = true);

-- Create comprehensive admin policy  
CREATE POLICY "event_category_admin_all" ON public.event_category
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());