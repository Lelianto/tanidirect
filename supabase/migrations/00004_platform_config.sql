-- Konfigurasi platform (rekening Taninesia, QRIS, dll)
-- Satu baris per key, dikelola admin

CREATE TABLE public.platform_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES public.users(id)
);

-- Seed default rekening config
INSERT INTO public.platform_config (key, value) VALUES
  ('rekening_escrow', '{"bank":"","nomor":"","atas_nama":""}'),
  ('qris', '{"image_path":"","merchant_name":""}');
