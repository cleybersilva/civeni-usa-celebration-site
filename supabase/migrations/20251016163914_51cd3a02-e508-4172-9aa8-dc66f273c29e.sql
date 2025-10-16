-- ============================================
-- SECURITY FIX: Implement proper RBAC with user_roles table
-- ============================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer', 'design', 'admin_root');

-- 2. Create user_roles table (user_id references admin_users.id directly)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_email text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.admin_users au ON ur.user_id = au.id
    WHERE au.email = _user_email
      AND ur.role = _role
  )
$$;

-- 4. RLS policy for user_roles (admin_root can manage)
CREATE POLICY "Admin root can manage user roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.email = current_setting('app.current_user_email', true)
      AND (au.user_type = 'admin_root' OR au.is_admin_root = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.email = current_setting('app.current_user_email', true)
      AND (au.user_type = 'admin_root' OR au.is_admin_root = true)
  )
);

-- 5. Migrate existing admin users to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  CASE 
    WHEN user_type = 'admin_root' THEN 'admin_root'::app_role
    WHEN user_type = 'admin' THEN 'admin'::app_role
    WHEN user_type = 'editor' THEN 'editor'::app_role
    WHEN user_type = 'design' THEN 'design'::app_role
    ELSE 'viewer'::app_role
  END
FROM public.admin_users
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- Create helper function for server-side role validation
-- ============================================

CREATE OR REPLACE FUNCTION public.check_user_role_secure(
  user_email text,
  session_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_ok boolean;
  user_roles_array text[];
  is_root boolean;
BEGIN
  -- Validate session
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid session');
  END IF;
  
  -- Get user roles
  SELECT array_agg(ur.role::text)
  INTO user_roles_array
  FROM public.user_roles ur
  INNER JOIN public.admin_users au ON ur.user_id = au.id
  WHERE au.email = user_email;
  
  -- Check if admin_root
  SELECT 
    CASE 
      WHEN 'admin_root' = ANY(user_roles_array) THEN true
      WHEN au.is_admin_root = true THEN true
      ELSE false
    END
  INTO is_root
  FROM public.admin_users au
  WHERE au.email = user_email;
  
  RETURN jsonb_build_object(
    'success', true,
    'roles', COALESCE(user_roles_array, ARRAY[]::text[]),
    'is_admin_root', COALESCE(is_root, false)
  );
END;
$$;