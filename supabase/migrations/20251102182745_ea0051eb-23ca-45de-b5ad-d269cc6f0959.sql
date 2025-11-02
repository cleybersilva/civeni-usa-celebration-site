-- Criar função RPC para configurar o tipo "Sorteados" com permissões administrativas
CREATE OR REPLACE FUNCTION public.setup_sorteados_type()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sorteados_id uuid;
  sorteados_created boolean := false;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT is_current_user_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied: admin privileges required'
    );
  END IF;

  -- Verificar se "Sorteados" já existe
  SELECT id INTO sorteados_id
  FROM participant_types
  WHERE type_name = 'Sorteados';

  -- Criar o tipo "Sorteados" se não existir
  IF sorteados_id IS NULL THEN
    INSERT INTO participant_types (
      type_name,
      description,
      requires_course_selection,
      is_active
    ) VALUES (
      'Sorteados',
      'Participantes sorteados com 100% de desconto',
      false,
      true
    )
    RETURNING id INTO sorteados_id;
    
    sorteados_created := true;
  END IF;

  -- Atualizar o cupom CIVENI2025FREE para incluir "Sorteados"
  UPDATE coupon_codes
  SET 
    participant_type = 'Professor(a),Palestrantes,Sorteados',
    description = 'Cupom de 100% de desconto para Professor(a), Palestrantes e Sorteados',
    updated_at = now()
  WHERE code = 'CIVENI2025FREE';

  -- Verificar se o cupom foi atualizado
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cupom CIVENI2025FREE não encontrado'
    );
  END IF;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN sorteados_created THEN 'Tipo "Sorteados" criado e cupom CIVENI2025FREE atualizado com sucesso!'
      ELSE 'Tipo "Sorteados" já existia. Cupom CIVENI2025FREE atualizado com sucesso!'
    END,
    'sorteados_id', sorteados_id,
    'created', sorteados_created
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;