-- ============================================================
-- 003 — Sistema de Pacotes de Consultas + Consulta Experimental
-- ============================================================

-- Pacotes disponíveis para venda
create table public.pacotes (
  id              uuid          primary key default gen_random_uuid(),
  tipo            text          not null default 'pacote'
                                check (tipo in ('experimental', 'pacote')),
  nome            text          not null,
  numero_sessoes  smallint      not null check (numero_sessoes > 0),
  duracao_min     smallint      not null default 50,
  preco           numeric(10,2) not null,
  moeda           text          not null default 'EUR',
  validade_dias   smallint      not null check (validade_dias > 0),
  destaque        boolean       not null default false,
  descricao       text,
  ativo           boolean       not null default true,
  criado_em       timestamptz   not null default now()
);

-- Seed: consulta experimental + 3 pacotes
insert into public.pacotes (tipo, nome, numero_sessoes, duracao_min, preco, validade_dias, destaque, descricao) values
  ('experimental', 'Consulta Experimental',  1,  50,  25.00,  30,  false, 'Sessão inicial para conhecermos o seu caso e perceber se somos a combinação certa. Disponível apenas uma vez por cliente.'),
  ('pacote',       'Essencial',              4,  50, 140.00,  30,  false, 'Acompanhamento terapêutico inicial. Ideal para começar o seu processo de mudança.'),
  ('pacote',       'Evolução',               8,  50, 240.00,  60,  true,  'Acompanhamento contínuo com maior profundidade. O plano mais escolhido.'),
  ('pacote',       'Premium',               12,  50, 360.00,  90,  false, 'Processo terapêutico completo com prioridade no agendamento e suporte dedicado.');

-- Créditos de sessões por cliente
create table public.creditos_cliente (
  id                uuid          primary key default gen_random_uuid(),
  cliente_email     text          not null,
  cliente_nome      text          not null default '',
  pacote_id         uuid          not null references public.pacotes(id),
  sessoes_total     smallint      not null,
  sessoes_restantes smallint      not null,
  validade          date          not null,
  stripe_payment_id text,
  status            text          not null default 'ativo'
                                  check (status in ('ativo', 'expirado', 'esgotado')),
  criado_em         timestamptz   not null default now(),
  atualizado_em     timestamptz   not null default now(),
  constraint creditos_sessoes_check check (sessoes_restantes >= 0 and sessoes_restantes <= sessoes_total)
);

-- Garantir apenas 1 consulta experimental por e-mail
create unique index creditos_experimental_unique
  on public.creditos_cliente (cliente_email, pacote_id)
  where (select tipo from public.pacotes where id = pacote_id) = 'experimental';

create index creditos_email_idx  on public.creditos_cliente (cliente_email);
create index creditos_status_idx on public.creditos_cliente (status);

-- Adicionar coluna credito_id à tabela agendamentos
alter table public.agendamentos
  add column if not exists credito_id uuid references public.creditos_cliente(id);

-- ── Trigger: descontar/restaurar crédito ─────────────────────
create or replace function public.descontar_credito()
returns trigger language plpgsql as $$
begin
  -- Descontar ao confirmar
  if NEW.status = 'confirmado' and OLD.status <> 'confirmado' and NEW.credito_id is not null then
    update public.creditos_cliente
       set sessoes_restantes = sessoes_restantes - 1,
           atualizado_em     = now(),
           status = case when sessoes_restantes - 1 = 0 then 'esgotado' else status end
     where id = NEW.credito_id and sessoes_restantes > 0;

    if not found then
      raise exception 'Sem créditos disponíveis neste pacote';
    end if;
  end if;

  -- Restaurar se cancelado depois de confirmado
  if NEW.status = 'cancelado' and OLD.status = 'confirmado' and NEW.credito_id is not null then
    update public.creditos_cliente
       set sessoes_restantes = sessoes_restantes + 1,
           atualizado_em     = now(),
           status            = 'ativo'
     where id = NEW.credito_id;
  end if;

  return NEW;
end;
$$;

create trigger agendamento_credito_trigger
  after update on public.agendamentos
  for each row execute procedure public.descontar_credito();
