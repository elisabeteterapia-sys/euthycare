-- ============================================================
-- 022 — Stripe Connect: conta da terapeuta e estado de onboarding
-- ============================================================

alter table public.terapeutas
  add column if not exists stripe_account_id    text,
  add column if not exists stripe_onboarded     boolean not null default false;
