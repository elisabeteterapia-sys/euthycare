-- ============================================================
-- Migration 019 — Infra Maio 2026
-- Bucket capas, colunas pedidos/pacotes/terapeutas/agendamentos
-- ============================================================

-- 1. Bucket público para capas de produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('capas-produtos', 'capas-produtos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política: leitura pública
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'capas_public_read'
  ) THEN
    CREATE POLICY "capas_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'capas-produtos');
  END IF;
END $$;

-- 2. Pedidos — colunas de controlo de email de download
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS email_enviado  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS token_expira_em timestamptz;

-- 3. Pacotes — código curto de partilha (ex: /p/abc12345)
ALTER TABLE public.pacotes
  ADD COLUMN IF NOT EXISTS codigo text;

-- gerar códigos para os pacotes sem código
UPDATE public.pacotes
SET codigo = left(md5(random()::text || id::text), 8)
WHERE codigo IS NULL;

-- tornar único depois do backfill
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'pacotes' AND indexname = 'pacotes_codigo_key'
  ) THEN
    ALTER TABLE public.pacotes ADD CONSTRAINT pacotes_codigo_key UNIQUE (codigo);
  END IF;
END $$;

-- 4. Terapeutas — Stripe Connect
ALTER TABLE public.terapeutas
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded  boolean NOT NULL DEFAULT false;

-- 5. Agendamentos — videochamada e lembretes
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS video_url    text,
  ADD COLUMN IF NOT EXISTS lembrete_24h boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lembrete_30m boolean NOT NULL DEFAULT false;
