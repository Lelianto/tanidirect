-- TaniDirect Initial Schema
-- Platform Agritech B2B Marketplace

-- ENUMS
CREATE TYPE user_role AS ENUM ('petani', 'ketua_poktan', 'supplier', 'admin');
CREATE TYPE komoditas_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE status_transaksi AS ENUM (
  'draft', 'menunggu_konfirmasi', 'dikonfirmasi',
  'dalam_pengiriman', 'tiba_di_gudang', 'selesai', 'dibatalkan', 'sengketa'
);
CREATE TYPE status_preorder AS ENUM (
  'open', 'matched', 'confirmed', 'fulfilled', 'cancelled'
);
CREATE TYPE status_qa AS ENUM ('pending', 'lulus', 'gagal', 'perlu_tinjauan');
CREATE TYPE tier_logistik AS ENUM ('first_mile', 'middle_mile', 'last_mile');
CREATE TYPE status_kredit AS ENUM ('belum_ada', 'pending', 'disetujui', 'ditolak', 'aktif', 'lunas');
CREATE TYPE tingkat_risiko AS ENUM ('rendah', 'sedang', 'tinggi', 'kritis');

-- USERS
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  nama_lengkap TEXT NOT NULL,
  no_hp TEXT UNIQUE NOT NULL,
  no_ktp TEXT,
  foto_url TEXT,
  provinsi TEXT NOT NULL,
  kabupaten TEXT NOT NULL,
  kecamatan TEXT,
  alamat TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- POKTAN
CREATE TABLE public.poktan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ketua_id UUID NOT NULL REFERENCES public.users(id),
  nama_poktan TEXT NOT NULL,
  kode_poktan TEXT UNIQUE NOT NULL,
  desa TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  kabupaten TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  komoditas_utama TEXT[] NOT NULL DEFAULT '{}',
  jumlah_anggota INT DEFAULT 0,
  skor_qa DECIMAL(5,2) DEFAULT 0,
  skor_ketepatan DECIMAL(5,2) DEFAULT 0,
  total_transaksi INT DEFAULT 0,
  is_qa_certified BOOLEAN DEFAULT false,
  tanggal_sertifikasi TIMESTAMPTZ,
  status_sertifikasi TEXT DEFAULT 'belum',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANGGOTA POKTAN
CREATE TABLE public.anggota_poktan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id UUID NOT NULL REFERENCES public.poktan(id),
  petani_id UUID NOT NULL REFERENCES public.users(id),
  lahan_ha DECIMAL(8,2),
  komoditas TEXT[],
  status TEXT DEFAULT 'aktif',
  tanggal_bergabung TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poktan_id, petani_id)
);

-- SUPPLIER
CREATE TABLE public.supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  nama_perusahaan TEXT NOT NULL,
  npwp TEXT,
  jenis_usaha TEXT,
  kapasitas_bulanan_ton DECIMAL(10,2),
  wilayah_operasi TEXT[],
  deposit_escrow DECIMAL(15,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_preorder INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRE-ORDER
CREATE TABLE public.pre_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.supplier(id),
  komoditas TEXT NOT NULL,
  grade komoditas_grade NOT NULL,
  volume_kg DECIMAL(10,2) NOT NULL,
  harga_penawaran_per_kg DECIMAL(12,2) NOT NULL,
  tanggal_dibutuhkan DATE NOT NULL,
  wilayah_asal TEXT,
  wilayah_tujuan TEXT NOT NULL,
  catatan_spesifikasi TEXT,
  deposit_dibayar DECIMAL(15,2) DEFAULT 0,
  status status_preorder DEFAULT 'open',
  poktan_matched_id UUID REFERENCES public.poktan(id),
  ai_matching_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSAKSI
CREATE TABLE public.transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_order_id UUID REFERENCES public.pre_order(id),
  poktan_id UUID NOT NULL REFERENCES public.poktan(id),
  supplier_id UUID NOT NULL REFERENCES public.supplier(id),
  komoditas TEXT NOT NULL,
  grade komoditas_grade NOT NULL,
  volume_estimasi_kg DECIMAL(10,2) NOT NULL,
  volume_aktual_kg DECIMAL(10,2),
  harga_per_kg DECIMAL(12,2) NOT NULL,
  total_nilai DECIMAL(15,2),
  komisi_platform DECIMAL(15,2),
  status status_transaksi DEFAULT 'draft',
  tanggal_panen_estimasi DATE,
  tanggal_serah_terima TIMESTAMPTZ,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KONTRIBUSI PETANI
CREATE TABLE public.kontribusi_petani (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id UUID NOT NULL REFERENCES public.transaksi(id),
  petani_id UUID NOT NULL REFERENCES public.users(id),
  volume_kg DECIMAL(10,2) NOT NULL,
  harga_diterima DECIMAL(15,2),
  status_bayar TEXT DEFAULT 'pending',
  tanggal_bayar TIMESTAMPTZ,
  UNIQUE(transaksi_id, petani_id)
);

-- QA INSPEKSI
CREATE TABLE public.qa_inspeksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id UUID NOT NULL REFERENCES public.transaksi(id),
  poktan_id UUID NOT NULL REFERENCES public.poktan(id),
  inspektor_id UUID NOT NULL REFERENCES public.users(id),
  jenis_inspektor TEXT DEFAULT 'ketua_poktan',
  komoditas TEXT NOT NULL,
  volume_inspeksi_kg DECIMAL(10,2),
  grade_hasil komoditas_grade,
  skor_kualitas INT,
  foto_urls TEXT[] DEFAULT '{}',
  catatan_inspektor TEXT,
  status status_qa DEFAULT 'pending',
  hasil_aktual JSONB,
  penyimpangan_persen DECIMAL(5,2),
  fee_qa DECIMAL(10,2) DEFAULT 0,
  fee_dibayar DECIMAL(10,2) DEFAULT 0,
  potongan_fee_persen INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOGISTIK
CREATE TABLE public.logistik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id UUID NOT NULL REFERENCES public.transaksi(id),
  tier tier_logistik NOT NULL,
  transporter_nama TEXT,
  transporter_hp TEXT,
  kendaraan_plat TEXT,
  titik_asal TEXT NOT NULL,
  titik_tujuan TEXT NOT NULL,
  latitude_asal DECIMAL(10,8),
  longitude_asal DECIMAL(11,8),
  latitude_tujuan DECIMAL(10,8),
  longitude_tujuan DECIMAL(11,8),
  estimasi_tiba TIMESTAMPTZ,
  aktual_tiba TIMESTAMPTZ,
  status TEXT DEFAULT 'belum_berangkat',
  foto_muat_urls TEXT[] DEFAULT '{}',
  foto_tiba_urls TEXT[] DEFAULT '{}',
  last_update_posisi TEXT,
  last_update_at TIMESTAMPTZ,
  asuransi_kargo BOOLEAN DEFAULT false,
  biaya_logistik DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KREDIT MODAL TANAM
CREATE TABLE public.kredit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petani_id UUID NOT NULL REFERENCES public.users(id),
  poktan_id UUID REFERENCES public.poktan(id),
  jumlah_diajukan DECIMAL(15,2) NOT NULL,
  jumlah_disetujui DECIMAL(15,2),
  tenor_bulan INT NOT NULL,
  bunga_persen DECIMAL(5,2),
  status status_kredit DEFAULT 'pending',
  ai_skor INT,
  ai_kategori TEXT,
  ai_result JSONB,
  tujuan_penggunaan TEXT,
  tanggal_pengajuan TIMESTAMPTZ DEFAULT NOW(),
  tanggal_keputusan TIMESTAMPTZ,
  tanggal_jatuh_tempo DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CICILAN KREDIT
CREATE TABLE public.cicilan_kredit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kredit_id UUID NOT NULL REFERENCES public.kredit(id),
  transaksi_id UUID REFERENCES public.transaksi(id),
  nomor_cicilan INT NOT NULL,
  jumlah_cicilan DECIMAL(15,2) NOT NULL,
  tanggal_jatuh_tempo DATE NOT NULL,
  tanggal_bayar TIMESTAMPTZ,
  status TEXT DEFAULT 'belum_bayar'
);

-- ANOMALI LOG
CREATE TABLE public.anomali_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id UUID NOT NULL REFERENCES public.poktan(id),
  tingkat_risiko tingkat_risiko NOT NULL,
  temuan JSONB NOT NULL,
  rekomendasi TEXT,
  status_tindak_lanjut TEXT DEFAULT 'open',
  ditangani_oleh UUID REFERENCES public.users(id),
  catatan_admin TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- HARGA HISTORIS
CREATE TABLE public.harga_historis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  komoditas TEXT NOT NULL,
  wilayah TEXT NOT NULL,
  harga_per_kg DECIMAL(12,2) NOT NULL,
  volume_total_kg DECIMAL(12,2),
  minggu DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(komoditas, wilayah, minggu)
);

-- PREDIKSI HARGA
CREATE TABLE public.prediksi_harga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  komoditas TEXT NOT NULL,
  wilayah TEXT NOT NULL,
  tren TEXT,
  estimasi_2_minggu JSONB,
  estimasi_4_minggu JSONB,
  faktor_penentu TEXT[],
  catatan_penting TEXT,
  valid_hingga DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFIKASI
CREATE TABLE public.notifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  tipe TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poktan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_inspeksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kredit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomali_log ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admin can read all users"
ON public.users FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Poktan bisa lihat transaksi sendiri"
ON public.transaksi FOR SELECT
USING (
  poktan_id IN (SELECT id FROM public.poktan WHERE ketua_id = auth.uid())
);

CREATE POLICY "Supplier bisa lihat transaksi sendiri"
ON public.transaksi FOR SELECT
USING (
  supplier_id IN (SELECT id FROM public.supplier WHERE user_id = auth.uid())
);

CREATE POLICY "Admin bisa lihat semua transaksi"
ON public.transaksi FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- INDEXES
CREATE INDEX idx_transaksi_poktan ON public.transaksi(poktan_id);
CREATE INDEX idx_transaksi_supplier ON public.transaksi(supplier_id);
CREATE INDEX idx_transaksi_status ON public.transaksi(status);
CREATE INDEX idx_preorder_supplier ON public.pre_order(supplier_id);
CREATE INDEX idx_preorder_status ON public.pre_order(status);
CREATE INDEX idx_kontribusi_petani ON public.kontribusi_petani(petani_id);
CREATE INDEX idx_qa_transaksi ON public.qa_inspeksi(transaksi_id);
CREATE INDEX idx_logistik_transaksi ON public.logistik(transaksi_id);
CREATE INDEX idx_kredit_petani ON public.kredit(petani_id);
CREATE INDEX idx_anomali_poktan ON public.anomali_log(poktan_id);
CREATE INDEX idx_harga_komoditas ON public.harga_historis(komoditas, wilayah, minggu);
CREATE INDEX idx_notifikasi_user ON public.notifikasi(user_id, is_read);
