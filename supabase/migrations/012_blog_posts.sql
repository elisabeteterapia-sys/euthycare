-- ============================================================
-- 012 — Tabela blog_posts
-- ============================================================

create table if not exists public.blog_posts (
  id            uuid        primary key default gen_random_uuid(),
  titulo        text        not null,
  slug          text        not null unique,
  categoria     text        not null default 'Geral',
  autor         text        not null default '',
  resumo        text        not null default '',
  conteudo      text        not null default '',
  tempo_leitura text        not null default '5 min',
  imagem_url    text,
  publicado     boolean     not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- RLS
alter table public.blog_posts enable row level security;

-- Leitura pública: apenas posts publicados
create policy "leitura_publica_blog"
  on public.blog_posts for select
  using (publicado = true);

-- Escrita: apenas service role (admin via backend)

create index if not exists blog_slug_idx      on public.blog_posts (slug);
create index if not exists blog_publicado_idx on public.blog_posts (publicado, criado_em desc);

NOTIFY pgrst, 'reload schema';
