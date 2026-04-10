-- ============================================================
-- Migration 009 — chaves_ativacao
-- New activation key system supporting 6 key types,
-- per-key therapist limits, custom resources JSON,
-- and future enterprise/partner key flows.
-- ============================================================

-- ── 1. Enum: key types ────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE chave_tipo AS ENUM (
    'trial_30_dias',      -- 30-day trial, auto-expires
    'pos_pagamento',      -- issued after successful Stripe checkout
    'parceiro_futuro',    -- affiliate/partner key, unclaimed
    'upgrade_plano',      -- upgrades an existing active plan
    'clinica_especial',   -- unlocks clinic plan above default limit
    'enterprise'          -- full enterprise unlock, via commercial key
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chaves_ativacao (
  -- Identity
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                    text UNIQUE NOT NULL,                  -- ETHY-{PREFIX}-XXXX-XXXX-XXXX

  -- Key classification
  tipo                      chave_tipo NOT NULL,
  plano_id                  text REFERENCES public.plans(id),      -- which plan this key grants

  -- Overrides (can extend default plan limits)
  limite_terapeutas_custom  integer,                              -- overrides plan.limite_terapeutas
  recursos_custom_json      jsonb NOT NULL DEFAULT '{}',          -- freeform feature overrides

  -- Validity
  validade_dias             integer,                              -- null = no expiry
  expirado_em               timestamptz GENERATED ALWAYS AS (
    CASE WHEN validade_dias IS NOT NULL
      THEN criado_em + (validade_dias || ' days')::interval
      ELSE NULL
    END
  ) STORED,

  -- Usage (single-use enforcement)
  usado                     boolean NOT NULL DEFAULT false,
  usado_por_clinica_id      uuid REFERENCES auth.users(id),       -- user who redeemed
  usado_em                  timestamptz,

  -- Revocation
  revogado                  boolean NOT NULL DEFAULT false,
  revogado_em               timestamptz,
  revogado_motivo           text,

  -- Audit
  criado_por                text NOT NULL DEFAULT 'system',
  criado_em                 timestamptz NOT NULL DEFAULT now(),
  atualizado_em             timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chk_usage_consistency CHECK (
    (usado = false AND usado_por_clinica_id IS NULL AND usado_em IS NULL) OR
    (usado = true  AND usado_por_clinica_id IS NOT NULL AND usado_em IS NOT NULL)
  ),
  CONSTRAINT chk_revoke_consistency CHECK (
    (revogado = false AND revogado_em IS NULL) OR
    (revogado = true  AND revogado_em IS NOT NULL)
  )
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_chaves_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END $$;

CREATE TRIGGER chaves_ativacao_updated_at
  BEFORE UPDATE ON public.chaves_ativacao
  FOR EACH ROW EXECUTE FUNCTION update_chaves_timestamp();

-- ── 3. Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS chaves_codigo_idx        ON public.chaves_ativacao (codigo);
CREATE INDEX IF NOT EXISTS chaves_tipo_idx          ON public.chaves_ativacao (tipo);
CREATE INDEX IF NOT EXISTS chaves_plano_idx         ON public.chaves_ativacao (plano_id);
CREATE INDEX IF NOT EXISTS chaves_usado_por_idx     ON public.chaves_ativacao (usado_por_clinica_id);
CREATE INDEX IF NOT EXISTS chaves_ativo_idx         ON public.chaves_ativacao (usado, revogado);

-- ── 4. Helper function: is_chave_valida ───────────────────────

CREATE OR REPLACE FUNCTION public.is_chave_valida(p_codigo text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chaves_ativacao
    WHERE codigo = upper(trim(p_codigo))
      AND usado   = false
      AND revogado = false
      AND (expirado_em IS NULL OR expirado_em > now())
  );
$$;

-- ── 5. View: chaves com status legível ────────────────────────

CREATE OR REPLACE VIEW public.chaves_status AS
SELECT
  id,
  codigo,
  tipo,
  plano_id,
  limite_terapeutas_custom,
  recursos_custom_json,
  validade_dias,
  expirado_em,
  usado,
  usado_por_clinica_id,
  usado_em,
  revogado,
  criado_por,
  criado_em,
  CASE
    WHEN revogado      THEN 'revogada'
    WHEN usado         THEN 'utilizada'
    WHEN expirado_em IS NOT NULL AND expirado_em < now() THEN 'expirada'
    ELSE 'ativa'
  END AS estado
FROM public.chaves_ativacao;

-- ── 6. RLS: only service role can read/write ──────────────────
-- Public users cannot read keys directly (admin API only)

ALTER TABLE public.chaves_ativacao ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own used key
CREATE POLICY "chaves_own_read" ON public.chaves_ativacao
  FOR SELECT USING (usado_por_clinica_id = auth.uid());
