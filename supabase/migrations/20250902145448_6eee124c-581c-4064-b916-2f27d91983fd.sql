-- Correção dos warnings de segurança para o sistema de lotes

-- Recriar funções com search_path configurado
create or replace function public.set_updated_at()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.fn_lotes_no_overlap()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
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
end $$;