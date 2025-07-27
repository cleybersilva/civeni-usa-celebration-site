-- Fix remaining database functions with secure search_path

CREATE OR REPLACE FUNCTION public.generate_daily_report(report_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  registration_count INTEGER;
  total_revenue DECIMAL(10,2);
  report_data JSON;
BEGIN
  -- Contar inscrições do dia
  SELECT COUNT(*) INTO registration_count
  FROM public.event_registrations
  WHERE DATE(created_at) = report_date;
  
  -- Calcular faturamento do dia
  SELECT COALESCE(SUM(amount_paid), 0) INTO total_revenue
  FROM public.event_registrations
  WHERE DATE(created_at) = report_date
  AND payment_status = 'completed';
  
  -- Montar relatório
  report_data := json_build_object(
    'date', report_date,
    'total_registrations', registration_count,
    'total_revenue', total_revenue,
    'generated_at', NOW()
  );
  
  -- Inserir logs de alerta para relatório diário
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'email',
    'cleyber.silva@live.com',
    'Relatório diário - Inscrições: ' || registration_count || ' | Faturamento: R$ ' || total_revenue,
    'sent'
  );
  
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, status)
  VALUES (
    'daily_report',
    'sms',
    '(83) 98832-9018',
    'Relatório ' || report_date || ': ' || registration_count || ' inscrições, R$ ' || total_revenue,
    'sent'
  );
  
  RETURN report_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_password_reset(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users WHERE email = user_email
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_user_permission(user_email text, permission_type text, resource text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT 
    CASE 
      WHEN user_type = 'admin_root' THEN TRUE
      WHEN user_type = 'admin' AND resource IN ('banner', 'contador', 'copyright', 'inscricoes', 'local', 'online', 'palestrantes', 'parceiros', 'textos', 'videos') THEN TRUE
      WHEN user_type = 'design' AND resource IN ('banner', 'palestrantes', 'videos') THEN TRUE
      WHEN user_type = 'editor' AND resource IN ('contador', 'inscricoes', 'local', 'online', 'parceiros', 'textos') THEN TRUE
      ELSE FALSE
    END
  FROM public.admin_users
  WHERE email = user_email;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_payment_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Só dispara se o status mudou para 'completed'
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Inserir log de alerta para email
    INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
    VALUES (
      'payment_completed',
      'email',
      'cleyber.silva@live.com',
      'Pagamento confirmado: ' || NEW.full_name || ' - R$ ' || COALESCE(NEW.amount_paid::text, '0'),
      NEW.id
    );
    
    -- Inserir log de alerta para SMS
    INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
    VALUES (
      'payment_completed',
      'sms',
      '(83) 98832-9018',
      'Pagamento: ' || NEW.full_name || ' - R$ ' || COALESCE(NEW.amount_paid::text, '0'),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(user_id uuid, email text, user_type admin_user_type, is_admin_root boolean, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT id, admin_users.email, admin_users.user_type, admin_users.is_admin_root, admin_users.created_at
  FROM public.admin_users
  ORDER BY created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.delete_admin_user(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  target_email TEXT;
BEGIN
  -- Obter email do usuário a ser deletado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir deletar o admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível deletar o admin root principal');
  END IF;
  
  -- Deletar o usuário
  DELETE FROM public.admin_users WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Usuário deletado com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_admin_user_type(user_id uuid, new_user_type admin_user_type)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  calling_user_email TEXT;
  is_root BOOLEAN;
  target_email TEXT;
BEGIN
  -- Verificar se o usuário que está chamando é admin_root
  SELECT email INTO calling_user_email FROM public.admin_users 
  WHERE id = auth.uid() OR email = current_setting('app.current_user_email', true);
  
  SELECT COALESCE(is_admin_root, false) INTO is_root 
  FROM public.admin_users 
  WHERE email = calling_user_email;
  
  -- Só admin_root pode atualizar usuários
  IF NOT is_root THEN
    RETURN json_build_object('success', false, 'error', 'Acesso negado: apenas admin_root pode atualizar usuários');
  END IF;
  
  -- Obter email do usuário a ser atualizado
  SELECT email INTO target_email FROM public.admin_users WHERE id = user_id;
  
  -- Não permitir alterar o admin root principal
  IF target_email = 'cleyber.silva@live.com' THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível alterar o admin root principal');
  END IF;
  
  -- Atualizar o tipo do usuário
  UPDATE public.admin_users 
  SET user_type = new_user_type, updated_at = now()
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Usuário atualizado com sucesso');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_registration_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Inserir log de alerta para email
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
  VALUES (
    'new_registration',
    'email',
    'cleyber.silva@live.com',
    'Nova inscrição realizada: ' || NEW.full_name || ' (' || NEW.email || ')',
    NEW.id
  );
  
  -- Inserir log de alerta para SMS
  INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message, triggered_by_id)
  VALUES (
    'new_registration',
    'sms',
    '(83) 98832-9018',
    'Nova inscrição: ' || NEW.full_name,
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;

-- Enhanced admin login function with rate limiting and secure search_path
CREATE OR REPLACE FUNCTION public.verify_admin_login_secure(user_email text, user_password text, user_ip text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  failed_attempts INTEGER;
  user_record RECORD;
  result JSON;
BEGIN
  -- Check for too many failed attempts in last 15 minutes
  SELECT COUNT(*) INTO failed_attempts
  FROM public.login_attempts
  WHERE email = user_email
  AND success = false
  AND attempted_at > (now() - interval '15 minutes');
  
  -- Block if too many failed attempts
  IF failed_attempts >= 5 THEN
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, false);
    
    RETURN json_build_object(
      'success', false, 
      'error', 'Muitas tentativas falharam. Tente novamente em 15 minutos.'
    );
  END IF;
  
  -- Verify credentials
  SELECT id, email, user_type INTO user_record
  FROM public.admin_users
  WHERE admin_users.email = user_email 
  AND password_hash = crypt(user_password, password_hash);
  
  IF user_record.id IS NOT NULL THEN
    -- Log successful attempt
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, true);
    
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'user_type', user_record.user_type
      )
    );
  ELSE
    -- Log failed attempt
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, false);
    
    RETURN json_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log failed attempt on error
    INSERT INTO public.login_attempts (email, ip_address, success)
    VALUES (user_email, user_ip, false);
    
    RETURN json_build_object('success', false, 'error', 'Erro interno do servidor');
END;
$function$;