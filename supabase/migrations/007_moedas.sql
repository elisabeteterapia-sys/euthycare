-- ============================================================
-- 007 — Tabela moedas
-- Fonte de verdade das taxas de conversão (base: EUR = 1.0).
-- Atualizada pelo backend via cron ou manualmente pelo admin.
-- ============================================================

-- ─── Enum ─────────────────────────────────────────────────────
create type public.moeda_codigo as enum ('EUR', 'USD', 'BRL');

-- ─── Tabela ───────────────────────────────────────────────────
create table public.moedas (
  codigo           public.moeda_codigo primary key,
  simbolo          text           not null,
  nome             text           not null,
  taxa_conversao   decimal(18, 6) not null,
    -- Taxa em relação ao EUR (base). EUR = 1.000000 (fixo).
    -- Exemplo: USD = 1.080000 → 1 EUR = 1.08 USD
  atualizado_em    timestamptz    not null default now(),

  constraint moedas_taxa_positiva check (taxa_conversao > 0)
);

-- ─── Dados iniciais ───────────────────────────────────────────
insert into public.moedas (codigo, simbolo, nome, taxa_conversao) values
  ('EUR', '€',  'Euro',             1.000000),
  ('USD', '$',  'Dólar Americano',  1.080000),   -- placeholder; atualizado pelo cron
  ('BRL', 'R$', 'Real Brasileiro',  5.420000);   -- placeholder; atualizado pelo cron

-- ─── Trigger: atualiza atualizado_em automaticamente ──────────
create or replace function public.moedas_set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger moedas_atualizado_em
  before update on public.moedas
  for each row
  when (old.taxa_conversao is distinct from new.taxa_conversao)
  execute function public.moedas_set_atualizado_em();

-- ─── RLS ──────────────────────────────────────────────────────
alter table public.moedas enable row level security;

-- Leitura pública (necessário para exibição de preços no frontend)
create policy "Leitura pública de moedas"
  on public.moedas for select
  using (true);

-- Somente o service role (backend) pode escrever
-- (nenhuma policy de insert/update para roles autenticados = bloqueado por padrão)

-- ─── View auxiliar: moedas com stale flag ─────────────────────
-- "stale" = taxa não atualizada há mais de 2 horas
create or replace view public.moedas_status as
  select
    codigo,
    simbolo,
    nome,
    taxa_conversao,
    atualizado_em,
    (now() - atualizado_em) > interval '2 hours' as stale
  from public.moedas
  order by codigo;
