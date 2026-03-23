-- Migration: Trust Score System
-- Ubah trust_level enum dari model lama ke model baru (Baru, Terpercaya, Andalan, Bintang)
-- Tambah trust_score numerik di users dan tabel trust_score_log

-- 1. Rename old enum dan buat yang baru
ALTER TYPE trust_level RENAME TO trust_level_old;

CREATE TYPE trust_level AS ENUM ('unverified', 'baru', 'terpercaya', 'andalan', 'bintang');

-- 2. Migrate kyc_submissions.trust_level ke enum baru
ALTER TABLE public.kyc_submissions
  ALTER COLUMN trust_level DROP DEFAULT;

ALTER TABLE public.kyc_submissions
  ALTER COLUMN trust_level TYPE trust_level
  USING CASE
    WHEN trust_level::text = 'unverified' THEN 'unverified'::trust_level
    WHEN trust_level::text = 'verified' THEN 'baru'::trust_level
    WHEN trust_level::text = 'bronze' THEN 'baru'::trust_level
    WHEN trust_level::text = 'silver' THEN 'terpercaya'::trust_level
    WHEN trust_level::text = 'gold' THEN 'andalan'::trust_level
    WHEN trust_level::text = 'platinum' THEN 'bintang'::trust_level
    ELSE 'unverified'::trust_level
  END;

ALTER TABLE public.kyc_submissions
  ALTER COLUMN trust_level SET DEFAULT 'unverified';

DROP TYPE trust_level_old;

-- 3. Tambah kolom trust di users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trust_score   SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_level   trust_level NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS trust_updated TIMESTAMPTZ;

-- Set existing verified users ke level 'baru' dengan skor awal 0
UPDATE public.users
SET trust_level = 'baru', trust_score = 0
WHERE is_verified = true AND trust_level = 'unverified';

-- 4. Tabel log perubahan trust score
CREATE TABLE IF NOT EXISTS public.trust_score_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id),
  transaksi_id  UUID REFERENCES public.transaksi(id),
  delta         SMALLINT NOT NULL DEFAULT 0,
  skor_sebelum  SMALLINT NOT NULL DEFAULT 0,
  skor_sesudah  SMALLINT NOT NULL DEFAULT 0,
  alasan        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trust_score_log_user ON public.trust_score_log(user_id);
CREATE INDEX idx_trust_score_log_created ON public.trust_score_log(created_at DESC);
