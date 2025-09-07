-- Ensure pgcrypto is enabled in the correct schema used by Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Safely adjust function search_path so crypt/gen_salt are resolvable without rewriting functions
DO $$
BEGIN
  -- Non-secure CRUD (used by current UI)
  BEGIN
    ALTER FUNCTION public.create_admin_user(text, text, admin_user_type)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    ALTER FUNCTION public.update_admin_user_password(uuid, text)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    ALTER FUNCTION public.update_admin_user_type(uuid, admin_user_type)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    ALTER FUNCTION public.delete_admin_user(uuid)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;

  -- Secure variants
  BEGIN
    ALTER FUNCTION public.create_admin_user_secure(text, text, admin_user_type, text, uuid)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    ALTER FUNCTION public.update_admin_user_password_secure(uuid, text, text, uuid)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    ALTER FUNCTION public.update_admin_user_type_secure(uuid, admin_user_type, text, uuid)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;

  BEGIN
    ALTER FUNCTION public.verify_admin_login_secure(text, text, text)
      SET search_path = public, extensions;
  EXCEPTION WHEN undefined_function THEN NULL; END;
END$$;