-- ============================================================
-- 011 — Tabela waitlist (lista de espera)
-- ============================================================

create table if not exists public.waitlist (
  id           uuid        primary key default gen_random_uuid(),
  nome         text        not null,
  email        text        not null unique,
  tipo_usuario text        not null default 'terapeuta' check (tipo_usuario in ('terapeuta', 'clinica')),
  source       text        not null default 'landing',
  metadata     jsonb       not null default '{}',
  criado_em    timestamptz not null default now()
);

-- RLS: leitura e escrita apenas pelo service role (backend)
alter table public.waitlist enable row level security;

-- Inserção pública (qualquer pessoa pode entrar na lista)
create policy "insercao_publica_waitlist"
  on public.waitlist for insert
  with check (true);

-- Leitura apenas pelo service role (admin via backend)
-- (sem policy de SELECT = apenas service role acede)

create index if not exists waitlist_email_idx    on public.waitlist (email);
create index if not exists waitlist_criado_em_idx on public.waitlist (criado_em desc);
