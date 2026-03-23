-- ======================== EXTRA FIELDS FOR CATATAN PANEN ========================
-- Add varietas, MOQ, kemasan, ketersediaan, metode simpan, sertifikasi

ALTER TABLE public.catatan_panen
  ADD COLUMN varietas          TEXT,
  ADD COLUMN min_order_kg      DECIMAL(10,2),
  ADD COLUMN kemasan           TEXT,
  ADD COLUMN tersedia_sampai   DATE,
  ADD COLUMN metode_simpan     TEXT,
  ADD COLUMN sertifikasi       TEXT;

-- Also add the fields to katalog_komoditas so suppliers can see them
ALTER TABLE public.katalog_komoditas
  ADD COLUMN varietas          TEXT,
  ADD COLUMN min_order_kg      DECIMAL(10,2),
  ADD COLUMN kemasan           TEXT,
  ADD COLUMN tersedia_sampai   DATE,
  ADD COLUMN metode_simpan     TEXT,
  ADD COLUMN sertifikasi       TEXT;
