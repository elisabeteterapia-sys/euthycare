-- ============================================================
-- 023 — Código curto para links de divulgação de pacotes
-- ============================================================

alter table public.pacotes
  add column if not exists codigo text unique;

-- Gerar códigos para pacotes existentes (6 chars aleatórios)
update public.pacotes
set codigo = substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)
where codigo is null;
