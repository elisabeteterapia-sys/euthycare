-- Migration 018: adicionar cliente_nome à tabela creditos_cliente
-- Corrige o erro "Could not find the 'cliente_nome' column"

ALTER TABLE creditos_cliente
  ADD COLUMN IF NOT EXISTS cliente_nome text NOT NULL DEFAULT '';
