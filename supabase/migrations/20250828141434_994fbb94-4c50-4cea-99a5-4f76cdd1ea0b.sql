-- Corrigir warning do search_path nas funções de segurança
CREATE OR REPLACE FUNCTION public.enhanced_sanitize_partner_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitização aprimorada com validações de segurança
  NEW.company_name := trim(regexp_replace(NEW.company_name, '[<>\"''`\{\}\[\]\\]', '', 'g'));
  NEW.contact_name := trim(regexp_replace(NEW.contact_name, '[<>\"''`\{\}\[\]\\]', '', 'g'));
  NEW.email := lower(trim(NEW.email));
  
  -- Validação de email mais rigorosa
  IF NEW.email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Email format is invalid';
  END IF;
  
  -- Validação de tamanho para prevenir DoS
  IF length(NEW.company_name) > 100 THEN
    RAISE EXCEPTION 'Company name too long (max 100 characters)';
  END IF;
  
  IF length(NEW.contact_name) > 100 THEN
    RAISE EXCEPTION 'Contact name too long (max 100 characters)';
  END IF;
  
  -- Remover potenciais injeções de script e HTML
  IF NEW.message IS NOT NULL THEN
    NEW.message := trim(regexp_replace(NEW.message, '<[^>]*>', '', 'g'));
    NEW.message := regexp_replace(NEW.message, '(javascript:|data:|vbscript:|about:|file:)', '', 'gi');
    NEW.message := regexp_replace(NEW.message, '[<>\"''`\{\}\[\]\\]', '', 'g');
    
    -- Limitar tamanho da mensagem
    IF length(NEW.message) > 2000 THEN
      RAISE EXCEPTION 'Message too long (max 2000 characters)';
    END IF;
    
    -- Detectar tentativas de injeção SQL
    IF NEW.message ~* '\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b' THEN
      RAISE EXCEPTION 'Message contains prohibited content';
    END IF;
  END IF;
  
  -- Sanitizar e validar telefone
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '[^0-9()\-\+\s]', '', 'g');
    IF length(NEW.phone) > 20 THEN
      RAISE EXCEPTION 'Phone number too long (max 20 characters)';
    END IF;
  END IF;
  
  -- Sanitizar e validar website URL
  IF NEW.website IS NOT NULL THEN
    NEW.website := trim(NEW.website);
    -- Permitir apenas HTTP/HTTPS
    IF NEW.website !~ '^https?://' AND length(NEW.website) > 0 THEN
      NEW.website := 'https://' || NEW.website;
    END IF;
    -- Validar formato de URL
    IF NEW.website !~ '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$' THEN
      RAISE EXCEPTION 'Invalid website URL format';
    END IF;
    -- Bloquear URLs suspeitas
    IF NEW.website ~* '(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' THEN
      RAISE EXCEPTION 'Local or private IP addresses not allowed';
    END IF;
  END IF;
  
  -- Sempre definir status como pending
  NEW.status := 'pending';
  
  -- Log de tentativas suspeitas
  IF NEW.company_name ~* '(test|spam|fake|admin|root|example|null|undefined|script)' THEN
    INSERT INTO public.alert_logs (alert_type, recipient_type, recipient, message)
    VALUES (
      'suspicious_application',
      'email',
      'cleyber.silva@live.com',
      'Suspicious partner application: ' || NEW.company_name || ' from ' || NEW.email
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;