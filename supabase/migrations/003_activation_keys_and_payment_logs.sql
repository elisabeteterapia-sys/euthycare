-- ============================================================
-- 003 — Activation Keys + Payment Logs
-- ============================================================

-- ─── Activation Keys ─────────────────────────────────────────
create table public.activation_keys (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  user_id      uuid not null references auth.users(id) on delete cascade,
  plan         text not null,
  created_at   timestamptz not null default now(),
  activated_at timestamptz,
  expires_at   timestamptz,
  revoked      boolean not null default false,
  metadata     jsonb not null default '{}'
);

-- Indexes
create index activation_keys_user_id_idx   on public.activation_keys (user_id);
create index activation_keys_key_idx       on public.activation_keys (key);
create index activation_keys_active_idx    on public.activation_keys (user_id, plan)
  where revoked = false;

-- RLS
alter table public.activation_keys enable row level security;

-- Users can only read their own keys (never write directly — backend controls this)
create policy "Users read own activation keys"
  on public.activation_keys for select
  using (auth.uid() = user_id);

-- ─── Payment Logs ─────────────────────────────────────────────
create table public.payment_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  provider     text not null,
  event_type   text not null,
  amount_cents integer,
  currency     text,
  status       text not null,
  provider_ref text,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

-- Indexes
create index payment_logs_user_id_idx    on public.payment_logs (user_id);
create index payment_logs_provider_ref   on public.payment_logs (provider_ref);
create index payment_logs_created_at_idx on public.payment_logs (created_at desc);

-- RLS
alter table public.payment_logs enable row level security;

create policy "Users read own payment logs"
  on public.payment_logs for select
  using (auth.uid() = user_id);

-- ─── View: active subscription status ────────────────────────
-- Convenience view joining profiles + latest activation key
create or replace view public.subscription_status as
select
  p.id              as user_id,
  p.email,
  p.plan,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  ak.key            as activation_key,
  ak.activated_at   as key_activated_at,
  ak.expires_at     as key_expires_at,
  ak.created_at     as key_created_at
from public.profiles p
left join lateral (
  select * from public.activation_keys
  where user_id = p.id and revoked = false
  order by created_at desc
  limit 1
) ak on true;
