-- PHASE 4: Final Security Improvements & Missing Issues

-- 1. Secure any remaining search path issues
CREATE OR REPLACE FUNCTION public.fn_lotes_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  conflitos int;
begin
  -- Só valida se o lote está ativo
  if new.ativo = false then
    return new;
  end if;
  
  select count(*) into conflitos
  from public.lotes l
  where l.ativo = true
    and l.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and daterange(l.dt_inicio, l.dt_fim, '[]') && daterange(new.dt_inicio, new.dt_fim, '[]');
  
  if conflitos > 0 then
    raise exception 'Intervalo de datas sobreposto com outro lote ativo.';
  end if;
  
  return new;
end;
$$;

-- 2. Create a secure function to mask email addresses for non-admin-root users
CREATE OR REPLACE FUNCTION public.mask_email_if_not_admin_root(email_input text, user_email text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin_root
  IF is_admin_root_user(user_email) THEN
    RETURN email_input;
  ELSE
    -- Mask email: show first 3 chars + *** + @domain
    RETURN substring(email_input, 1, 3) || '***@' || split_part(email_input, '@', 2);
  END IF;
END;
$$;

-- 3. Add audit logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_table text NOT NULL,
  accessed_by text NOT NULL,
  access_type text NOT NULL,
  access_details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admin_root can view audit logs
CREATE POLICY "security_audit_log_admin_root_only" 
ON public.security_audit_log 
FOR SELECT 
USING (
  is_admin_root_user(current_setting('app.current_user_email', true))
);

-- System can insert audit logs
CREATE POLICY "security_audit_log_system_insert" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- 4. Create a function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_security_access(
  table_name text,
  user_email text,
  access_type text,
  details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    accessed_table,
    accessed_by,
    access_type,
    access_details
  ) VALUES (
    table_name,
    user_email,
    access_type,
    details
  );
END;
$$;

-- 5. Add trigger to log admin_users access
CREATE OR REPLACE FUNCTION public.log_admin_users_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  IF user_email IS NOT NULL AND user_email != '' THEN
    PERFORM log_security_access(
      'admin_users',
      user_email,
      TG_OP,
      jsonb_build_object('accessed_user_id', COALESCE(NEW.id, OLD.id))
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for admin_users access logging
DROP TRIGGER IF EXISTS trigger_log_admin_users_access ON admin_users;
CREATE TRIGGER trigger_log_admin_users_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION log_admin_users_access();