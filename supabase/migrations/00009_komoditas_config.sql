-- ======================== KOMODITAS CONFIG ========================
-- Berdasarkan TaniDirect_Feasibility_Finansial.pdf (22 March 2026)
-- 72 komoditas, 3 zona: antar_pulau, cold_chain, lokal_saja

CREATE TYPE zona_kelayakan AS ENUM ('antar_pulau', 'cold_chain', 'lokal_saja');

CREATE TABLE public.komoditas_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama                TEXT NOT NULL UNIQUE,
  kategori            TEXT,
  zona                zona_kelayakan NOT NULL DEFAULT 'antar_pulau',
  daya_tahan_hari     INT NOT NULL DEFAULT 30,
  susut_persen        INT NOT NULL DEFAULT 5,
  perlu_cold_chain    BOOLEAN NOT NULL DEFAULT false,
  layak_antar_pulau   BOOLEAN NOT NULL DEFAULT true,
  harga_petani_ref    INT,          -- Rp/kg referensi harga petani
  harga_jakarta_ref   INT,          -- Rp/kg referensi harga Jakarta
  biaya_kapal_ref     INT,          -- Rp/kg referensi biaya kapal
  catatan             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.komoditas_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "komoditas_config_select_public" ON public.komoditas_config
  FOR SELECT USING (true);
CREATE POLICY "komoditas_config_admin" ON public.komoditas_config
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.komoditas_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ======================== SEED: ZONA A — ANTAR PULAU FEASIBLE (31) ========================
INSERT INTO public.komoditas_config (nama, kategori, zona, daya_tahan_hari, susut_persen, perlu_cold_chain, layak_antar_pulau, harga_petani_ref, harga_jakarta_ref, biaya_kapal_ref, catatan) VALUES
  ('Beras Medium', 'serealia', 'antar_pulau', 180, 3, false, true, 9500, 17500, 400, 'Gabah→Beras. Asal: Sulsel/Kalteng'),
  ('Beras Premium', 'serealia', 'antar_pulau', 180, 3, false, true, 11000, 20750, 400, 'Asal: Sulsel/Jatim'),
  ('Jagung Pipilan Kering', 'serealia', 'antar_pulau', 120, 5, false, true, 3800, 6800, 350, 'Asal: NTT/Gorontalo'),
  ('Sorgum Kering', 'serealia', 'antar_pulau', 120, 5, false, true, 3000, 5500, 350, 'Asal: NTT/NTB'),
  ('Kedelai Lokal Kering', 'kacang', 'antar_pulau', 150, 4, false, true, 8500, 13500, 400, 'Asal: Sulsel/NTT'),
  ('Kacang Tanah Kering', 'kacang', 'antar_pulau', 150, 4, false, true, 12000, 22000, 400, 'Asal: Sulsel/Lampung'),
  ('Kacang Hijau Kering', 'kacang', 'antar_pulau', 150, 4, false, true, 9000, 17000, 400, 'Asal: NTT/NTB'),
  ('Kacang Merah Kering', 'kacang', 'antar_pulau', 150, 4, false, true, 14000, 26000, 500, 'Asal: Sulut/Maluku'),
  ('Bawang Merah Kering', 'bawang', 'antar_pulau', 90, 8, false, true, 20000, 68400, 500, 'Asal: Sulsel (Enrekang). Kandidat TERBAIK pilot antar pulau'),
  ('Bawang Putih Lokal', 'bawang', 'antar_pulau', 90, 6, false, true, 28000, 57900, 400, 'Asal: Jateng/NTB'),
  ('Lada Hitam Kering', 'rempah', 'antar_pulau', 730, 3, false, true, 85000, 140000, 800, 'Asal: Babel/Kalbar. Margin tinggi'),
  ('Lada Putih Kering', 'rempah', 'antar_pulau', 730, 3, false, true, 100000, 160000, 800, 'Asal: Babel/Kaltim'),
  ('Cengkeh Kering', 'rempah', 'antar_pulau', 730, 3, false, true, 115000, 165000, 800, 'Asal: Maluku/Sulut'),
  ('Pala Biji Kupas', 'rempah', 'antar_pulau', 730, 3, false, true, 70000, 120000, 800, 'Asal: Maluku/Papua'),
  ('Kayu Manis Kering', 'rempah', 'antar_pulau', 730, 3, false, true, 25000, 55000, 500, 'Asal: Sumbar/Jambi'),
  ('Kemiri Kering', 'rempah', 'antar_pulau', 365, 4, false, true, 12000, 24000, 400, 'Asal: Sulsel/NTT'),
  ('Jahe Kering Simplisia', 'rempah', 'antar_pulau', 365, 5, false, true, 18000, 40000, 400, 'Asal: Jatim/Sulsel'),
  ('Kunyit Kering Simplisia', 'rempah', 'antar_pulau', 365, 5, false, true, 15000, 32000, 400, 'Asal: Jatim/Jateng'),
  ('Kapulaga Kering', 'rempah', 'antar_pulau', 730, 3, false, true, 80000, 150000, 500, 'Asal: Jateng/Jabar'),
  ('Kopra Hitam', 'kelapa', 'antar_pulau', 180, 5, false, true, 20500, 32000, 450, 'Asal: Sulut/Sultra'),
  ('VCO Minyak Kelapa Murni', 'kelapa-olahan', 'antar_pulau', 365, 2, false, true, 45000, 95000, 500, 'Asal: Sulut/Maluku'),
  ('Gula Kelapa Aren', 'kelapa-olahan', 'antar_pulau', 180, 3, false, true, 18000, 40000, 450, 'Asal: Sulut/Jateng'),
  ('Kopi Arabika Green Bean', 'perkebunan', 'antar_pulau', 365, 3, false, true, 65000, 120000, 600, 'Asal: Aceh Gayo/Toraja'),
  ('Kopi Robusta Green Bean', 'perkebunan', 'antar_pulau', 365, 3, false, true, 28000, 52000, 350, 'Asal: Lampung/Bengkulu'),
  ('Kakao Fermentasi Biji', 'perkebunan', 'antar_pulau', 365, 4, false, true, 110000, 160000, 600, 'Asal: Sulsel/Sulteng'),
  ('Tepung Tapioka', 'olahan', 'antar_pulau', 365, 2, false, true, 6500, 12000, 350, 'Asal: Lampung/Sulsel'),
  ('Tepung Mocaf', 'olahan', 'antar_pulau', 365, 2, false, true, 9000, 18000, 400, 'Asal: Jatim/Jateng'),
  ('Jamur Kuping Kering', 'jamur', 'antar_pulau', 365, 3, false, true, 55000, 100000, 500, 'Asal: Jatim/Jabar'),
  ('Jamur Shiitake Kering', 'jamur', 'antar_pulau', 365, 3, false, true, 80000, 160000, 500, 'Asal: Jatim/Jabar'),
  ('Gula Merah Cetak', 'olahan', 'antar_pulau', 180, 3, false, true, 14000, 28000, 400, 'Asal: Jatim/Sulsel'),
  ('Pinang Kering Biji', 'perkebunan', 'antar_pulau', 365, 5, false, true, 8000, 18000, 400, 'Asal: Aceh/Sulteng');

-- ======================== SEED: ZONA B — COLD CHAIN / REEFER (21) ========================
INSERT INTO public.komoditas_config (nama, kategori, zona, daya_tahan_hari, susut_persen, perlu_cold_chain, layak_antar_pulau, harga_petani_ref, harga_jakarta_ref, biaya_kapal_ref, catatan) VALUES
  ('Mangga Harum Manis', 'buah', 'cold_chain', 7, 10, true, true, 8000, 22000, 1800, 'Asal: Jatim/NTB. MARGINAL'),
  ('Mangga Gedong Gincu', 'buah', 'cold_chain', 7, 8, true, true, 15000, 40000, 1800, 'Asal: Jabar/Jatim'),
  ('Pisang Cavendish', 'buah', 'cold_chain', 7, 8, true, true, 4500, 14000, 1500, 'Asal: Lampung/Sulsel. MARGINAL'),
  ('Nanas', 'buah', 'cold_chain', 10, 8, true, true, 3500, 12000, 700, 'Asal: Lampung/Jatim'),
  ('Jeruk Pontianak Siam', 'buah', 'cold_chain', 14, 10, true, true, 7000, 22000, 1500, 'Asal: Kalbar/Sulteng. MARGINAL'),
  ('Pepaya California', 'buah', 'cold_chain', 7, 8, true, true, 5000, 16000, 1500, 'Asal: Jatim/Sulsel. MARGINAL'),
  ('Alpukat', 'buah', 'cold_chain', 7, 10, true, true, 9000, 28000, 1500, 'Asal: Jatim/Sulsel'),
  ('Manggis', 'buah', 'cold_chain', 7, 8, true, true, 12000, 45000, 1500, 'Asal: Jabar/Sulsel'),
  ('Salak Pondoh', 'buah', 'cold_chain', 14, 8, true, true, 8000, 22000, 1200, 'Asal: DIY/Jatim. MARGINAL'),
  ('Durian Frozen', 'buah', 'cold_chain', 90, 5, true, true, 15000, 65000, 2500, 'Asal: Sulteng/Sulsel'),
  ('Kentang Granola Atlantik', 'umbi-sayur', 'cold_chain', 30, 6, true, true, 8000, 18000, 600, 'Asal: Jatim/Sulsel'),
  ('Wortel', 'umbi-sayur', 'cold_chain', 14, 8, true, true, 5000, 15000, 1500, 'Asal: Jatim/Sulsel. MARGINAL'),
  ('Ubi Jalar Ungu', 'umbi-sayur', 'cold_chain', 30, 10, true, true, 5000, 20000, 1200, 'Asal: Papua/Sulsel. MARGINAL'),
  ('Jahe Segar', 'rempah-segar', 'cold_chain', 30, 5, true, true, 12000, 28000, 600, 'Asal: Jatim/Sulsel'),
  ('Kunyit Segar', 'rempah-segar', 'cold_chain', 30, 5, true, true, 8000, 20000, 600, 'Asal: Jatim/Sulsel'),
  ('Lengkuas Segar', 'rempah-segar', 'cold_chain', 30, 5, true, true, 7000, 18000, 600, 'Asal: Jatim/Sulsel'),
  ('Kencur Segar', 'rempah-segar', 'cold_chain', 14, 5, true, true, 15000, 32000, 500, 'Asal: Jatim/Jateng'),
  ('Labu Kuning Waluh', 'labu', 'cold_chain', 30, 5, true, true, 3500, 10000, 500, 'Asal: Jatim/Sulsel'),
  ('Nanas Industri', 'buah', 'cold_chain', 10, 5, true, true, 2500, 8000, 500, 'Asal: Lampung'),
  ('Cabai Kering Powder', 'olahan', 'antar_pulau', 365, 2, false, true, 45000, 90000, 500, 'Asal: Jatim/Sulsel. Olahan tahan lama'),
  ('Vanili Kering Grade B', 'rempah-premium', 'antar_pulau', 730, 2, false, true, 3000000, 5000000, 5000, 'Asal: Sulsel/NTT. Margin sangat tinggi');

-- ======================== SEED: ZONA C — LOKAL / DALAM PULAU SAJA (20) ========================
INSERT INTO public.komoditas_config (nama, kategori, zona, daya_tahan_hari, susut_persen, perlu_cold_chain, layak_antar_pulau, harga_petani_ref, harga_jakarta_ref, biaya_kapal_ref, catatan) VALUES
  ('Cabai Merah Besar Segar', 'sayuran', 'lokal_saja', 5, 15, false, false, 18000, 50000, NULL, 'Asal: Jatim/Sulsel. Dalam pulau saja'),
  ('Cabai Rawit Merah Segar', 'sayuran', 'lokal_saja', 5, 15, false, false, 22000, 118950, NULL, 'Asal: Jatim/Sulsel. Harga spike Ramadan'),
  ('Cabai Keriting Segar', 'sayuran', 'lokal_saja', 5, 15, false, false, 15000, 50674, NULL, 'Asal: Jatim/Sulsel'),
  ('Tomat Sayur Segar', 'sayuran', 'lokal_saja', 5, 20, false, false, 5000, 14000, NULL, 'Susut tinggi'),
  ('Kangkung Segar', 'sayuran-daun', 'lokal_saja', 1, 30, false, false, 3000, 8000, NULL, 'Susut sangat tinggi 30%'),
  ('Bayam Segar', 'sayuran-daun', 'lokal_saja', 1, 30, false, false, 3500, 9000, NULL, 'Susut sangat tinggi 30%'),
  ('Sawi Hijau Segar', 'sayuran-daun', 'lokal_saja', 2, 25, false, false, 4000, 10000, NULL, 'Asal: Jabar/Jatim'),
  ('Pakcoy Bok Choy Segar', 'sayuran-daun', 'lokal_saja', 2, 25, false, false, 5000, 14000, NULL, 'Asal: Jabar/Jatim'),
  ('Kubis Kol Putih Segar', 'brassica', 'lokal_saja', 7, 12, false, false, 5000, 14000, NULL, 'Asal: Jabar/Jatim'),
  ('Brokoli Segar', 'brassica', 'lokal_saja', 5, 15, false, false, 7000, 22000, NULL, 'Asal: Jabar/Jatim'),
  ('Tomat Cherry Segar', 'sayuran', 'lokal_saja', 5, 12, false, false, 10000, 30000, NULL, 'Asal: Jabar/Jatim'),
  ('Buncis Segar', 'kacang-segar', 'lokal_saja', 3, 15, false, false, 6000, 18000, NULL, 'Asal: Jabar/Jatim'),
  ('Terong Ungu Segar', 'sayuran', 'lokal_saja', 5, 15, false, false, 4000, 12000, NULL, 'Semua sentra'),
  ('Jamur Tiram Segar', 'jamur', 'lokal_saja', 2, 40, false, false, 12000, 28000, NULL, 'Radius 50km. Susut 40%'),
  ('Seledri Segar', 'sayuran-daun', 'lokal_saja', 3, 20, false, false, 6000, 16000, NULL, 'Asal: Jabar/Jatim'),
  ('Kemangi Segar', 'sayuran-daun', 'lokal_saja', 1, 30, false, false, 8000, 18000, NULL, 'Susut sangat tinggi 30%'),
  ('Kacang Panjang Segar', 'kacang-segar', 'lokal_saja', 3, 20, false, false, 5000, 14000, NULL, 'Semua sentra'),
  ('Labu Siam Segar', 'labu', 'lokal_saja', 7, 12, false, false, 3000, 9000, NULL, 'Semua sentra'),
  ('Paprika Segar', 'sayuran', 'lokal_saja', 7, 12, false, false, 18000, 45000, NULL, 'Asal: Jabar/Sulsel'),
  ('Edamame Segar', 'kacang-segar', 'lokal_saja', 3, 15, false, false, 12000, 35000, NULL, 'Asal: Jatim (Jember)');
