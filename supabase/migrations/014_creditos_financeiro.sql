-- ============================================================
-- 014 — Campos financeiros em creditos_cliente
-- ============================================================

alter table public.creditos_cliente
  add column if not exists valor_pago_cents  integer,
  add column if not exists comissao_cents    integer,
  add column if not exists repasse_cents     integer,
  add column if not exists repasse_pago      boolean not null default false;

create index if not exists creditos_repasse_idx
  on public.creditos_cliente (terapeuta_id, repasse_pago);
