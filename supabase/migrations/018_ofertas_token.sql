-- ============================================================
-- 018 — Links mágicos para ofertas de sessão gratuita
-- Admin gera token → cliente abre link → crédito criado automaticamente
-- ============================================================

CREATE TABLE public.ofertas_token (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token          text        UNIQUE NOT NULL,
  terapeuta_id   uuid        REFERENCES public.terapeutas(id) ON DELETE SET NULL,
  terapeuta_slug text,
  sessoes        smallint    NOT NULL DEFAULT 1,
  validade_dias  smallint    NOT NULL DEFAULT 30,
  usos_max       smallint,   -- null = sem limite
  usos_total     integer     NOT NULL DEFAULT 0,
  ativo          boolean     NOT NULL DEFAULT true,
  criado_em      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ofertas_token_idx ON public.ofertas_token (token) WHERE ativo = true;
