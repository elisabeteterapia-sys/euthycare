-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  nome        text,
  origem      text DEFAULT 'site',  -- 'site', 'blog', 'loja', etc.
  confirmado  boolean NOT NULL DEFAULT false,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Apenas admins lêem; inserts são públicos (qualquer visitante pode subscrever)
CREATE POLICY "newsletter_insert_public"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "newsletter_select_admin"
  ON public.newsletter_subscribers FOR SELECT
  USING (false); -- leitura só via service_role (backend admin)
