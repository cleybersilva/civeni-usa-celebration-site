-- Tipos ENUM para o CIVENI
create type civeni_session_type as enum (
  'credenciamento', 'abertura', 'conferencia', 'palestra', 'painel', 'mesa_redonda',
  'workshop', 'sessoes_simultaneas', 'intervalo', 'encerramento', 'cerimonia', 'outro'
);

create type civeni_modality as enum ('presencial', 'online', 'hibrido');

-- Dias da programação
create table if not exists civeni_program_days (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null default 'iii-civeni-2025',
  date date not null,
  weekday_label text not null,
  headline text not null,
  theme text not null,
  location text default 'Fortaleza/CE',
  modality civeni_modality default 'hibrido',
  sort_order int not null default 0,
  is_published boolean not null default false,
  slug text unique,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessões dentro de cada dia
create table if not exists civeni_program_sessions (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references civeni_program_days(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  session_type civeni_session_type not null,
  title text not null,
  description text,
  room text,
  modality civeni_modality default 'hibrido',
  is_parallel boolean default false,
  is_featured boolean default false,
  livestream_url text,
  materials_url text,
  order_in_day int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Palestrantes
create table if not exists civeni_speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  affiliation text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Relação N:N sessão ↔ palestrantes
create table if not exists civeni_session_speakers (
  session_id uuid references civeni_program_sessions(id) on delete cascade,
  speaker_id uuid references civeni_speakers(id) on delete cascade,
  role text,
  primary key (session_id, speaker_id)
);

-- Configurações da página de programação
create table if not exists civeni_program_settings (
  id int primary key default 1,
  page_title text default 'Programação Presencial',
  page_subtitle text,
  show_add_to_calendar boolean default true,
  show_download_pdf boolean default true,
  last_published_at timestamptz
);

-- Índices
create index on civeni_program_days (date);
create index on civeni_program_sessions (day_id, start_at);

-- Triggers para updated_at
create or replace function civeni_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

create trigger trg_days_touch before update on civeni_program_days
for each row execute function civeni_touch_updated_at();

create trigger trg_sessions_touch before update on civeni_program_sessions
for each row execute function civeni_touch_updated_at();

-- RLS
alter table civeni_program_days enable row level security;
alter table civeni_program_sessions enable row level security;
alter table civeni_speakers enable row level security;
alter table civeni_session_speakers enable row level security;
alter table civeni_program_settings enable row level security;

-- Políticas públicas (site) só vê publicadas
create policy site_read_days on civeni_program_days
for select using (is_published = true);

create policy site_read_sessions on civeni_program_sessions
for select using (is_published = true);

create policy site_read_speakers on civeni_speakers
for select using (true);

create policy site_read_session_speakers on civeni_session_speakers
for select using (true);

create policy site_read_settings on civeni_program_settings
for select using (true);

-- Políticas de admin
create policy admin_all_days on civeni_program_days
for all using (is_current_user_admin()) with check (is_current_user_admin());

create policy admin_all_sessions on civeni_program_sessions
for all using (is_current_user_admin()) with check (is_current_user_admin());

create policy admin_all_speakers on civeni_speakers
for all using (is_current_user_admin()) with check (is_current_user_admin());

create policy admin_all_session_speakers on civeni_session_speakers
for all using (is_current_user_admin()) with check (is_current_user_admin());

create policy admin_all_settings on civeni_program_settings
for all using (is_current_user_admin()) with check (is_current_user_admin());