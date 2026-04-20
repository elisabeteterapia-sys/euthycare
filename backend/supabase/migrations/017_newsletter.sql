-- Migration: newsletter subscribers
create table if not exists newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  nome       text,
  origem     text not null default 'site',
  confirmado boolean not null default false,
  criado_em  timestamptz not null default now()
);

-- Only the service role (backend) can read/insert
alter table newsletter_subscribers enable row level security;

create policy "service role full access"
  on newsletter_subscribers
  using (true)
  with check (true);
