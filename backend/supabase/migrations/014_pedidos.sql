-- ============================================================
-- Migration 014 — Pedidos (orders for digital products)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedidos (
  id                    uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_email         text  NOT NULL,
  produto_id            uuid  REFERENCES public.produtos(id) ON DELETE SET NULL,
  status                text  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id     text  UNIQUE,
  stripe_payment_intent text,
  download_token        uuid  NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  criado_em             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pedidos_email_idx   ON public.pedidos (usuario_email);
CREATE INDEX IF NOT EXISTS pedidos_session_idx ON public.pedidos (stripe_session_id);
CREATE INDEX IF NOT EXISTS pedidos_token_idx   ON public.pedidos (download_token);
CREATE INDEX IF NOT EXISTS pedidos_status_idx  ON public.pedidos (status);

-- Service role only — downloads are served via backend token validation
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
-- (no policies = only service role can access)
