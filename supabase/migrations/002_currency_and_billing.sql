-- ============================================================
-- 002 — Currency preference + Stripe billing fields
-- ============================================================

alter table public.profiles
  add column if not exists currency_preference text not null default 'EUR'
    check (currency_preference in ('EUR', 'USD', 'BRL')),
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text;

-- Index for webhook lookups by subscription ID
create index if not exists profiles_stripe_subscription_id_idx
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ============================================================
-- To add a new currency in the future, run:
--   ALTER TABLE public.profiles
--     DROP CONSTRAINT profiles_currency_preference_check;
--   ALTER TABLE public.profiles
--     ADD CONSTRAINT profiles_currency_preference_check
--       CHECK (currency_preference in ('EUR', 'USD', 'BRL', 'GBP'));
-- ============================================================
