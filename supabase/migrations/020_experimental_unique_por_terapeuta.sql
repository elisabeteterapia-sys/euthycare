-- ============================================================
-- 020 — Unique constraint: experimental uma vez por terapeuta
--       (antes era uma vez por cliente no total — errado para clínica)
-- ============================================================

-- Remover índice antigo (1 experimental por cliente, global)
drop index if exists public.creditos_experimental_unique;

-- Novo índice: 1 experimental por (cliente, terapeuta)
-- NULL terapeuta_id conta como "sessão global" — não bloqueia as de terapeuta específica
create unique index creditos_experimental_por_terapeuta
  on public.creditos_cliente (cliente_email, terapeuta_id)
  where (
    select tipo from public.pacotes where id = pacote_id
  ) = 'experimental'
  and terapeuta_id is not null;
