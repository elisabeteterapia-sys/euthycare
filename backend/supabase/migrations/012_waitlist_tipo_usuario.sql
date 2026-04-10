-- ============================================================
-- Migration 012 — Add tipo_usuario to waitlist
-- ============================================================

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS tipo_usuario text NOT NULL DEFAULT 'terapeuta'
    CHECK (tipo_usuario IN ('terapeuta', 'clinica'));
