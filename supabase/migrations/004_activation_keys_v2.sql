-- ============================================================
-- 004 — Activation Keys v2
-- Replaces the table from migration 003 with a full-featured schema.
-- Run after 003.
-- ============================================================

-- Drop old table (safe: cascade removes old policies/indexes too)
drop table if exists public.activation_keys cascade;

-- ─── Key Types ───────────────────────────────────────────────
-- payment  : gerada automaticamente após pagamento confirmado
-- trial    : 30 dias gratuitos, uso único, sem pagamento
-- affiliate: gerada por afiliado para distribuição futura

create type public.activation_key_type as enum ('payment', 'trial', 'affiliate');

-- ─── Activation Keys ─────────────────────────────────────────
create table public.activation_keys (

  -- Identity
  id              uuid        primary key default gen_random_uuid(),
  key             text        not null unique,
  key_type        public.activation_key_type not null,
  plan            text        not null,

  -- Ownership (nullable: trial/affiliate keys exist before a user claims them)
  owner_user_id   uuid        references auth.users(id) on delete set null,

  -- Issuance (who generated this key)
  issued_by       text        not null default 'system',
                              -- 'system' | 'admin' | affiliate_code
  affiliate_code  text,       -- populated only for key_type = 'affiliate'

  -- Validity window
  created_at      timestamptz not null default now(),
  expires_at      timestamptz,          -- null = never expires

  -- ── Single-use enforcement ──────────────────────────────────
  -- A key is "used" the moment it activates a plan.
  -- used_at being non-null blocks any further activation attempt.
  used_at         timestamptz,
  used_by_user_id uuid        references auth.users(id) on delete set null,

  -- ── Revocation ──────────────────────────────────────────────
  revoked         boolean     not null default false,
  revoked_at      timestamptz,
  revoked_reason  text,

  -- ── Extra data ──────────────────────────────────────────────
  metadata        jsonb       not null default '{}'

);

-- ─── Constraints ─────────────────────────────────────────────
alter table public.activation_keys
  add constraint activation_keys_plan_check
    check (plan in ('pro', 'enterprise')),

  add constraint activation_keys_affiliate_requires_code
    check (key_type <> 'affiliate' or affiliate_code is not null),

  add constraint activation_keys_used_consistency
    check (
      (used_at is null and used_by_user_id is null) or
      (used_at is not null and used_by_user_id is not null)
    ),

  add constraint activation_keys_revoked_consistency
    check (
      revoked = false or revoked_at is not null
    );

-- ─── Indexes ─────────────────────────────────────────────────
create unique index activation_keys_key_unique_idx
  on public.activation_keys (key);

create index activation_keys_owner_idx
  on public.activation_keys (owner_user_id)
  where owner_user_id is not null;

create index activation_keys_used_by_idx
  on public.activation_keys (used_by_user_id)
  where used_by_user_id is not null;

create index activation_keys_type_idx
  on public.activation_keys (key_type);

create index activation_keys_unused_idx
  on public.activation_keys (key_type, plan)
  where used_at is null and revoked = false;

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.activation_keys enable row level security;

-- Users see their own keys (owner or user who activated it)
create policy "Users read own activation keys"
  on public.activation_keys for select
  using (
    auth.uid() = owner_user_id or
    auth.uid() = used_by_user_id
  );

-- ─── Utility function: check if a key is currently valid ─────
create or replace function public.is_key_valid(p_key text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.activation_keys
    where key = p_key
      and used_at is null
      and revoked = false
      and (expires_at is null or expires_at > now())
  );
$$;

-- ─── Expiry cron helper (run daily via pg_cron or edge function) ──
-- This view lists all expired-but-not-revoked keys for cleanup jobs
create or replace view public.expired_activation_keys as
  select id, key, key_type, plan, owner_user_id, expires_at
  from public.activation_keys
  where expires_at < now()
    and used_at is null
    and revoked = false;
