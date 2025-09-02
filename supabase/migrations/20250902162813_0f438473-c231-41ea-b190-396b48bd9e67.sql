-- Fix security warnings by setting search_path for functions
ALTER FUNCTION update_cms_updated_at_column() SET search_path = public;

CREATE OR REPLACE FUNCTION update_cms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;