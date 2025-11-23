-- Admin upsert function for event_certificates
CREATE OR REPLACE FUNCTION public.admin_upsert_event_certificate(
  p_config jsonb,
  p_user_email text,
  p_session_token uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_ok boolean;
  result_row event_certificates%ROWTYPE;
BEGIN
  -- Validate and set current user for RLS
  SELECT set_current_user_email_secure(p_user_email, p_session_token) INTO session_ok;
  IF NOT COALESCE(session_ok, false) THEN
    RAISE EXCEPTION 'Access denied: invalid or expired session';
  END IF;

  -- Ensure caller is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;

  INSERT INTO event_certificates (
    event_id,
    is_enabled,
    required_correct,
    keywords,
    issuer_name,
    issuer_role,
    issuer_signature_url,
    hours,
    city,
    country,
    timezone,
    template_id,
    issue_rule
  ) VALUES (
    (p_config->>'event_id')::uuid,
    COALESCE((p_config->>'is_enabled')::boolean, true),
    CASE WHEN p_config ? 'required_correct' THEN (p_config->>'required_correct')::int ELSE 2 END,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_config->'keywords')), ARRAY[]::text[]),
    NULLIF(p_config->>'issuer_name',''),
    NULLIF(p_config->>'issuer_role',''),
    NULLIF(p_config->>'issuer_signature_url',''),
    NULLIF(p_config->>'hours',''),
    NULLIF(p_config->>'city',''),
    NULLIF(p_config->>'country',''),
    NULLIF(p_config->>'timezone',''),
    NULLIF(p_config->>'template_id',''),
    COALESCE(p_config->>'issue_rule', 'on_event_end')
  )
  ON CONFLICT (event_id) DO UPDATE
  SET
    is_enabled = EXCLUDED.is_enabled,
    required_correct = EXCLUDED.required_correct,
    keywords = EXCLUDED.keywords,
    issuer_name = EXCLUDED.issuer_name,
    issuer_role = EXCLUDED.issuer_role,
    issuer_signature_url = EXCLUDED.issuer_signature_url,
    hours = EXCLUDED.hours,
    city = EXCLUDED.city,
    country = EXCLUDED.country,
    timezone = EXCLUDED.timezone,
    template_id = EXCLUDED.template_id,
    issue_rule = EXCLUDED.issue_rule,
    updated_at = now()
  RETURNING * INTO result_row;

  RETURN to_json(result_row);
END;
$$;