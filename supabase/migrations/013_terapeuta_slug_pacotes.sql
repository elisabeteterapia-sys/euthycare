-- ============================================================
-- 013 — Slug da terapeuta + terapeuta_id nos pacotes/créditos
-- ============================================================

-- ─── slug em terapeutas ───────────────────────────────────────
alter table public.terapeutas
  add column if not exists slug text unique;

-- ─── terapeuta_id em pacotes (null = pacotes globais) ─────────
alter table public.pacotes
  add column if not exists terapeuta_id uuid
    references public.terapeutas(id) on delete cascade;

-- ─── terapeuta_id em creditos_cliente ─────────────────────────
alter table public.creditos_cliente
  add column if not exists terapeuta_id uuid
    references public.terapeutas(id) on delete set null;

-- ─── Índices ─────────────────────────────────────────────────
create index if not exists terapeutas_slug_idx
  on public.terapeutas (slug);

create index if not exists pacotes_terapeuta_idx
  on public.pacotes (terapeuta_id);

create index if not exists creditos_terapeuta_idx
  on public.creditos_cliente (terapeuta_id);
