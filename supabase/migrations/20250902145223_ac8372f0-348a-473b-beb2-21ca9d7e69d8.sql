-- Criação do sistema de lotes do Civeni
-- extensão para UUID se ainda não estiver habilitada
create extension if not exists "pgcrypto";

-- Tabela de lotes
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,                              -- ex: 'Lote Lançamento', '1º Lote', etc.
  price_cents integer not null check (price_cents > 0), -- sempre inteiro em centavos
  dt_inicio date not null,
  dt_fim date not null,
  ativo boolean not null default true,             -- liga/desliga sem deletar
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_periodo_validos check (dt_inicio <= dt_fim)
);

-- Função para atualizar updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Trigger para updated_at
drop trigger if exists trg_lotes_updated_at on public.lotes;
create trigger trg_lotes_updated_at
before update on public.lotes
for each row execute function public.set_updated_at();

-- Função para bloqueio de sobreposição de datas
create or replace function public.fn_lotes_no_overlap()
returns trigger language plpgsql as $$
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

-- Trigger para bloqueio de sobreposição
drop trigger if exists trg_lotes_no_overlap on public.lotes;
create trigger trg_lotes_no_overlap
before insert or update on public.lotes
for each row execute function public.fn_lotes_no_overlap();

-- View do lote vigente (timezone Fortaleza)
create or replace view public.v_lote_atual as
select *
from public.lotes
where ativo = true
  and (timezone('America/Fortaleza', now()))::date between dt_inicio and dt_fim
order by dt_inicio desc
limit 1;

-- RLS para lotes
alter table public.lotes enable row level security;

-- Site (anon): pode ler, mas só lotes ativos
drop policy if exists p_lotes_select_site on public.lotes;
create policy p_lotes_select_site on public.lotes
for select
to anon
using (ativo = true);

-- Admins podem fazer tudo
drop policy if exists p_lotes_admin_all on public.lotes;
create policy p_lotes_admin_all on public.lotes
for all
using (is_current_user_admin())
with check (is_current_user_admin());

-- Seed com os lotes solicitados (apenas se a tabela estiver vazia)
insert into public.lotes (nome, price_cents, dt_inicio, dt_fim)
select nome, price_cents, dt_inicio::date, dt_fim::date from (values
  ('Lote Lançamento', 7500, '2025-09-01', '2025-09-07'),
  ('1º Lote',         8500, '2025-09-08', '2025-09-30'),
  ('2º Lote',         9500, '2025-10-01', '2025-10-31'),
  ('3º Lote',        11500, '2025-11-01', '2025-11-30'),
  ('Último Lote',    15000, '2025-12-01', '2025-12-10')
) as t(nome, price_cents, dt_inicio, dt_fim)
where not exists (select 1 from public.lotes);