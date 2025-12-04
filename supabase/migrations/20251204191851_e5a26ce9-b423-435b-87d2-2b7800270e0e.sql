-- Tabela de vídeos da transmissão ao vivo
CREATE TABLE public.live_stream_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NULL,
  youtube_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.live_stream_videos ENABLE ROW LEVEL SECURITY;

-- Política: admins podem tudo
CREATE POLICY live_stream_videos_admin_all
ON public.live_stream_videos
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Política: público só lê vídeos publicados
CREATE POLICY live_stream_videos_public_read_published
ON public.live_stream_videos
FOR SELECT
USING (is_published = true);

-- Índice para ordenação eficiente
CREATE INDEX live_stream_videos_order_idx
ON public.live_stream_videos (is_published, order_index, created_at DESC);
