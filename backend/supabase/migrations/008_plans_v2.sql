-- ============================================================
-- Migration 008 — Plans V2
-- Adds commercial plan fields (tipo, limites, IA, backup, etc.)
-- Seeds the 5 canonical plans for EuthyCare
-- ============================================================

-- ── 1. Enum types ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE plan_tipo AS ENUM ('terapeuta', 'clinica', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ia_nivel AS ENUM ('nenhuma', 'basica', 'completa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE backup_tipo AS ENUM ('nenhum', 'parcial', 'completo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Recreate plans table with full schema ───────────────────
-- Drop and rebuild cleanly (idempotent if run fresh)

DROP TABLE IF EXISTS public.plans CASCADE;

CREATE TABLE public.plans (
  -- Identity
  id                    text PRIMARY KEY,             -- 'essencial', 'profissional', 'premium', 'clinica', 'enterprise'
  nome                  text NOT NULL,
  descricao             text,

  -- Commercial segmentation
  tipo                  plan_tipo NOT NULL DEFAULT 'terapeuta',
  limite_terapeutas     integer NOT NULL DEFAULT 1,   -- NULL = ilimitado (enterprise via chave)
  contato_comercial     boolean NOT NULL DEFAULT false, -- true = no self-serve checkout

  -- Feature flags
  ia_nivel              ia_nivel NOT NULL DEFAULT 'nenhuma',
  tem_backup            boolean NOT NULL DEFAULT false,
  tipo_backup           backup_tipo NOT NULL DEFAULT 'nenhum',
  exportacao_total      boolean NOT NULL DEFAULT false,
  download_cliente      boolean NOT NULL DEFAULT true,  -- PDF por paciente, todos os planos

  -- Pricing (EUR)
  preco_mensal_eur      decimal(10,2) NOT NULL DEFAULT 0,
  preco_anual_eur       decimal(10,2) NOT NULL DEFAULT 0,
  desconto_anual_pct    decimal(5,2) GENERATED ALWAYS AS (
    CASE WHEN preco_mensal_eur > 0
      THEN ROUND(((preco_mensal_eur * 12 - preco_anual_eur) / (preco_mensal_eur * 12)) * 100, 2)
      ELSE 0
    END
  ) STORED,

  -- Features list (display only)
  features              text[] NOT NULL DEFAULT '{}',

  -- Stripe Price IDs (null = not configured)
  stripe_price_mensal_eur  text,
  stripe_price_mensal_usd  text,
  stripe_price_mensal_brl  text,
  stripe_price_anual_eur   text,
  stripe_price_anual_usd   text,
  stripe_price_anual_brl   text,

  -- Meta
  ativo                 boolean NOT NULL DEFAULT true,
  ordem                 integer NOT NULL DEFAULT 0,
  criado_em             timestamptz NOT NULL DEFAULT now(),
  atualizado_em         timestamptz NOT NULL DEFAULT now()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_plans_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END $$;

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_plans_timestamp();

-- RLS: public read, only service role writes
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true);

-- ── 3. Seed canonical plans ────────────────────────────────────

INSERT INTO public.plans (
  id, nome, descricao, tipo,
  limite_terapeutas, ia_nivel, tem_backup, tipo_backup,
  exportacao_total, download_cliente, contato_comercial,
  preco_mensal_eur, preco_anual_eur, features, ordem
) VALUES

-- Plano Essencial (terapeuta solo, sem IA)
(
  'essencial', 'Essencial', 'Para começar a organizar a sua prática.', 'terapeuta',
  1, 'nenhuma', false, 'nenhum',
  false, true, false,
  19.00, 190.00,
  ARRAY[
    '1 terapeuta',
    'Cadastro de pacientes',
    'Agenda e calendário',
    'Registo de sessões',
    'Cobrança de consultas',
    'Download por paciente',
    'Sem IA',
    'Sem backup automático'
  ],
  1
),

-- Plano Profissional (terapeuta solo, IA básica)
(
  'profissional', 'Profissional', 'Para a prática clínica completa.', 'terapeuta',
  1, 'basica', true, 'parcial',
  false, true, false,
  39.00, 390.00,
  ARRAY[
    '1 terapeuta',
    'Cadastro de pacientes',
    'Agenda e calendário',
    'Registo de sessões',
    'Cobrança de consultas',
    'Download por paciente',
    'IA básica (sugestões e resumos)',
    'Backup parcial mensal',
    'Exportação parcial de dados'
  ],
  2
),

-- Plano Premium (terapeuta solo, IA completa)
(
  'premium', 'Premium', 'Tudo o que a sua prática precisa, sem limites.', 'terapeuta',
  1, 'completa', true, 'completo',
  true, true, false,
  69.00, 690.00,
  ARRAY[
    '1 terapeuta',
    'Cadastro de pacientes',
    'Agenda e calendário',
    'Registo de sessões',
    'Cobrança de consultas',
    'Download por paciente',
    'IA completa (análise, relatórios, sugestões)',
    'Backup completo diário',
    'Exportação total de dados',
    'Relatórios avançados'
  ],
  3
),

-- Plano Clínica (até 10 terapeutas)
(
  'clinica', 'Clínica', 'Para equipas e clínicas até 10 terapeutas.', 'clinica',
  10, 'completa', true, 'completo',
  true, true, false,
  149.00, 1490.00,
  ARRAY[
    'Até 10 terapeutas',
    'Gestão de equipa',
    'Dashboard da clínica',
    'Permissões por terapeuta',
    'IA completa para todos',
    'Backup completo diário',
    'Exportação total',
    'Métricas clínicas',
    'Controlo financeiro centralizado'
  ],
  4
),

-- Plano Enterprise (sob consulta, activado por chave)
(
  'enterprise', 'Enterprise', 'Para grandes clínicas e redes. Contacte a equipa comercial.', 'enterprise',
  999, 'completa', true, 'completo',
  true, true, true,
  0.00, 0.00,
  ARRAY[
    'Terapeutas ilimitados (via chave comercial)',
    'Tudo do plano Clínica',
    'SLA garantido',
    'Onboarding dedicado',
    'Integrações personalizadas',
    'Suporte premium 24/7',
    'Relatórios sob medida'
  ],
  5
)

ON CONFLICT (id) DO UPDATE SET
  nome              = EXCLUDED.nome,
  descricao         = EXCLUDED.descricao,
  tipo              = EXCLUDED.tipo,
  limite_terapeutas = EXCLUDED.limite_terapeutas,
  ia_nivel          = EXCLUDED.ia_nivel,
  tem_backup        = EXCLUDED.tem_backup,
  tipo_backup       = EXCLUDED.tipo_backup,
  exportacao_total  = EXCLUDED.exportacao_total,
  download_cliente  = EXCLUDED.download_cliente,
  contato_comercial = EXCLUDED.contato_comercial,
  preco_mensal_eur  = EXCLUDED.preco_mensal_eur,
  preco_anual_eur   = EXCLUDED.preco_anual_eur,
  features          = EXCLUDED.features,
  ordem             = EXCLUDED.ordem;
