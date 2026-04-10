-- ============================================================
-- Migration 015 — Downloads log + storage bucket + rate limit
-- ============================================================

-- ── 1. Private storage bucket ─────────────────────────────────
-- Stores the actual PDF files. PRIVATE — no public access.
-- Service role generates short-lived signed URLs on demand.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produtos-pdf',
  'produtos-pdf',
  false,                          -- PRIVATE — no direct public access
  52428800,                       -- 50 MB max per file
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Deny all direct client access — only service role (backend) may read/write.
-- (No storage policies = only service role can access via supabaseAdmin)

-- ── 2. Rate-limit counter on pedidos ─────────────────────────
-- Tracks how many times a download token has been used.

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;

-- ── 3. Downloads log ──────────────────────────────────────────
-- Immutable audit trail of every download attempt.

CREATE TABLE IF NOT EXISTS public.downloads_log (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id     uuid    REFERENCES public.pedidos(id)  ON DELETE SET NULL,
  produto_id    uuid    REFERENCES public.produtos(id) ON DELETE SET NULL,
  usuario_email text    NOT NULL DEFAULT '',
  ip_address    text,
  user_agent    text,
  sucesso       boolean NOT NULL DEFAULT true,
  motivo_falha  text,                           -- set when sucesso = false
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS downloads_log_pedido_idx  ON public.downloads_log (pedido_id);
CREATE INDEX IF NOT EXISTS downloads_log_produto_idx ON public.downloads_log (produto_id);
CREATE INDEX IF NOT EXISTS downloads_log_email_idx   ON public.downloads_log (usuario_email);
CREATE INDEX IF NOT EXISTS downloads_log_created_idx ON public.downloads_log (criado_em DESC);

-- Service role only
ALTER TABLE public.downloads_log ENABLE ROW LEVEL SECURITY;
-- (no policies = only service role can access)
