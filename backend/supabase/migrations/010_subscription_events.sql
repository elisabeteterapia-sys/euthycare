-- ============================================================
-- Migration 010 — Subscription Events & Profile Billing Columns
-- Adds: subscription_events table, trial_ends_at,
--       subscription_status, limite_terapeutas_custom to profiles
-- ============================================================

-- ── 1. Subscription status enum ───────────────────────────────

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'inactive',    -- never subscribed
    'trialing',    -- in free trial
    'active',      -- paid and current
    'past_due',    -- payment failed, grace period
    'cancelled'    -- cancelled, may still have access until period end
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Add columns to profiles ────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status    subscription_status NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS trial_ends_at          timestamptz,
  ADD COLUMN IF NOT EXISTS limite_terapeutas_custom integer;   -- overrides plan.limite_terapeutas via chave especial

-- Index for subscription lookups
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx ON public.profiles (subscription_status);
CREATE INDEX IF NOT EXISTS profiles_stripe_subscription_idx ON public.profiles (stripe_subscription_id);

-- ── 3. subscription_events table ──────────────────────────────
-- Immutable audit log of all subscription lifecycle events.

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type                text NOT NULL,           -- mirrors WebhookEventType
  plan_id                   text REFERENCES public.plans(id),
  previous_plan_id          text REFERENCES public.plans(id),
  provider                  text NOT NULL DEFAULT 'stripe',
  provider_subscription_id  text,
  amount_cents              integer,
  currency                  text,
  metadata                  jsonb NOT NULL DEFAULT '{}',
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS sub_events_user_idx     ON public.subscription_events (user_id);
CREATE INDEX IF NOT EXISTS sub_events_type_idx     ON public.subscription_events (event_type);
CREATE INDEX IF NOT EXISTS sub_events_provider_idx ON public.subscription_events (provider_subscription_id);
CREATE INDEX IF NOT EXISTS sub_events_created_idx  ON public.subscription_events (created_at DESC);

-- RLS: users can read their own events; admin (service role) writes
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_events_own_read" ON public.subscription_events
  FOR SELECT USING (user_id = auth.uid());

-- ── 4. Helper view: current subscription state ────────────────

CREATE OR REPLACE VIEW public.subscription_state AS
SELECT
  p.id                      AS user_id,
  p.plan,
  p.subscription_status,
  p.trial_ends_at,
  p.plan_expires_at,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.limite_terapeutas_custom,
  -- Is trial active?
  (p.subscription_status = 'trialing' AND p.trial_ends_at > now()) AS trial_active,
  -- Days remaining in trial
  GREATEST(0, EXTRACT(EPOCH FROM (p.trial_ends_at - now())) / 86400)::integer AS trial_days_left,
  -- Has access (active OR trialing OR cancelled-but-not-expired)
  (
    p.subscription_status IN ('active', 'trialing') OR
    (p.subscription_status = 'cancelled' AND p.plan_expires_at > now())
  ) AS has_access
FROM public.profiles p;

-- ── 5. Expire trials cron (if pg_cron is available) ──────────
-- Downgrade profiles whose trial has expired and have no active subscription.

DO $$ BEGIN
  PERFORM cron.schedule(
    'expire-trials',
    '0 * * * *',   -- every hour
    $$
      UPDATE public.profiles
      SET
        plan = 'essencial',
        subscription_status = 'inactive',
        trial_ends_at = NULL
      WHERE
        subscription_status = 'trialing'
        AND trial_ends_at < now()
        AND stripe_subscription_id IS NULL;
    $$
  );
EXCEPTION WHEN undefined_function THEN
  -- pg_cron not available — handle via application-level cron
  RAISE NOTICE 'pg_cron not available: expire-trials job skipped';
END $$;
