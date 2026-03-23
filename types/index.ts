// ============ ENUMS ============
export type UserRole = 'petani' | 'ketua_poktan' | 'supplier' | 'admin'
export type KomoditasGrade = 'A' | 'B' | 'C'
export type StatusTransaksi =
  | 'draft' | 'menunggu_konfirmasi' | 'dikonfirmasi'
  | 'dalam_pengiriman' | 'tiba_di_gudang' | 'selesai' | 'dibatalkan' | 'sengketa'
export type StatusPreOrder = 'open' | 'matched' | 'confirmed' | 'fulfilled' | 'cancelled'
export type StatusQA = 'pending' | 'lulus' | 'gagal' | 'perlu_tinjauan'
export type TierLogistik = 'first_mile' | 'middle_mile' | 'last_mile'
export type StatusPengiriman = 'disiapkan' | 'dijemput' | 'dalam_perjalanan' | 'tiba_di_tujuan' | 'diterima'
export type StatusKredit = 'belum_ada' | 'pending' | 'disetujui' | 'ditolak' | 'aktif' | 'lunas'
export type TingkatRisiko = 'rendah' | 'sedang' | 'tinggi' | 'kritis'

// ============ DATABASE MODELS ============
export type MetodePencairan = 'bank' | 'ewallet'
export type StatusPencairan = 'diproses' | 'berhasil' | 'gagal'

export interface RekeningInfo {
  metode: MetodePencairan
  provider: string       // "BRI", "BCA", "GoPay", "OVO", "DANA", etc.
  nomor: string          // no rekening atau no HP e-wallet
  atas_nama: string
}

export interface Pencairan {
  id: string
  petani_id: string
  jumlah: number
  biaya_admin: number
  jumlah_diterima: number
  rekening: RekeningInfo
  status: StatusPencairan
  catatan?: string
  created_at: string
  selesai_at?: string
}

export type KYCStatus =
  | 'pending' | 'docs_incomplete' | 'docs_submitted' | 'docs_revision'
  | 'layer1_passed' | 'layer1_failed' | 'fully_verified' | 'suspended'

export interface User {
  id: string
  role: UserRole
  nama_lengkap: string
  no_hp: string
  no_ktp?: string
  foto_url?: string
  provinsi: string
  kabupaten: string
  kecamatan?: string
  alamat?: string
  is_verified: boolean
  is_active: boolean
  kyc_status?: KYCStatus
  rekening?: RekeningInfo
  created_at: string
  updated_at: string
}

export interface Poktan {
  id: string
  ketua_id: string
  nama_poktan: string
  kode_poktan: string
  desa: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  latitude?: number
  longitude?: number
  komoditas_utama: string[]
  jumlah_anggota: number
  skor_qa: number
  skor_ketepatan: number
  total_transaksi: number
  is_qa_certified: boolean
  tanggal_sertifikasi?: string
  status_sertifikasi: string
  created_at: string
  updated_at: string
}

export interface AnggotaPoktan {
  id: string
  poktan_id: string
  petani_id: string
  lahan_ha?: number
  komoditas: string[]
  status: string
  tanggal_bergabung: string
  petani?: User
}

export interface Supplier {
  id: string
  user_id: string
  nama_perusahaan: string
  npwp?: string
  jenis_usaha?: string
  kapasitas_bulanan_ton?: number
  wilayah_operasi: string[]
  deposit_escrow: number
  rating: number
  total_preorder: number
  is_verified: boolean
  created_at: string
  user?: User
}

export interface SupplierQAStep {
  id: string
  parameter: string
  kriteria: string
}

export interface PreOrder {
  id: string
  supplier_id: string
  komoditas: string
  grade: KomoditasGrade
  volume_kg: number
  harga_penawaran_per_kg: number
  tanggal_dibutuhkan: string
  wilayah_asal?: string
  wilayah_tujuan: string
  catatan_spesifikasi?: string
  catatan_kualitas_supplier?: string
  ai_qa_steps?: SupplierQAStep[]
  deposit_dibayar: number
  status: StatusPreOrder
  poktan_matched_id?: string
  ai_matching_result?: Record<string, unknown>
  created_at: string
  updated_at: string
  supplier?: Supplier
  poktan?: Poktan
}

export interface Transaksi {
  id: string
  pre_order_id?: string
  poktan_id: string
  supplier_id: string
  komoditas: string
  grade: KomoditasGrade
  volume_estimasi_kg: number
  volume_aktual_kg?: number
  harga_per_kg: number
  total_nilai?: number
  komisi_platform?: number
  status: StatusTransaksi
  tanggal_panen_estimasi?: string
  tanggal_serah_terima?: string
  catatan?: string
  settled_at?: string
  settled_by?: string
  created_at: string
  updated_at: string
  poktan?: Poktan
  supplier?: Supplier
}

export interface PencairanPoktan {
  id: string
  poktan_id: string
  jumlah: number
  biaya_admin: number
  jumlah_diterima: number
  rekening_id: string
  status: StatusPencairan
  catatan?: string
  created_at: string
  selesai_at?: string
  poktan?: Poktan
}

export interface KontribusiPetani {
  id: string
  transaksi_id: string
  petani_id: string
  volume_kg: number
  harga_diterima?: number
  status_bayar: string
  tanggal_bayar?: string
  petani?: User
  transaksi?: Transaksi
}

export interface QAInspeksi {
  id: string
  transaksi_id: string
  poktan_id: string
  inspektor_id: string
  jenis_inspektor: string
  komoditas: string
  volume_inspeksi_kg?: number
  grade_hasil?: KomoditasGrade
  skor_kualitas?: number
  foto_urls: string[]
  catatan_inspektor?: string
  status: StatusQA
  hasil_aktual?: Record<string, unknown>
  penyimpangan_persen?: number
  fee_qa: number
  fee_dibayar: number
  potongan_fee_persen: number
  grade_rekomendasi_sistem?: string
  grade_override_reason?: string
  supplier_review_status?: 'pending' | 'approved' | 'disputed'
  supplier_review_catatan?: string
  supplier_reviewed_at?: string
  created_at: string
}

export interface Logistik {
  id: string
  transaksi_id: string
  tier: TierLogistik
  transporter_nama?: string
  transporter_hp?: string
  kendaraan_plat?: string
  titik_asal: string
  titik_tujuan: string
  latitude_asal?: number
  longitude_asal?: number
  latitude_tujuan?: number
  longitude_tujuan?: number
  estimasi_tiba?: string
  aktual_tiba?: string
  status: string
  foto_muat_urls: string[]
  foto_tiba_urls: string[]
  last_update_posisi?: string
  last_update_at?: string
  asuransi_kargo: boolean
  biaya_logistik?: number
  created_at: string
}

export interface Pengiriman {
  id: string
  transaksi_id: string
  poktan_id: string
  supplier_id: string
  pengirim_nama?: string
  pengirim_telepon?: string
  kendaraan_info?: string
  alamat_asal: string
  alamat_tujuan: string
  current_status: StatusPengiriman
  disiapkan_at?: string
  dijemput_at?: string
  dalam_perjalanan_at?: string
  tiba_di_tujuan_at?: string
  diterima_at?: string
  catatan_alamat?: string
  created_at: string
  updated_at: string
  transaksi?: Transaksi
  poktan?: Poktan
  supplier?: Supplier
  events?: PengirimanEvent[]
}

export interface PengirimanEvent {
  id: string
  pengiriman_id: string
  status: StatusPengiriman
  catatan?: string
  foto_url?: string
  lokasi_teks?: string
  created_by: string
  created_at: string
  user?: User
}

export interface Kredit {
  id: string
  petani_id: string
  poktan_id?: string
  jumlah_diajukan: number
  jumlah_disetujui?: number
  tenor_bulan: number
  bunga_persen?: number
  status: StatusKredit
  ai_skor?: number
  ai_kategori?: string
  ai_result?: Record<string, unknown>
  tujuan_penggunaan?: string
  tanggal_pengajuan: string
  tanggal_keputusan?: string
  tanggal_jatuh_tempo?: string
  created_at: string
  petani?: User
}

export interface CicilanKredit {
  id: string
  kredit_id: string
  transaksi_id?: string
  nomor_cicilan: number
  jumlah_cicilan: number
  tanggal_jatuh_tempo: string
  tanggal_bayar?: string
  status: string
}

export interface AnomaliLog {
  id: string
  poktan_id: string
  tingkat_risiko: TingkatRisiko
  temuan: Record<string, unknown>
  rekomendasi?: string
  status_tindak_lanjut: string
  ditangani_oleh?: string
  catatan_admin?: string
  scanned_at: string
  resolved_at?: string
  poktan?: Poktan
}

export interface HargaHistoris {
  id: string
  komoditas: string
  wilayah: string
  harga_per_kg: number
  volume_total_kg?: number
  minggu: string
  created_at: string
}

export interface PrediksiHarga {
  id: string
  komoditas: string
  wilayah: string
  tren?: string
  estimasi_2_minggu?: Record<string, unknown>
  estimasi_4_minggu?: Record<string, unknown>
  faktor_penentu: string[]
  catatan_penting?: string
  valid_hingga?: string
  created_at: string
}

export interface Notifikasi {
  id: string
  user_id: string
  judul: string
  pesan: string
  tipe?: string
  link?: string
  is_read: boolean
  created_at: string
}

// ============ PEMBAYARAN ESCROW ============
export type StatusPembayaran = 'menunggu_pembayaran' | 'menunggu_verifikasi' | 'terverifikasi' | 'ditolak' | 'refunded'
export type JenisPembayaran = 'deposit' | 'full'

export interface PembayaranEscrow {
  id: string
  pre_order_id: string
  supplier_id: string
  jenis_pembayaran: JenisPembayaran
  jumlah: number
  total_nilai_po: number
  metode_transfer?: string
  bukti_transfer_url?: string
  catatan_supplier?: string
  status: StatusPembayaran
  admin_id?: string
  admin_catatan?: string
  verified_at?: string
  rejected_at?: string
  refunded_at?: string
  refund_catatan?: string
  created_at: string
  updated_at: string
  pre_order?: PreOrder
  supplier?: Supplier
}

// ============ UI / COMPONENT TYPES ============
export interface DashboardStats {
  totalAnggota: number
  transaksiAktif: number
  saldoFeeQA: number
  ratingQA: number
  totalTransaksiSelesai: number
}

export interface CreditScoreResponse {
  skor: number
  kategori: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Perhatian'
  batasKreditRp: number
  faktorPositif: string[]
  faktorRisiko: string[]
  rekomendasi: string
}

export interface MatchingResponse {
  ranking: Array<{
    poktanId: string
    namaPoktan: string
    skorKesesuaian: number
    alasan: string
    catatanRisiko: string | null
  }>
  rekomendasiUtama: string
  catatan: string | null
}

export interface NavItem {
  label: string
  href: string
  icon: string
}

// ============ KYC ============
export type TrustLevel = 'unverified' | 'baru' | 'terpercaya' | 'andalan' | 'bintang'
export type KYCLayerStatus = 'belum' | 'pending' | 'approved' | 'rejected' | 'revisi'

export interface KYCDocument {
  id: string
  nama: string
  status: KYCLayerStatus
  catatan?: string
  uploaded_at?: string
}

export interface KYCSubmission {
  id: string
  user_id: string
  user_nama: string
  user_role: UserRole
  layer: 1 | 2 | 3
  trust_level: TrustLevel
  documents: KYCDocument[]
  status: KYCLayerStatus
  reviewer_id?: string
  reviewer_catatan?: string
  submitted_at: string
  reviewed_at?: string
}

// ============ DISPUTE ============
export type DisputeCategory = 'kualitas' | 'keterlambatan' | 'volume' | 'pembayaran' | 'pembatalan'
export type DisputeStatus = 'diajukan' | 'investigasi' | 'mediasi' | 'eskalasi' | 'selesai'

export interface DisputeEvidence {
  id: string
  tipe: 'foto' | 'dokumen' | 'catatan'
  url: string
  deskripsi: string
  uploaded_by: string
  uploaded_at: string
}

export interface DisputeTimeline {
  id: string
  aksi: string
  oleh: string
  catatan?: string
  created_at: string
}

export interface Dispute {
  id: string
  transaksi_id: string
  pelapor_id: string
  pelapor_nama: string
  pelapor_role: UserRole
  terlapor_id: string
  terlapor_nama: string
  kategori: DisputeCategory
  deskripsi: string
  bukti: DisputeEvidence[]
  timeline: DisputeTimeline[]
  status: DisputeStatus
  sla_deadline: string
  resolusi?: string
  kompensasi?: number
  created_at: string
  updated_at: string
}

// ============ ONBOARDING ============
export type OnboardingPhase = 1 | 2 | 3
export type OnboardingMilestoneStatus = 'belum' | 'in_progress' | 'tercapai'

export interface OnboardingMilestone {
  id: string
  phase: OnboardingPhase
  nama: string
  deskripsi: string
  target: number
  current: number
  unit: string
  status: OnboardingMilestoneStatus
}

export interface OnboardingChecklist {
  id: string
  kategori: string
  item: string
  is_done: boolean
  pic?: string
}

// ============ CATATAN PANEN ============
export type StatusPanen = 'draft' | 'tersedia' | 'terjual' | 'expired'

export interface CatatanPanen {
  id: string
  poktan_id: string
  pencatat_id: string
  komoditas: string
  grade: KomoditasGrade
  volume_panen_kg: number
  volume_terjual_kg: number
  tanggal_panen: string
  harga_per_kg?: number
  foto_urls: string[]
  catatan?: string
  varietas?: string
  min_order_kg?: number
  kemasan?: string
  tersedia_sampai?: string
  metode_simpan?: string
  sertifikasi?: string
  status: StatusPanen
  published_at?: string
  created_at: string
  updated_at: string
  poktan?: Poktan
  kontribusi?: KontribusiPanen[]
}

export interface KontribusiPanen {
  id: string
  catatan_panen_id: string
  petani_id: string
  volume_kg: number
  created_at: string
  petani?: User
}

// ============ KOMODITAS CONFIG ============
export type ZonaKelayakan = 'antar_pulau' | 'cold_chain' | 'lokal_saja'

export interface KomoditasConfig {
  id: string
  nama: string
  kategori?: string
  zona: ZonaKelayakan
  daya_tahan_hari: number
  susut_persen: number
  perlu_cold_chain: boolean
  layak_antar_pulau: boolean
  harga_petani_ref?: number
  harga_jakarta_ref?: number
  biaya_kapal_ref?: number
  catatan?: string
  created_at: string
  updated_at: string
}

// ============ AI RESPONSE TYPES ============
export interface DisputeRecommendationResponse {
  rekomendasiResolusi: 'kompensasi' | 'tolak' | 'mediasi' | 'eskalasi'
  kompensasiSaran: number
  alasan: string
  preseden: string[]
  tingkatKepercayaan: 'tinggi' | 'sedang' | 'rendah'
}

export interface DashboardInsightResponse {
  ringkasan: string
  insights: Array<{ judul: string; deskripsi: string; prioritas: 'tinggi' | 'sedang' | 'rendah' }>
  peringatan: Array<{ judul: string; deskripsi: string }>
  rekomendasiAksi: Array<{ aksi: string; alasan: string; prioritas: 'tinggi' | 'sedang' | 'rendah' }>
}

// ============ SMART CATALOG ============
export interface KatalogKomoditas {
  id: string
  nama: string
  grade: KomoditasGrade
  harga_per_kg: number
  volume_tersedia_kg: number
  poktan_nama?: string
  poktan_id: string
  wilayah: string
  jadwal_panen: string
  skor_kualitas: number
  skor_ketepatan: number
  skor_volume: number
  skor_harga: number
  margin_persen: number
  foto_url?: string
  catatan_panen_id?: string
  varietas?: string
  min_order_kg?: number
  kemasan?: string
  tersedia_sampai?: string
  metode_simpan?: string
  sertifikasi?: string
  poktan?: {
    id: string
    nama_poktan: string
    kabupaten: string
    provinsi: string
  } | null
  catatan_panen?: {
    foto_urls: string[]
    catatan?: string
    tanggal_panen: string
  } | null
}
