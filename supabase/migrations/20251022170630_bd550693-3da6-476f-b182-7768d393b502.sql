-- Corrigir search_path das funções criadas
create or replace function update_stripe_payments_updated_at()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create or replace function fn_queue_refresh()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into refresh_queue(kind) values ('all');
  perform pg_notify('finance_refresh', 'all');
  return coalesce(new, old);
end; $$;