-- ============================================================
-- 019 — Colunas de controlo de lembretes nos agendamentos
-- ============================================================

alter table public.agendamentos
  add column if not exists lembrete_24h boolean not null default false,
  add column if not exists lembrete_30m boolean not null default false;

comment on column public.agendamentos.lembrete_24h is 'Email de lembrete 24h antes já enviado';
comment on column public.agendamentos.lembrete_30m is 'Email de lembrete 30min antes já enviado';
