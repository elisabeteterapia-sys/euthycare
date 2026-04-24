-- ============================================================
-- 021 — Garantir coluna video_url na tabela agendamentos
--       (defensivo: a migration 010 já o faz, mas se foi saltada
--        em produção esta migration repara o esquema)
-- ============================================================

alter table public.agendamentos
  add column if not exists video_url text;
