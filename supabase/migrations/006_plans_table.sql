-- ============================================================
-- 006 — Plans table
-- Fonte de verdade de preços. O backend lê desta tabela.
-- ============================================================

create table public.plans (
  id                   text        primary key,        -- 'free' | 'pro' | 'enterprise'
  name                 text        not null,
  description          text        not null default '',

  -- ── Preços base em EUR (fonte de verdade) ─────────────────
  -- Armazenados como decimal para evitar arredondamento de cents.
  -- Valor 0 = gratuito.
  preco_mensal_eur     decimal(10, 2) not null default 0.00,
  preco_anual_eur      decimal(10, 2) not null default 0.00,
  -- Desconto anual calculado: 1 - (preco_anual_eur / (preco_mensal_eur * 12))
  -- Coluna gerada para facilitar exibição no frontend.
  desconto_anual_pct   decimal(5, 2)
    generated always as (
      case
        when preco_mensal_eur = 0 then 0
        else round(
          (1 - (preco_anual_eur / (preco_mensal_eur * 12))) * 100,
          2
        )
      end
    ) stored,

  -- ── Stripe Price IDs (um por intervalo × moeda) ───────────
  stripe_price_mensal_eur   text,
  stripe_price_mensal_usd   text,
  stripe_price_mensal_brl   text,
  stripe_price_anual_eur    text,
  stripe_price_anual_usd    text,
  stripe_price_anual_brl    text,

  -- ── Features (array de strings para o UI) ─────────────────
  features             text[]      not null default '{}',

  -- ── Controle ──────────────────────────────────────────────
  ativo                boolean     not null default true,
  ordem                smallint    not null default 0,   -- ordem de exibição
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Restrições
  constraint plans_preco_mensal_eur_nonneg check (preco_mensal_eur >= 0),
  constraint plans_preco_anual_eur_nonneg  check (preco_anual_eur  >= 0)
);

-- ─── Dados iniciais ───────────────────────────────────────────
insert into public.plans
  (id, name, description, preco_mensal_eur, preco_anual_eur, features, ordem,
   stripe_price_mensal_eur, stripe_price_mensal_usd, stripe_price_mensal_brl,
   stripe_price_anual_eur,  stripe_price_anual_usd,  stripe_price_anual_brl)
values
  (
    'free', 'Gratuito',
    'Para conhecer a plataforma.',
    0.00, 0.00,
    array['Até 5 pacientes', '1 usuário', '1 GB de armazenamento', 'Suporte por e-mail'],
    0, null, null, null, null, null, null
  ),
  (
    'pro', 'Pro',
    'Para profissionais com consultório ativo.',
    19.00, 190.00,   -- anual = ~2 meses grátis (desconto 16,67 %)
    array[
      'Pacientes ilimitados',
      'Agendamento avançado + lembretes',
      'Loja de PDFs habilitada',
      '50 GB de armazenamento',
      'Relatórios e insights',
      'Suporte prioritário'
    ],
    1,
    'price_pro_monthly_eur', 'price_pro_monthly_usd', 'price_pro_monthly_brl',
    'price_pro_annual_eur',  'price_pro_annual_usd',  'price_pro_annual_brl'
  ),
  (
    'enterprise', 'Clínica',
    'Para clínicas e equipes multiprofissionais.',
    99.00, 990.00,   -- anual = ~2 meses grátis (desconto 16,67 %)
    array[
      'Múltiplos terapeutas',
      'Tudo do plano Pro',
      '500 GB de armazenamento',
      'SSO e controle de acesso',
      'SLA garantido',
      'Onboarding dedicado'
    ],
    2,
    'price_ent_monthly_eur', 'price_ent_monthly_usd', 'price_ent_monthly_brl',
    'price_ent_annual_eur',  'price_ent_annual_usd',  'price_ent_annual_brl'
  );

-- ─── RLS ──────────────────────────────────────────────────────
alter table public.plans enable row level security;

-- Qualquer usuário autenticado (ou anônimo) pode ler planos ativos
create policy "Anyone can read active plans"
  on public.plans for select
  using (ativo = true);

-- ─── Trigger updated_at ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();
