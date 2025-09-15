-- Inserir dados iniciais da programação do CIVENI

-- Inserir os dias
insert into civeni_program_days (date, weekday_label, headline, theme, sort_order, is_published)
values
  ('2025-12-11', 'Quinta-feira', 'Abertura e Conferência', 'Horizontes Globais para a Educação e Justiça Social', 1, true),
  ('2025-12-12', 'Sexta-feira',  'Sessões Temáticas e Painéis', 'Saberes Interdisciplinares e Práticas Transformadoras', 2, true),
  ('2025-12-13', 'Sábado',        'Diálogos, Mostra e Encerramento', 'Pesquisa, Cooperação e Impacto Social', 3, true)
on conflict (date) do update set
  weekday_label = excluded.weekday_label,
  headline = excluded.headline,
  theme = excluded.theme,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published;

-- Configurações da página
insert into civeni_program_settings (id, page_title, page_subtitle, show_add_to_calendar, show_download_pdf, last_published_at)
values (1, 'Programação Presencial', 'III CIVENI 2025 - Saberes em Conexão: Inovação, Justiça e Humanidade na Sociedade Contemporânea', true, true, now())
on conflict (id) do update set
  page_title = excluded.page_title,
  page_subtitle = excluded.page_subtitle,
  show_add_to_calendar = excluded.show_add_to_calendar,
  show_download_pdf = excluded.show_download_pdf,
  last_published_at = excluded.last_published_at;