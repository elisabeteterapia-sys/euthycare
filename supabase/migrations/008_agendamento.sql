-- ============================================================
-- 008 — Sistema de Agendamento
-- Tabelas: disponibilidades, bloqueios_agenda, agendamentos
-- ============================================================

-- ─── Enum: status do agendamento ─────────────────────────────
create type public.agendamento_status as enum ('pendente', 'confirmado', 'cancelado', 'remarcado');

-- ─── Tabela: disponibilidades (horários semanais recorrentes) ─
create table public.disponibilidades (
  id           uuid     primary key default gen_random_uuid(),
  terapeuta_id uuid     not null,
  dia_semana   smallint not null check (dia_semana between 0 and 6),
    -- 0 = Domingo … 6 = Sábado
  hora_inicio  time     not null,
  hora_fim     time     not null,
  ativo        boolean  not null default true,

  constraint disponibilidades_horario_valido check (hora_fim > hora_inicio)
);

-- ─── Tabela: bloqueios_agenda ─────────────────────────────────
create table public.bloqueios_agenda (
  id          uuid  primary key default gen_random_uuid(),
  data        date  not null,
  hora_inicio time,           -- null = dia inteiro bloqueado
  hora_fim    time,
  motivo      text,

  constraint bloqueios_horario_valido check (
    (hora_inicio is null and hora_fim is null)
    or (hora_inicio is not null and hora_fim is not null and hora_fim > hora_inicio)
  )
);

-- ─── Tabela: agendamentos ─────────────────────────────────────
create table public.agendamentos (
  id             uuid                      primary key default gen_random_uuid(),
  nome_cliente   text                      not null,
  email_cliente  text                      not null,
  data           date                      not null,
  hora           time                      not null,
  status         public.agendamento_status not null default 'pendente',
  valor          decimal(10, 2),
  pago           boolean                   not null default false,
  criado_em      timestamptz               not null default now(),

  -- Prevenir duplo agendamento no nível do banco
  constraint agendamentos_sem_conflito unique (data, hora)
);

-- ─── Índices ──────────────────────────────────────────────────
create index disponibilidades_dia_idx
  on public.disponibilidades (dia_semana)
  where ativo = true;

create index agendamentos_data_idx
  on public.agendamentos (data);

create index agendamentos_status_idx
  on public.agendamentos (status);

-- ─── RLS ──────────────────────────────────────────────────────
alter table public.disponibilidades enable row level security;
alter table public.bloqueios_agenda  enable row level security;
alter table public.agendamentos      enable row level security;

-- Leitura pública: disponibilidades e bloqueios (para montar o calendário)
create policy "leitura_publica_disponibilidades"
  on public.disponibilidades for select using (true);

create policy "leitura_publica_bloqueios"
  on public.bloqueios_agenda for select using (true);

-- Leitura pública de agendamentos: apenas data + hora (para bloquear slots)
create policy "leitura_publica_agendamentos"
  on public.agendamentos for select using (true);

-- Inserção pública: qualquer pessoa pode criar um agendamento
create policy "insercao_publica_agendamentos"
  on public.agendamentos for insert with check (true);

-- Escrita nas demais tabelas: somente service role (backend via supabaseAdmin)
