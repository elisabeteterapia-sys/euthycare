-- ============================================================
-- 010 — Tabela terapeutas + correcções ao schema de agendamento
-- ============================================================

-- ─── Tabela: terapeutas ───────────────────────────────────────
create table if not exists public.terapeutas (
  id                    uuid    primary key default gen_random_uuid(),
  nome                  text    not null,
  titulo                text    not null default '',
  bio                   text    not null default '',
  foto_url              text,
  especialidades        text    not null default '',
  preco_cents           integer not null default 2500,
  duracao_min           integer not null default 50,
  comissao_percentagem  integer not null default 20,
  ativo                 boolean not null default true,
  email                 text    unique,
  senha_hash            text,
  calendario_token      uuid    unique default gen_random_uuid(),
  criado_em             timestamptz not null default now()
);

-- ─── Correcções: disponibilidades ────────────────────────────
-- Adicionar intervalo_min se não existir
alter table public.disponibilidades
  add column if not exists intervalo_min integer not null default 60;

-- Adicionar FK para terapeutas
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'disponibilidades_terapeuta_fk'
      and table_name = 'disponibilidades'
  ) then
    alter table public.disponibilidades
      add constraint disponibilidades_terapeuta_fk
      foreign key (terapeuta_id) references public.terapeutas(id) on delete cascade;
  end if;
end $$;

-- ─── Correcções: bloqueios_agenda ────────────────────────────
alter table public.bloqueios_agenda
  add column if not exists terapeuta_id uuid references public.terapeutas(id) on delete cascade;

-- ─── Correcções: agendamentos ────────────────────────────────
alter table public.agendamentos
  add column if not exists terapeuta_id        uuid references public.terapeutas(id) on delete set null,
  add column if not exists notas               text,
  add column if not exists video_url           text,
  add column if not exists valor_cobrado_cents integer,
  add column if not exists repasse_cents       integer,
  add column if not exists comissao_cents      integer,
  add column if not exists repasse_pago        boolean not null default false;

-- Remover constraint de unicidade antiga (sem terapeuta_id) e recriar com terapeuta
alter table public.agendamentos
  drop constraint if exists agendamentos_sem_conflito;

alter table public.agendamentos
  add constraint agendamentos_sem_conflito unique (terapeuta_id, data, hora);

-- ─── RLS: terapeutas ─────────────────────────────────────────
alter table public.terapeutas enable row level security;

-- Leitura pública: apenas terapeutas activas (campos sem dados sensíveis)
create policy "leitura_publica_terapeutas"
  on public.terapeutas for select
  using (ativo = true);

-- Escrita: somente service role (backend via supabaseAdmin / restInsert)
-- (sem policy = service role bypassa RLS)

-- ─── Índices ─────────────────────────────────────────────────
create index if not exists terapeutas_ativo_idx
  on public.terapeutas (ativo) where ativo = true;

create index if not exists agendamentos_terapeuta_data_idx
  on public.agendamentos (terapeuta_id, data);
