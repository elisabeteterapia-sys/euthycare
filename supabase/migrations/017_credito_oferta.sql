-- ============================================================
-- 017 — Créditos de oferta (sessões gratuitas manuais)
-- Permite criar créditos sem pacote associado (ofertas manuais)
-- ============================================================

-- Tornar pacote_id opcional (ofertas manuais não têm pacote)
alter table public.creditos_cliente
  alter column pacote_id drop not null;

-- Coluna para distinguir tipo de crédito
alter table public.creditos_cliente
  add column if not exists tipo_origem text not null default 'compra'
    check (tipo_origem in ('compra', 'oferta'));
