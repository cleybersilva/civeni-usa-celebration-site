-- Create secure function to insert event_category within RLS using admin session validation
CREATE OR REPLACE FUNCTION public.create_event_category_secure(
  category jsonb,
  user_email text,
  session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  new_row public.event_category%ROWTYPE;
BEGIN
  -- Validate and set user context for this transaction
  SELECT public.set_current_user_email_secure(user_email, session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  -- Ensure caller is admin per current policies
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  -- Insert the category
  INSERT INTO public.event_category (
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
$$;