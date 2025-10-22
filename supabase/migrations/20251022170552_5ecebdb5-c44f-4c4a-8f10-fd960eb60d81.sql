-- Tabela principal de pagamentos Stripe (idempotente por event_id)
create table if not exists stripe_payments (
  id uuid primary key default gen_random_uuid(),
  stripe_object_id text not null unique,
  type text not null check (type in ('checkout.session', 'payment_intent', 'invoice', 'charge')),
  status text not null,
  amount_gross_cents bigint not null,
  amount_fee_cents bigint default 0,
  amount_net_cents bigint generated always as (amount_gross_cents - coalesce(amount_fee_cents,0)) stored,
  currency text not null,
  email text,
  customer_id text,
  metadata jsonb default '{}'::jsonb,
  event_id text not null unique,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_sp_status_time on stripe_payments(status, occurred_at desc);
create index if not exists idx_sp_metadata_lot on stripe_payments((metadata->>'lot_code'));
create index if not exists idx_sp_metadata_coupon on stripe_payments((metadata->>'coupon_code'));
create index if not exists idx_sp_email on stripe_payments(email);
create index if not exists idx_sp_occurred_at on stripe_payments(occurred_at desc);

-- Trigger para updated_at
create or replace function update_stripe_payments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_stripe_payments_updated_at
before update on stripe_payments
for each row execute function update_stripe_payments_updated_at();

-- Vista materializada: Receita por dia
create materialized view if not exists mv_revenue_daily as
select
  date_trunc('day', occurred_at at time zone 'America/Sao_Paulo') as day,
  sum(amount_gross_cents) as gross_cents,
  sum(amount_net_cents) as net_cents,
  count(*) as payments
from stripe_payments
where status in ('succeeded','paid','completed')
group by 1
order by 1;

create unique index if not exists idx_mv_revenue_daily_day on mv_revenue_daily(day);

-- Vista materializada: Inscrições por dia (baseado em event_registrations)
create materialized view if not exists mv_registrations_daily as
with base as (
  select 
    date_trunc('day', created_at at time zone 'America/Sao_Paulo') as day, 
    payment_status
  from event_registrations
)
select
  day,
  count(*) as total,
  count(*) filter (where payment_status in ('pending','started')) as started_or_submitted,
  count(*) filter (where payment_status = 'completed') as paid,
  count(*) filter (where payment_status = 'refunded') as refunded
from base
group by 1
order by 1;

create unique index if not exists idx_mv_registrations_daily_day on mv_registrations_daily(day);

-- Vista materializada: Taxa de conversão
create materialized view if not exists mv_conversion as
select
  r.day,
  case 
    when nullif(r.started_or_submitted, 0) is null then 0
    else r.paid::float / nullif(r.started_or_submitted, 0)
  end as conversion_ratio
from mv_registrations_daily r;

create unique index if not exists idx_mv_conversion_day on mv_conversion(day);

-- Vista materializada: Receita por lote/categoria e cupom
create materialized view if not exists mv_revenue_by_lot_coupon as
select
  coalesce((metadata->>'lot_code'), 'sem_lote') as lot_code,
  coalesce((metadata->>'coupon_code'), 'sem_cupom') as coupon_code,
  count(*) as payments,
  sum(amount_gross_cents) as gross_cents,
  sum(amount_net_cents) as net_cents
from stripe_payments
where status in ('succeeded','paid','completed')
group by 1,2
order by 4 desc;

create unique index if not exists idx_mv_revenue_lot_coupon on mv_revenue_by_lot_coupon(lot_code, coupon_code);

-- Tabela de fila para refresh das MVs (debouncing)
create table if not exists refresh_queue (
  id bigserial primary key,
  kind text not null,
  queued_at timestamptz default now()
);

-- Função para enfileirar refresh (sem argumentos - usa NEW/OLD)
create or replace function fn_queue_refresh()
returns trigger language plpgsql as $$
begin
  insert into refresh_queue(kind) values ('all');
  perform pg_notify('finance_refresh', 'all');
  return coalesce(new, old);
end; $$;

-- Triggers para enfileirar refresh automático
drop trigger if exists trg_payments_queue on stripe_payments;
create trigger trg_payments_queue
after insert or update on stripe_payments
for each row execute function fn_queue_refresh();

drop trigger if exists trg_regs_queue on event_registrations;
create trigger trg_regs_queue
after insert or update on event_registrations
for each row execute function fn_queue_refresh();

-- RLS para stripe_payments
alter table stripe_payments enable row level security;

create policy "stripe_payments_admin_all"
on stripe_payments for all
using (is_current_user_admin())
with check (is_current_user_admin());

-- RLS para refresh_queue
alter table refresh_queue enable row level security;

create policy "refresh_queue_admin_read"
on refresh_queue for select
using (is_current_user_admin());

-- Permissões para as MVs (admin_root e finance_admin)
grant select on mv_revenue_daily to authenticated;
grant select on mv_registrations_daily to authenticated;
grant select on mv_conversion to authenticated;
grant select on mv_revenue_by_lot_coupon to authenticated;