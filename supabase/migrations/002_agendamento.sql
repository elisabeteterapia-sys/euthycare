-- ============================================================
-- 002 — Sistema de Agendamento
-- ============================================================

-- Disponibilidade semanal (um registo por dia_semana)
create table public.disponibilidades (
  dia_semana    smallint     not null unique check (dia_semana between 0 and 6),
  hora_inicio   time         not null default '09:00',
  hora_fim      time         not null default '18:00',
  intervalo_min smallint     not null default 60 check (intervalo_min > 0),
  ativo         boolean      not null default true,
  atualizado_em timestamptz  not null default now()
);

-- Seed: Segunda a Sexta, 09h-18h, intervalos de 60 min
insert into public.disponibilidades (dia_semana, hora_inicio, hora_fim, intervalo_min, ativo) values
  (0, '09:00', '18:00', 60, false),  -- Domingo
  (1, '09:00', '18:00', 60, true),   -- Segunda
  (2, '09:00', '18:00', 60, true),   -- Terça
  (3, '09:00', '18:00', 60, true),   -- Quarta
  (4, '09:00', '18:00', 60, true),   -- Quinta
  (5, '09:00', '18:00', 60, true),   -- Sexta
  (6, '09:00', '13:00', 60, false)   -- Sábado
on conflict (dia_semana) do nothing;

-- Bloqueios de agenda (dias completos)
create table public.bloqueios_agenda (
  id         uuid        primary key default gen_random_uuid(),
  data       date        not null,
  motivo     text,
  criado_em  timestamptz not null default now()
);

create unique index bloqueios_agenda_data_idx on public.bloqueios_agenda(data);

-- Agendamentos
create table public.agendamentos (
  id             uuid        primary key default gen_random_uuid(),
  nome_cliente   text        not null,
  email_cliente  text        not null,
  telefone       text,
  mensagem       text,
  data           date        not null,
  hora           time        not null,
  servico        text        not null default 'individual',
  modalidade     text        not null default 'online',
  status         text        not null default 'pendente'
                             check (status in ('pendente', 'confirmado', 'cancelado', 'remarcado')),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- Impedir horários duplicados (exceto cancelados)
create unique index agendamentos_data_hora_ativo_idx
  on public.agendamentos (data, hora)
  where status <> 'cancelado';

-- Índices úteis
create index agendamentos_data_idx   on public.agendamentos (data);
create index agendamentos_email_idx  on public.agendamentos (email_cliente);
create index agendamentos_status_idx on public.agendamentos (status);

-- ── RLS (admin acede via service_role, sem RLS) ───────────────
-- Não habilitamos RLS nestas tabelas pois todos os acessos
-- passam pelo backend (service_role key). Se quiser RLS,
-- adicione políticas adequadas aqui.
