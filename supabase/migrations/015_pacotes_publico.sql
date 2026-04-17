-- ============================================================
-- 015 — Campo publico em pacotes (visibilidade no perfil público)
-- ============================================================

alter table public.pacotes
  add column if not exists publico boolean not null default true;

comment on column public.pacotes.publico is
  'Se false, o pacote não aparece no perfil público mas pode ser acedido via link directo (?pacote=id)';
