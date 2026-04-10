-- Tabela de conteúdos editáveis do site
create table if not exists site_conteudo (
  chave text primary key,
  valor text not null,
  descricao text,
  updated_at timestamptz default now()
);

-- Conteúdos iniciais
insert into site_conteudo (chave, valor, descricao) values
  ('hero_titulo',     'Cuidado mental acolhedor e acessível',                                         'Título principal da homepage'),
  ('hero_subtitulo',  'Sessões de psicoterapia online, no conforto da sua casa. Apoio profissional para ansiedade, burnout, relações e bem-estar emocional.', 'Subtítulo da homepage'),
  ('hero_cta',        'Agendar consulta',                                                              'Texto do botão principal'),
  ('hero_nota',       'Primeira consulta experimental · €25 · Sem compromisso',                       'Nota abaixo dos botões'),
  ('sobre_nome',      'Dra. Ana Silva',                                                                'Nome da terapeuta'),
  ('sobre_titulo',    'Psicóloga Clínica',                                                             'Título profissional'),
  ('sobre_bio',       'Especializada em ansiedade, burnout e bem-estar emocional. Abordagem integrativa e humanista, com foco na pessoa como um todo.', 'Biografia curta'),
  ('meta_titulo',     'EuthyCare — Psicoterapia Online',                                              'Título SEO do site'),
  ('meta_descricao',  'Cuidado mental acolhedor e acessível. Consultas de psicoterapia online com profissionais qualificados.', 'Descrição SEO do site')
on conflict (chave) do nothing;

-- RLS
alter table site_conteudo enable row level security;

-- Leitura pública
create policy "conteudo_public_read" on site_conteudo
  for select using (true);

-- Apenas service_role pode escrever (via backend)
create policy "conteudo_admin_write" on site_conteudo
  for all using (false) with check (false);
