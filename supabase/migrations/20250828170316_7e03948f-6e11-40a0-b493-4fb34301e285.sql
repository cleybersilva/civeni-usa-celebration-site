-- Final comprehensive fix for all SECURITY DEFINER functions missing search_path
-- This should resolve the persistent Function Search Path Mutable warning

-- Fix get_partner_applications_summary function
CREATE OR REPLACE FUNCTION public.get_partner_applications_summary()
 RETURNS TABLE(id uuid, company_name text, contact_name_masked text, email_masked text, partnership_type text, status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admin users to access this function
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    pa.id,
    pa.company_name,
    left(pa.contact_name, 1) || '***' as contact_name_masked,
    left(pa.email, 3) || '***@' || split_part(pa.email, '@', 2) as email_masked,
    pa.partnership_type,
    pa.status,
    pa.created_at,
    pa.updated_at
  FROM partner_applications pa
  ORDER BY pa.created_at DESC;
END;
$function$;

-- Fix get_registration_stats_secure function
CREATE OR REPLACE FUNCTION public.get_registration_stats_secure()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  stats JSON;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  -- Only allow admin users
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Get basic stats with conditional revenue access
  SELECT json_build_object(
    'total_registrations', COUNT(*),
    'completed_payments', COUNT(*) FILTER (WHERE payment_status = 'completed'),
    'pending_payments', COUNT(*) FILTER (WHERE payment_status = 'pending'),
    'total_revenue', CASE 
      WHEN is_admin_root_user(user_email) THEN COALESCE(SUM(amount_paid) FILTER (WHERE payment_status = 'completed'), 0)
      ELSE NULL -- Hide revenue from non-root admins
    END,
    'latest_registration', MAX(created_at)
  ) INTO stats
  FROM event_registrations;
  
  RETURN stats;
END;
$function$;

-- Fix get_registration_details_secure function  
CREATE OR REPLACE FUNCTION public.get_registration_details_secure(registration_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  user_type TEXT;
  registration_data JSON;
  is_root_user BOOLEAN;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  -- Only allow admin users
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Check if user is admin_root
  is_root_user := is_admin_root_user(user_email);
  
  -- Get user type for logging
  SELECT admin_users.user_type::TEXT INTO user_type
  FROM admin_users 
  WHERE email = user_email;
  
  -- Log the access attempt
  INSERT INTO registration_access_logs (
    registration_id,
    accessed_by,
    access_type,
    admin_user_type,
    accessed_columns
  ) VALUES (
    get_registration_details_secure.registration_id,
    user_email,
    'view',
    COALESCE(user_type, 'unknown'),
    CASE 
      WHEN is_root_user THEN ARRAY['*']
      ELSE ARRAY['basic_fields']
    END
  );
  
  -- Return data based on user permissions
  IF is_root_user THEN
    -- Admin root gets full access including sensitive payment data
    SELECT json_build_object(
      'id', er.id,
      'full_name', er.full_name,
      'email', er.email,
      'category_id', er.category_id,
      'batch_id', er.batch_id,
      'curso_id', er.curso_id,
      'turma_id', er.turma_id,
      'participant_type', er.participant_type,
      'payment_status', er.payment_status,
      'stripe_session_id', er.stripe_session_id,
      'amount_paid', er.amount_paid,
      'payment_method', er.payment_method,
      'card_brand', er.card_brand,
      'payment_type', er.payment_type,
      'currency', er.currency,
      'installments', er.installments,
      'coupon_code', er.coupon_code,
      'created_at', er.created_at,
      'updated_at', er.updated_at
    ) INTO registration_data
    FROM event_registrations er
    WHERE er.id = get_registration_details_secure.registration_id;
  ELSE
    -- Regular admins get basic data only (no sensitive payment info)
    SELECT json_build_object(
      'id', er.id,
      'full_name', er.full_name,
      'email', er.email,
      'category_id', er.category_id,
      'batch_id', er.batch_id,
      'curso_id', er.curso_id,
      'turma_id', er.turma_id,
      'participant_type', er.participant_type,
      'payment_status', er.payment_status,
      'created_at', er.created_at,
      'updated_at', er.updated_at
    ) INTO registration_data
    FROM event_registrations er
    WHERE er.id = get_registration_details_secure.registration_id;
  END IF;
  
  RETURN registration_data;
END;
$function$;

-- Fix update_registration_secure function
CREATE OR REPLACE FUNCTION public.update_registration_secure(registration_id uuid, updates json)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  is_root_user BOOLEAN;
  current_data RECORD;
  result JSON;
BEGIN
  user_email := current_setting('app.current_user_email', true);
  
  -- Only allow admin users
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  is_root_user := is_admin_root_user(user_email);
  
  -- Get current registration data
  SELECT * INTO current_data FROM event_registrations WHERE id = registration_id;
  
  IF current_data IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Registration not found');
  END IF;
  
  -- Log the update attempt
  INSERT INTO registration_access_logs (
    registration_id,
    accessed_by,
    access_type,
    admin_user_type,
    accessed_columns
  ) VALUES (
    update_registration_secure.registration_id,
    user_email,
    'update',
    CASE WHEN is_root_user THEN 'admin_root' ELSE 'admin' END,
    ARRAY(SELECT jsonb_object_keys(updates::jsonb))
  );
  
  -- Apply updates based on user permissions
  IF is_root_user THEN
    -- Admin root can update any field
    UPDATE event_registrations 
    SET 
      full_name = COALESCE((updates->>'full_name')::TEXT, full_name),
      email = COALESCE((updates->>'email')::TEXT, email),
      payment_status = COALESCE((updates->>'payment_status')::TEXT, payment_status),
      amount_paid = COALESCE((updates->>'amount_paid')::NUMERIC, amount_paid),
      updated_at = now()
    WHERE id = registration_id;
  ELSE
    -- Regular admin can only update basic fields
    UPDATE event_registrations 
    SET 
      full_name = COALESCE((updates->>'full_name')::TEXT, full_name),
      email = COALESCE((updates->>'email')::TEXT, email),
      updated_at = now()
    WHERE id = registration_id;
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Registration updated successfully');
END;
$function$;

-- Fix generate_daily_report function
CREATE OR REPLACE FUNCTION public.generate_daily_report(report_date date DEFAULT CURRENT_DATE)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  registration_count INTEGER;
  total_revenue DECIMAL(10,2);
  report_data JSON;
  calling_user_email TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Get calling user email from session context
  calling_user_email := current_setting('app.current_user_email', true);
  
  -- Verify caller is admin
  SELECT 
    CASE 
      WHEN user_type IN ('admin', 'admin_root') OR is_admin_root = true 
      THEN true 
      ELSE false 
    END INTO is_admin
  FROM admin_users 
  WHERE email = calling_user_email;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: admin privileges required');
  END IF;
  
  -- Count ALL registrations up to the specified date
  SELECT COUNT(*) INTO registration_count
  FROM event_registrations
  WHERE DATE(created_at) <= report_date;
  
  -- Calculate total revenue from confirmed payments up to the date
  SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
  FROM event_registrations
  WHERE DATE(created_at) <= report_date
  AND payment_status = 'completed';
  
  -- If no confirmed payments, consider potential value from pending ones
  IF total_revenue = 0 THEN
    SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
    FROM event_registrations
    WHERE DATE(created_at) <= report_date
    AND payment_status = 'pending';
  END IF;
  
  -- Build report
  report_data := json_build_object(
    'date', report_date,
    'total_registrations', registration_count,
    'total_revenue', total_revenue,
    'generated_at', NOW()
  );
  
  -- Insert alert logs for daily report
  INSERT INTO alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'email',
    'cleyber.silva@live.com',
    'Daily report - Registrations: ' || registration_count || ' | Revenue: R$ ' || total_revenue,
    'sent'
  );
  
  INSERT INTO alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'sms',
    '(83) 98832-9018',
    'Report ' || report_date || ': ' || registration_count || ' registrations, R$ ' || total_revenue,
    'sent'
  );
  
  RETURN report_data;
END;
$function$;

-- Fix create_event_category_secure function
CREATE OR REPLACE FUNCTION public.create_event_category_secure(category jsonb, user_email text, session_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  session_ok boolean;
  new_row event_category%ROWTYPE;
BEGIN
  -- Validate and set user context for this transaction
  SELECT set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  -- Ensure caller is admin per current policies
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Insert the category
  INSERT INTO event_category (
    event_id,
    slug,
    order_index,
    is_active,
    is_free,
    currency,
    price_cents,
    stripe_product_id,
    stripe_price_id,
    quota_total,
    available_from,
    available_until,
    lot_id,
    title_pt,
    title_en,
    title_es,
    title_tr,
    description_pt,
    description_en,
    description_es,
    description_tr,
    sync_status
  ) VALUES (
    (category->>'event_id')::uuid,
    category->>'slug',
    COALESCE((category->>'order_index')::int, 1),
    COALESCE((category->>'is_active')::boolean, true),
    COALESCE((category->>'is_free')::boolean, false),
    COALESCE(category->>'currency', 'BRL'),
    CASE WHEN category ? 'price_cents' THEN (category->>'price_cents')::int ELSE NULL END,
    NULLIF(category->>'stripe_product_id', ''),
    NULLIF(category->>'stripe_price_id', ''),
    CASE WHEN category ? 'quota_total' THEN (category->>'quota_total')::int ELSE NULL END,
    NULLIF(category->>'available_from','')::timestamptz,
    NULLIF(category->>'available_until','')::timestamptz,
    NULLIF(category->>'lot_id','')::uuid,
    category->>'title_pt',
    NULLIF(category->>'title_en',''),
    NULLIF(category->>'title_es',''),
    NULLIF(category->>'title_tr',''),
    NULLIF(category->>'description_pt',''),
    NULLIF(category->>'description_en',''),
    NULLIF(category->>'description_es',''),
    NULLIF(category->>'description_tr',''),
    COALESCE(category->>'sync_status','pending')
  ) RETURNING * INTO new_row;

  RETURN to_json(new_row);
END;
$function$;