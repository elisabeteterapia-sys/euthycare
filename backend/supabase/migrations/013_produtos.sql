-- ============================================================
-- Migration 013 — Produtos (loja digital de PDFs)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.produtos (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text    NOT NULL,
  descricao    text    NOT NULL,                -- short (used on card)
  conteudo     text    NOT NULL DEFAULT '',     -- long description / TOC (detail page)
  preco_cents  integer NOT NULL CHECK (preco_cents >= 0),
  arquivo_url  text    NOT NULL,               -- private storage path (bucket: produtos-pdf)
  tipo         text    NOT NULL DEFAULT 'pdf'  CHECK (tipo = 'pdf'),
  capa_url     text,                            -- public cover image URL
  ativo        boolean NOT NULL DEFAULT true,
  ordem        integer NOT NULL DEFAULT 0,     -- display order (ascending)
  criado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS produtos_ativo_ordem_idx ON public.produtos (ativo, ordem ASC);

-- Public can read active products (for the store)
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_public_read" ON public.produtos
  FOR SELECT USING (ativo = true);

-- ── Storage bucket note ───────────────────────────────────────
-- Create a PRIVATE bucket named "produtos-pdf" in Supabase Storage.
-- The backend uses a signed URL (60s TTL) to serve downloads.
-- DO NOT make this bucket public.
