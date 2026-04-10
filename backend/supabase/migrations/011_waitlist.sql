-- ============================================================
-- Migration 011 — Waitlist
-- Stores early-access leads collected before public launch.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  email       text NOT NULL,
  source      text NOT NULL DEFAULT 'landing',   -- 'landing', 'app-euthy', etc.
  metadata    jsonb NOT NULL DEFAULT '{}',        -- user agent, referrer, etc.
  criado_em   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS waitlist_email_idx     ON public.waitlist (email);
CREATE INDEX IF NOT EXISTS waitlist_criado_em_idx ON public.waitlist (criado_em DESC);

-- Service role only — no public read/write
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
-- (no policies = only service role can access)
