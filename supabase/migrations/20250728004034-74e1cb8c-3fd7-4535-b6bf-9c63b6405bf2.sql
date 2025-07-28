-- Create a function to set the current user email for RLS
CREATE OR REPLACE FUNCTION public.set_current_user_email(user_email text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_email', user_email, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;