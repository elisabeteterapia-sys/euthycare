-- ============================================================
-- Migration 016 — Explicit storage deny for produtos-pdf bucket
-- ============================================================
-- Belt-and-suspenders: even though the bucket has no allow policies
-- (so service role is the only accessor by default), we add an
-- explicit deny to make the intent unambiguous and prevent any
-- future accidental policy grants from opening the bucket.

-- Deny SELECT (download) for anonymous users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'deny_anon_read_produtos_pdf'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "deny_anon_read_produtos_pdf"
        ON storage.objects
        FOR SELECT
        TO anon
        USING (bucket_id <> 'produtos-pdf')
    $policy$;
  END IF;
END $$;

-- Deny SELECT for authenticated users (downloads go through backend, not direct)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'deny_authenticated_read_produtos_pdf'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "deny_authenticated_read_produtos_pdf"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (bucket_id <> 'produtos-pdf')
    $policy$;
  END IF;
END $$;

-- Deny INSERT/UPDATE/DELETE for both roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'deny_all_write_produtos_pdf'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "deny_all_write_produtos_pdf"
        ON storage.objects
        FOR ALL
        TO anon, authenticated
        USING (bucket_id <> 'produtos-pdf')
        WITH CHECK (bucket_id <> 'produtos-pdf')
    $policy$;
  END IF;
END $$;
