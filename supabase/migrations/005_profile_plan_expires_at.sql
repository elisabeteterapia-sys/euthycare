-- ============================================================
-- 005 — Add plan_expires_at to profiles
-- Used for trial and affiliate keys (subscriptions have no expiry).
-- ============================================================

alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

-- Index for scheduled expiry jobs
create index if not exists profiles_plan_expires_at_idx
  on public.profiles (plan_expires_at)
  where plan_expires_at is not null;

-- ─── Scheduled expiry function ───────────────────────────────
-- Call this daily via pg_cron or a Supabase Edge Function cron.
-- Downgrades users whose trial/affiliate period ended.
create or replace function public.expire_trial_plans()
returns integer language plpgsql security definer as $$
declare
  affected integer;
begin
  update public.profiles
  set
    plan           = 'free',
    plan_expires_at = null,
    updated_at     = now()
  where
    plan_expires_at is not null
    and plan_expires_at < now()
    and plan <> 'free';

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Example pg_cron schedule (run once you enable the pg_cron extension):
-- select cron.schedule('expire-trial-plans', '0 3 * * *', 'select public.expire_trial_plans()');
