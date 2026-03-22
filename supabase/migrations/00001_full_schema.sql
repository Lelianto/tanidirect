-- =============================================================
-- taninesia — Full Database Schema
-- Platform Agritech B2B Marketplace
-- Generated: 2026-03-22
-- =============================================================

-- ======================== ENUMS ========================

CREATE TYPE user_role AS ENUM ('petani', 'ketua_poktan', 'supplier', 'admin');
CREATE TYPE komoditas_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE status_transaksi AS ENUM (
  'draft', 'menunggu_konfirmasi', 'dikonfirmasi',
  'dalam_pengiriman', 'tiba_di_gudang', 'selesai', 'dibatalkan', 'sengketa'
);
CREATE TYPE status_preorder AS ENUM ('open', 'matched', 'confirmed', 'fulfilled', 'cancelled');
CREATE TYPE status_qa AS ENUM ('pending', 'lulus', 'gagal', 'perlu_tinjauan');
CREATE TYPE tier_logistik AS ENUM ('first_mile', 'middle_mile', 'last_mile');
CREATE TYPE status_kredit AS ENUM ('belum_ada', 'pending', 'disetujui', 'ditolak', 'aktif', 'lunas');
CREATE TYPE tingkat_risiko AS ENUM ('rendah', 'sedang', 'tinggi', 'kritis');
CREATE TYPE metode_pencairan AS ENUM ('bank', 'ewallet');
CREATE TYPE status_pencairan AS ENUM ('diproses', 'berhasil', 'gagal');
CREATE TYPE kyc_status AS ENUM (
  'pending', 'docs_incomplete', 'docs_submitted', 'docs_revision',
  'layer1_passed', 'layer1_failed', 'fully_verified', 'suspended'
);
CREATE TYPE kyc_doc_type AS ENUM ('ktp', 'selfie');
CREATE TYPE kyc_doc_status AS ENUM ('uploaded', 'verified', 'rejected');
CREATE TYPE kyc_layer_status AS ENUM ('belum', 'pending', 'approved', 'rejected', 'revisi');
CREATE TYPE trust_level AS ENUM ('unverified', 'verified', 'bronze', 'silver', 'gold', 'platinum');
CREATE TYPE dispute_category AS ENUM ('kualitas', 'keterlambatan', 'volume', 'pembayaran', 'pembatalan');
CREATE TYPE dispute_status AS ENUM ('diajukan', 'investigasi', 'mediasi', 'eskalasi', 'selesai');
CREATE TYPE evidence_type AS ENUM ('foto', 'dokumen', 'catatan');
CREATE TYPE onboarding_phase AS ENUM ('1', '2', '3');
CREATE TYPE onboarding_milestone_status AS ENUM ('belum', 'in_progress', 'tercapai');

-- ======================== TABLES ========================

-- USERS
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role NOT NULL,
  nama_lengkap    TEXT NOT NULL,
  no_hp           TEXT UNIQUE NOT NULL,
  no_ktp          TEXT,
  foto_url        TEXT,
  provinsi        TEXT NOT NULL,
  kabupaten       TEXT NOT NULL,
  kecamatan       TEXT,
  alamat          TEXT,
  is_verified     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  -- KYC fields
  kyc_status      kyc_status DEFAULT 'pending',
  kyc_submitted_at   TIMESTAMPTZ,
  kyc_reviewed_at    TIMESTAMPTZ,
  kyc_reviewer_id    UUID,
  kyc_reviewer_notes TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Deferred FK for kyc_reviewer_id (self-referencing)
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_kyc_reviewer
  FOREIGN KEY (kyc_reviewer_id) REFERENCES public.users(id);

-- REKENING (informasi rekening bank / e-wallet user)
CREATE TABLE public.rekening (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metode      metode_pencairan NOT NULL,
  provider    TEXT NOT NULL,
  nomor       TEXT NOT NULL,
  atas_nama   TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metode, nomor)
);

-- POKTAN
CREATE TABLE public.poktan (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ketua_id             UUID NOT NULL REFERENCES public.users(id),
  nama_poktan          TEXT NOT NULL,
  kode_poktan          TEXT UNIQUE NOT NULL,
  desa                 TEXT NOT NULL,
  kecamatan            TEXT NOT NULL,
  kabupaten            TEXT NOT NULL,
  provinsi             TEXT NOT NULL,
  latitude             DECIMAL(10,8),
  longitude            DECIMAL(11,8),
  komoditas_utama      TEXT[] NOT NULL DEFAULT '{}',
  jumlah_anggota       INT DEFAULT 0,
  skor_qa              DECIMAL(5,2) DEFAULT 0,
  skor_ketepatan       DECIMAL(5,2) DEFAULT 0,
  total_transaksi      INT DEFAULT 0,
  is_qa_certified      BOOLEAN DEFAULT false,
  tanggal_sertifikasi  TIMESTAMPTZ,
  status_sertifikasi   TEXT DEFAULT 'belum',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ANGGOTA POKTAN
CREATE TABLE public.anggota_poktan (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id         UUID NOT NULL REFERENCES public.poktan(id),
  petani_id         UUID NOT NULL REFERENCES public.users(id),
  lahan_ha          DECIMAL(8,2),
  komoditas         TEXT[],
  status            TEXT DEFAULT 'aktif',
  tanggal_bergabung TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poktan_id, petani_id)
);

-- SUPPLIER
CREATE TABLE public.supplier (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id),
  nama_perusahaan       TEXT NOT NULL,
  npwp                  TEXT,
  jenis_usaha           TEXT,
  kapasitas_bulanan_ton DECIMAL(10,2),
  wilayah_operasi       TEXT[],
  deposit_escrow        DECIMAL(15,2) DEFAULT 0,
  rating                DECIMAL(3,2) DEFAULT 0,
  total_preorder        INT DEFAULT 0,
  is_verified           BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- PRE-ORDER
CREATE TABLE public.pre_order (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id              UUID NOT NULL REFERENCES public.supplier(id),
  komoditas                TEXT NOT NULL,
  grade                    komoditas_grade NOT NULL,
  volume_kg                DECIMAL(10,2) NOT NULL,
  harga_penawaran_per_kg   DECIMAL(12,2) NOT NULL,
  tanggal_dibutuhkan       DATE NOT NULL,
  wilayah_asal             TEXT,
  wilayah_tujuan           TEXT NOT NULL,
  catatan_spesifikasi      TEXT,
  catatan_kualitas_supplier TEXT,
  ai_qa_steps              JSONB,
  deposit_dibayar          DECIMAL(15,2) DEFAULT 0,
  status                   status_preorder DEFAULT 'open',
  poktan_matched_id        UUID REFERENCES public.poktan(id),
  ai_matching_result       JSONB,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSAKSI
CREATE TABLE public.transaksi (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_order_id           UUID REFERENCES public.pre_order(id),
  poktan_id              UUID NOT NULL REFERENCES public.poktan(id),
  supplier_id            UUID NOT NULL REFERENCES public.supplier(id),
  komoditas              TEXT NOT NULL,
  grade                  komoditas_grade NOT NULL,
  volume_estimasi_kg     DECIMAL(10,2) NOT NULL,
  volume_aktual_kg       DECIMAL(10,2),
  harga_per_kg           DECIMAL(12,2) NOT NULL,
  total_nilai            DECIMAL(15,2),
  komisi_platform        DECIMAL(15,2),
  status                 status_transaksi DEFAULT 'draft',
  tanggal_panen_estimasi DATE,
  tanggal_serah_terima   TIMESTAMPTZ,
  catatan                TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- KONTRIBUSI PETANI
CREATE TABLE public.kontribusi_petani (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id    UUID NOT NULL REFERENCES public.transaksi(id),
  petani_id       UUID NOT NULL REFERENCES public.users(id),
  volume_kg       DECIMAL(10,2) NOT NULL,
  harga_diterima  DECIMAL(15,2),
  status_bayar    TEXT DEFAULT 'pending',
  tanggal_bayar   TIMESTAMPTZ,
  UNIQUE(transaksi_id, petani_id)
);

-- QA INSPEKSI
CREATE TABLE public.qa_inspeksi (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id               UUID NOT NULL REFERENCES public.transaksi(id),
  poktan_id                  UUID NOT NULL REFERENCES public.poktan(id),
  inspektor_id               UUID NOT NULL REFERENCES public.users(id),
  jenis_inspektor            TEXT DEFAULT 'ketua_poktan',
  komoditas                  TEXT NOT NULL,
  volume_inspeksi_kg         DECIMAL(10,2),
  grade_hasil                komoditas_grade,
  skor_kualitas              INT,
  foto_urls                  TEXT[] DEFAULT '{}',
  catatan_inspektor          TEXT,
  status                     status_qa DEFAULT 'pending',
  hasil_aktual               JSONB,
  penyimpangan_persen        DECIMAL(5,2),
  fee_qa                     DECIMAL(10,2) DEFAULT 0,
  fee_dibayar                DECIMAL(10,2) DEFAULT 0,
  potongan_fee_persen        INT DEFAULT 0,
  grade_rekomendasi_sistem   TEXT,
  grade_override_reason      TEXT,
  supplier_review_status     TEXT DEFAULT 'pending'
    CHECK (supplier_review_status IN ('pending', 'approved', 'disputed')),
  supplier_review_catatan    TEXT,
  supplier_reviewed_at       TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- LOGISTIK
CREATE TABLE public.logistik (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id        UUID NOT NULL REFERENCES public.transaksi(id),
  tier                tier_logistik NOT NULL,
  transporter_nama    TEXT,
  transporter_hp      TEXT,
  kendaraan_plat      TEXT,
  titik_asal          TEXT NOT NULL,
  titik_tujuan        TEXT NOT NULL,
  latitude_asal       DECIMAL(10,8),
  longitude_asal      DECIMAL(11,8),
  latitude_tujuan     DECIMAL(10,8),
  longitude_tujuan    DECIMAL(11,8),
  estimasi_tiba       TIMESTAMPTZ,
  aktual_tiba         TIMESTAMPTZ,
  status              TEXT DEFAULT 'belum_berangkat',
  foto_muat_urls      TEXT[] DEFAULT '{}',
  foto_tiba_urls      TEXT[] DEFAULT '{}',
  last_update_posisi  TEXT,
  last_update_at      TIMESTAMPTZ,
  asuransi_kargo      BOOLEAN DEFAULT false,
  biaya_logistik      DECIMAL(12,2),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- KREDIT MODAL TANAM
CREATE TABLE public.kredit (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petani_id           UUID NOT NULL REFERENCES public.users(id),
  poktan_id           UUID REFERENCES public.poktan(id),
  jumlah_diajukan     DECIMAL(15,2) NOT NULL,
  jumlah_disetujui    DECIMAL(15,2),
  tenor_bulan         INT NOT NULL,
  bunga_persen        DECIMAL(5,2),
  status              status_kredit DEFAULT 'pending',
  ai_skor             INT,
  ai_kategori         TEXT,
  ai_result           JSONB,
  tujuan_penggunaan   TEXT,
  tanggal_pengajuan   TIMESTAMPTZ DEFAULT NOW(),
  tanggal_keputusan   TIMESTAMPTZ,
  tanggal_jatuh_tempo DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- CICILAN KREDIT
CREATE TABLE public.cicilan_kredit (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kredit_id           UUID NOT NULL REFERENCES public.kredit(id),
  transaksi_id        UUID REFERENCES public.transaksi(id),
  nomor_cicilan       INT NOT NULL,
  jumlah_cicilan      DECIMAL(15,2) NOT NULL,
  tanggal_jatuh_tempo DATE NOT NULL,
  tanggal_bayar       TIMESTAMPTZ,
  status              TEXT DEFAULT 'belum_bayar'
);

-- PENCAIRAN DANA
CREATE TABLE public.pencairan (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petani_id        UUID NOT NULL REFERENCES public.users(id),
  rekening_id      UUID NOT NULL REFERENCES public.rekening(id),
  jumlah           DECIMAL(15,2) NOT NULL,
  biaya_admin      DECIMAL(15,2) DEFAULT 0,
  jumlah_diterima  DECIMAL(15,2) NOT NULL,
  status           status_pencairan DEFAULT 'diproses',
  catatan          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  selesai_at       TIMESTAMPTZ
);

-- ANOMALI LOG
CREATE TABLE public.anomali_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id            UUID NOT NULL REFERENCES public.poktan(id),
  tingkat_risiko       tingkat_risiko NOT NULL,
  temuan               JSONB NOT NULL,
  rekomendasi          TEXT,
  status_tindak_lanjut TEXT DEFAULT 'open',
  ditangani_oleh       UUID REFERENCES public.users(id),
  catatan_admin        TEXT,
  scanned_at           TIMESTAMPTZ DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ
);

-- HARGA HISTORIS
CREATE TABLE public.harga_historis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  komoditas        TEXT NOT NULL,
  wilayah          TEXT NOT NULL,
  harga_per_kg     DECIMAL(12,2) NOT NULL,
  volume_total_kg  DECIMAL(12,2),
  minggu           DATE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(komoditas, wilayah, minggu)
);

-- PREDIKSI HARGA
CREATE TABLE public.prediksi_harga (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  komoditas         TEXT NOT NULL,
  wilayah           TEXT NOT NULL,
  tren              TEXT,
  estimasi_2_minggu JSONB,
  estimasi_4_minggu JSONB,
  faktor_penentu    TEXT[],
  catatan_penting   TEXT,
  valid_hingga      DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFIKASI
CREATE TABLE public.notifikasi (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id),
  judul      TEXT NOT NULL,
  pesan      TEXT NOT NULL,
  tipe       TEXT,
  link       TEXT,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================== KYC ========================

-- KYC DOCUMENTS
CREATE TABLE public.kyc_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doc_type       kyc_doc_type NOT NULL,
  file_path      TEXT NOT NULL,
  status         kyc_doc_status DEFAULT 'uploaded',
  reviewer_notes TEXT,
  uploaded_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ,
  UNIQUE(user_id, doc_type)
);

-- KYC SUBMISSIONS (multi-layer tracking)
CREATE TABLE public.kyc_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_role        user_role NOT NULL,
  layer            SMALLINT NOT NULL CHECK (layer BETWEEN 1 AND 3),
  trust_level      trust_level DEFAULT 'unverified',
  status           kyc_layer_status DEFAULT 'belum',
  reviewer_id      UUID REFERENCES public.users(id),
  reviewer_catatan TEXT,
  submitted_at     TIMESTAMPTZ,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, layer)
);

-- KYC SUBMISSION DOCUMENTS (documents per submission)
CREATE TABLE public.kyc_submission_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES public.kyc_submissions(id) ON DELETE CASCADE,
  nama            TEXT NOT NULL,
  file_path       TEXT,
  status          kyc_layer_status DEFAULT 'pending',
  catatan         TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- KYC AUDIT LOG (immutable)
CREATE TABLE public.kyc_audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id),
  admin_id   UUID REFERENCES public.users(id),
  action     TEXT NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================== DISPUTE ========================

CREATE TABLE public.disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id    UUID NOT NULL REFERENCES public.transaksi(id),
  pelapor_id      UUID NOT NULL REFERENCES public.users(id),
  pelapor_role    user_role NOT NULL,
  terlapor_id     UUID NOT NULL REFERENCES public.users(id),
  kategori        dispute_category NOT NULL,
  deskripsi       TEXT NOT NULL,
  status          dispute_status DEFAULT 'diajukan',
  sla_deadline    TIMESTAMPTZ NOT NULL,
  resolusi        TEXT,
  kompensasi      DECIMAL(15,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.dispute_evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id  UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  tipe        evidence_type NOT NULL,
  url         TEXT NOT NULL,
  deskripsi   TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.dispute_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id  UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  aksi        TEXT NOT NULL,
  oleh        TEXT NOT NULL,
  catatan     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ======================== ONBOARDING ========================

CREATE TABLE public.onboarding_milestones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase      SMALLINT NOT NULL CHECK (phase BETWEEN 1 AND 3),
  nama       TEXT NOT NULL,
  deskripsi  TEXT,
  target     INT NOT NULL DEFAULT 1,
  current    INT NOT NULL DEFAULT 0,
  unit       TEXT NOT NULL DEFAULT 'item',
  status     onboarding_milestone_status DEFAULT 'belum',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.onboarding_checklist (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori  TEXT NOT NULL,
  item      TEXT NOT NULL,
  is_done   BOOLEAN DEFAULT false,
  pic       TEXT
);

-- ======================== SMART CATALOG ========================

CREATE TABLE public.katalog_komoditas (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poktan_id          UUID NOT NULL REFERENCES public.poktan(id),
  nama               TEXT NOT NULL,
  grade              komoditas_grade NOT NULL,
  harga_per_kg       DECIMAL(12,2) NOT NULL,
  volume_tersedia_kg DECIMAL(10,2) NOT NULL,
  wilayah            TEXT NOT NULL,
  jadwal_panen       DATE NOT NULL,
  skor_kualitas      DECIMAL(5,2) DEFAULT 0,
  skor_ketepatan     DECIMAL(5,2) DEFAULT 0,
  skor_volume        DECIMAL(5,2) DEFAULT 0,
  skor_harga         DECIMAL(5,2) DEFAULT 0,
  margin_persen      DECIMAL(5,2) DEFAULT 0,
  foto_url           TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ======================== SOP AGREEMENT TRACKING ========================

CREATE TABLE public.sop_agreements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id),
  sop_key    TEXT NOT NULL,
  agreed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sop_key)
);

-- ======================== ROW LEVEL SECURITY ========================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rekening           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poktan             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota_poktan     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_order          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontribusi_petani  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_inspeksi        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistik           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kredit             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cicilan_kredit     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pencairan          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomali_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_timeline   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.katalog_komoditas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_agreements     ENABLE ROW LEVEL SECURITY;

-- ======================== RLS POLICIES ========================

-- Helper: check admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check own poktan ketua
CREATE OR REPLACE FUNCTION public.my_poktan_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.poktan WHERE ketua_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check own supplier
CREATE OR REPLACE FUNCTION public.my_supplier_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.supplier WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- USERS
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (public.is_admin());

-- REKENING
CREATE POLICY "rekening_own" ON public.rekening
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "rekening_admin" ON public.rekening
  FOR SELECT USING (public.is_admin());

-- POKTAN
CREATE POLICY "poktan_select_members" ON public.poktan
  FOR SELECT USING (true);  -- poktan info is public within the platform
CREATE POLICY "poktan_manage_ketua" ON public.poktan
  FOR ALL USING (ketua_id = auth.uid());
CREATE POLICY "poktan_admin" ON public.poktan
  FOR ALL USING (public.is_admin());

-- ANGGOTA POKTAN
CREATE POLICY "anggota_select_own" ON public.anggota_poktan
  FOR SELECT USING (
    petani_id = auth.uid()
    OR poktan_id IN (SELECT public.my_poktan_ids())
  );
CREATE POLICY "anggota_manage_ketua" ON public.anggota_poktan
  FOR ALL USING (poktan_id IN (SELECT public.my_poktan_ids()));
CREATE POLICY "anggota_admin" ON public.anggota_poktan
  FOR ALL USING (public.is_admin());

-- SUPPLIER
CREATE POLICY "supplier_select_public" ON public.supplier
  FOR SELECT USING (true);  -- verified suppliers visible for matching
CREATE POLICY "supplier_manage_own" ON public.supplier
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "supplier_admin" ON public.supplier
  FOR ALL USING (public.is_admin());

-- PRE-ORDER
CREATE POLICY "preorder_select" ON public.pre_order
  FOR SELECT USING (
    supplier_id IN (SELECT public.my_supplier_ids())
    OR poktan_matched_id IN (SELECT public.my_poktan_ids())
    OR public.is_admin()
  );
CREATE POLICY "preorder_manage_supplier" ON public.pre_order
  FOR ALL USING (supplier_id IN (SELECT public.my_supplier_ids()));
CREATE POLICY "preorder_admin" ON public.pre_order
  FOR ALL USING (public.is_admin());

-- TRANSAKSI
CREATE POLICY "transaksi_select_poktan" ON public.transaksi
  FOR SELECT USING (poktan_id IN (SELECT public.my_poktan_ids()));
CREATE POLICY "transaksi_select_supplier" ON public.transaksi
  FOR SELECT USING (supplier_id IN (SELECT public.my_supplier_ids()));
CREATE POLICY "transaksi_admin" ON public.transaksi
  FOR ALL USING (public.is_admin());

-- KONTRIBUSI PETANI
CREATE POLICY "kontribusi_select_own" ON public.kontribusi_petani
  FOR SELECT USING (petani_id = auth.uid());
CREATE POLICY "kontribusi_select_ketua" ON public.kontribusi_petani
  FOR SELECT USING (
    transaksi_id IN (
      SELECT id FROM public.transaksi WHERE poktan_id IN (SELECT public.my_poktan_ids())
    )
  );
CREATE POLICY "kontribusi_admin" ON public.kontribusi_petani
  FOR ALL USING (public.is_admin());

-- QA INSPEKSI
CREATE POLICY "qa_select_poktan" ON public.qa_inspeksi
  FOR SELECT USING (poktan_id IN (SELECT public.my_poktan_ids()));
CREATE POLICY "qa_select_supplier" ON public.qa_inspeksi
  FOR SELECT USING (
    transaksi_id IN (
      SELECT id FROM public.transaksi WHERE supplier_id IN (SELECT public.my_supplier_ids())
    )
  );
CREATE POLICY "qa_manage_inspektor" ON public.qa_inspeksi
  FOR ALL USING (inspektor_id = auth.uid());
CREATE POLICY "qa_admin" ON public.qa_inspeksi
  FOR ALL USING (public.is_admin());

-- LOGISTIK
CREATE POLICY "logistik_select_parties" ON public.logistik
  FOR SELECT USING (
    transaksi_id IN (
      SELECT id FROM public.transaksi
      WHERE poktan_id IN (SELECT public.my_poktan_ids())
         OR supplier_id IN (SELECT public.my_supplier_ids())
    )
  );
CREATE POLICY "logistik_admin" ON public.logistik
  FOR ALL USING (public.is_admin());

-- KREDIT
CREATE POLICY "kredit_select_own" ON public.kredit
  FOR SELECT USING (petani_id = auth.uid());
CREATE POLICY "kredit_select_ketua" ON public.kredit
  FOR SELECT USING (poktan_id IN (SELECT public.my_poktan_ids()));
CREATE POLICY "kredit_admin" ON public.kredit
  FOR ALL USING (public.is_admin());

-- CICILAN KREDIT
CREATE POLICY "cicilan_select_own" ON public.cicilan_kredit
  FOR SELECT USING (
    kredit_id IN (SELECT id FROM public.kredit WHERE petani_id = auth.uid())
  );
CREATE POLICY "cicilan_admin" ON public.cicilan_kredit
  FOR ALL USING (public.is_admin());

-- PENCAIRAN
CREATE POLICY "pencairan_select_own" ON public.pencairan
  FOR SELECT USING (petani_id = auth.uid());
CREATE POLICY "pencairan_admin" ON public.pencairan
  FOR ALL USING (public.is_admin());

-- ANOMALI LOG
CREATE POLICY "anomali_select_ketua" ON public.anomali_log
  FOR SELECT USING (poktan_id IN (SELECT public.my_poktan_ids()));
CREATE POLICY "anomali_admin" ON public.anomali_log
  FOR ALL USING (public.is_admin());

-- NOTIFIKASI
CREATE POLICY "notif_own" ON public.notifikasi
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "notif_admin_insert" ON public.notifikasi
  FOR INSERT WITH CHECK (public.is_admin());

-- KYC DOCUMENTS
CREATE POLICY "kyc_docs_own" ON public.kyc_documents
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "kyc_docs_admin" ON public.kyc_documents
  FOR ALL USING (public.is_admin());

-- KYC SUBMISSIONS
CREATE POLICY "kyc_sub_own" ON public.kyc_submissions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "kyc_sub_admin" ON public.kyc_submissions
  FOR ALL USING (public.is_admin());

-- KYC SUBMISSION DOCUMENTS
CREATE POLICY "kyc_subdoc_own" ON public.kyc_submission_documents
  FOR SELECT USING (
    submission_id IN (SELECT id FROM public.kyc_submissions WHERE user_id = auth.uid())
  );
CREATE POLICY "kyc_subdoc_admin" ON public.kyc_submission_documents
  FOR ALL USING (public.is_admin());

-- KYC AUDIT LOG
CREATE POLICY "kyc_audit_admin" ON public.kyc_audit_log
  FOR SELECT USING (public.is_admin());
CREATE POLICY "kyc_audit_insert" ON public.kyc_audit_log
  FOR INSERT WITH CHECK (true);  -- service role inserts

-- DISPUTES
CREATE POLICY "dispute_select_parties" ON public.disputes
  FOR SELECT USING (
    pelapor_id = auth.uid() OR terlapor_id = auth.uid() OR public.is_admin()
  );
CREATE POLICY "dispute_insert_own" ON public.disputes
  FOR INSERT WITH CHECK (pelapor_id = auth.uid());
CREATE POLICY "dispute_admin" ON public.disputes
  FOR ALL USING (public.is_admin());

-- DISPUTE EVIDENCE
CREATE POLICY "evidence_select" ON public.dispute_evidence
  FOR SELECT USING (
    dispute_id IN (
      SELECT id FROM public.disputes
      WHERE pelapor_id = auth.uid() OR terlapor_id = auth.uid()
    )
    OR public.is_admin()
  );
CREATE POLICY "evidence_insert_own" ON public.dispute_evidence
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "evidence_admin" ON public.dispute_evidence
  FOR ALL USING (public.is_admin());

-- DISPUTE TIMELINE
CREATE POLICY "timeline_select" ON public.dispute_timeline
  FOR SELECT USING (
    dispute_id IN (
      SELECT id FROM public.disputes
      WHERE pelapor_id = auth.uid() OR terlapor_id = auth.uid()
    )
    OR public.is_admin()
  );
CREATE POLICY "timeline_admin" ON public.dispute_timeline
  FOR ALL USING (public.is_admin());

-- KATALOG KOMODITAS
CREATE POLICY "katalog_select_public" ON public.katalog_komoditas
  FOR SELECT USING (true);  -- catalog is visible to all authenticated users
CREATE POLICY "katalog_manage_ketua" ON public.katalog_komoditas
  FOR ALL USING (poktan_id IN (SELECT public.my_poktan_ids()));
CREATE POLICY "katalog_admin" ON public.katalog_komoditas
  FOR ALL USING (public.is_admin());

-- SOP AGREEMENTS
CREATE POLICY "sop_own" ON public.sop_agreements
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "sop_admin" ON public.sop_agreements
  FOR SELECT USING (public.is_admin());

-- ======================== INDEXES ========================

-- Transaksi
CREATE INDEX idx_transaksi_poktan ON public.transaksi(poktan_id);
CREATE INDEX idx_transaksi_supplier ON public.transaksi(supplier_id);
CREATE INDEX idx_transaksi_status ON public.transaksi(status);
CREATE INDEX idx_transaksi_created ON public.transaksi(created_at DESC);

-- Pre-order
CREATE INDEX idx_preorder_supplier ON public.pre_order(supplier_id);
CREATE INDEX idx_preorder_status ON public.pre_order(status);

-- Kontribusi
CREATE INDEX idx_kontribusi_petani ON public.kontribusi_petani(petani_id);
CREATE INDEX idx_kontribusi_transaksi ON public.kontribusi_petani(transaksi_id);

-- QA
CREATE INDEX idx_qa_transaksi ON public.qa_inspeksi(transaksi_id);
CREATE INDEX idx_qa_poktan ON public.qa_inspeksi(poktan_id);

-- Logistik
CREATE INDEX idx_logistik_transaksi ON public.logistik(transaksi_id);

-- Kredit
CREATE INDEX idx_kredit_petani ON public.kredit(petani_id);
CREATE INDEX idx_kredit_status ON public.kredit(status);

-- Pencairan
CREATE INDEX idx_pencairan_petani ON public.pencairan(petani_id);
CREATE INDEX idx_pencairan_status ON public.pencairan(status);

-- Anomali
CREATE INDEX idx_anomali_poktan ON public.anomali_log(poktan_id);
CREATE INDEX idx_anomali_risiko ON public.anomali_log(tingkat_risiko);

-- Harga
CREATE INDEX idx_harga_komoditas ON public.harga_historis(komoditas, wilayah, minggu);

-- Notifikasi
CREATE INDEX idx_notifikasi_user ON public.notifikasi(user_id, is_read);
CREATE INDEX idx_notifikasi_created ON public.notifikasi(created_at DESC);

-- KYC
CREATE INDEX idx_kyc_docs_user ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_sub_user ON public.kyc_submissions(user_id);
CREATE INDEX idx_kyc_sub_status ON public.kyc_submissions(status);
CREATE INDEX idx_kyc_audit_user ON public.kyc_audit_log(user_id);

-- Disputes
CREATE INDEX idx_disputes_transaksi ON public.disputes(transaksi_id);
CREATE INDEX idx_disputes_pelapor ON public.disputes(pelapor_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

-- Katalog
CREATE INDEX idx_katalog_poktan ON public.katalog_komoditas(poktan_id);
CREATE INDEX idx_katalog_nama ON public.katalog_komoditas(nama);
CREATE INDEX idx_katalog_wilayah ON public.katalog_komoditas(wilayah);

-- Rekening
CREATE INDEX idx_rekening_user ON public.rekening(user_id);

-- SOP
CREATE INDEX idx_sop_user ON public.sop_agreements(user_id);

-- ======================== STORAGE ========================

-- Create kyc-documents bucket (run in Supabase dashboard or via API)
-- NOTE: Storage buckets cannot be created via SQL migration.
-- Use the Supabase dashboard or the following API call:
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'kyc-documents',
--   'kyc-documents',
--   false,
--   5242880,  -- 5MB
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
-- );

-- Storage RLS
-- CREATE POLICY "kyc_storage_upload" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'kyc-documents'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
-- CREATE POLICY "kyc_storage_select_own" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'kyc-documents'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
-- CREATE POLICY "kyc_storage_admin" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'kyc-documents'
--     AND public.is_admin()
--   );

-- ======================== TRIGGERS ========================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.poktan
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.rekening
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pre_order
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.katalog_komoditas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
