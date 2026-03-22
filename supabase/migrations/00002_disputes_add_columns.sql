-- =============================================================
-- Migration: Add missing columns to disputes table
-- The API routes use pelapor_nama, terlapor_nama, bukti (JSONB),
-- and timeline (JSONB) for simpler queries without extra JOINs.
-- =============================================================

-- Tambah kolom nama pelapor & terlapor (denormalisasi untuk display cepat)
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS pelapor_nama TEXT,
  ADD COLUMN IF NOT EXISTS terlapor_nama TEXT;

-- Tambah kolom JSONB bukti & timeline sebagai alternatif tabel terpisah
-- Ini memudahkan insert dari API tanpa multiple table operations
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS bukti    JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]';

-- Backfill nama dari users untuk data existing (jika ada)
UPDATE public.disputes d
SET pelapor_nama = u.nama_lengkap
FROM public.users u
WHERE d.pelapor_id = u.id
  AND d.pelapor_nama IS NULL;

UPDATE public.disputes d
SET terlapor_nama = u.nama_lengkap
FROM public.users u
WHERE d.terlapor_id = u.id
  AND d.terlapor_nama IS NULL;
