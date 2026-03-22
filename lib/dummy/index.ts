import type {
  User, Poktan, AnggotaPoktan, Supplier, PreOrder, Transaksi,
  KontribusiPetani, QAInspeksi, Logistik, Kredit, CicilanKredit,
  AnomaliLog, HargaHistoris, Notifikasi, PrediksiHarga, Pencairan,
  KYCSubmission, Dispute, OnboardingMilestone, OnboardingChecklist, KatalogKomoditas,
} from '@/types'

// ============ USERS ============
export const dummyUsers: User[] = [
  {
    id: 'u-ketua-01',
    role: 'ketua_poktan',
    nama_lengkap: 'Pak Surya Wijaya',
    no_hp: '081234567890',
    no_ktp: '3201011234567890',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    alamat: 'Jl. Raya Lembang No. 45',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-petani-01',
    role: 'petani',
    nama_lengkap: 'Ahmad Hidayat',
    no_hp: '081234567891',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    is_verified: true,
    is_active: true,
    rekening: {
      metode: 'bank',
      provider: 'BRI',
      nomor: '0012-01-012345-56-7',
      atas_nama: 'AHMAD HIDAYAT',
    },
    created_at: '2025-02-01T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-petani-02',
    role: 'petani',
    nama_lengkap: 'Siti Aminah',
    no_hp: '081234567892',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    is_verified: true,
    is_active: true,
    created_at: '2025-02-10T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-petani-03',
    role: 'petani',
    nama_lengkap: 'Budi Santoso',
    no_hp: '081234567893',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Cisarua',
    is_verified: true,
    is_active: true,
    created_at: '2025-03-01T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-petani-04',
    role: 'petani',
    nama_lengkap: 'Dewi Lestari',
    no_hp: '081234567894',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    is_verified: true,
    is_active: true,
    created_at: '2025-03-15T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-petani-05',
    role: 'petani',
    nama_lengkap: 'Eko Prasetyo',
    no_hp: '081234567895',
    provinsi: 'Jawa Barat',
    kabupaten: 'Bandung',
    kecamatan: 'Lembang',
    is_verified: false,
    is_active: true,
    created_at: '2025-04-01T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-supplier-01',
    role: 'supplier',
    nama_lengkap: 'Rini Hartono',
    no_hp: '081234567896',
    provinsi: 'DKI Jakarta',
    kabupaten: 'Jakarta Selatan',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-20T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-supplier-02',
    role: 'supplier',
    nama_lengkap: 'Hendro Wibowo',
    no_hp: '081234567897',
    provinsi: 'Jawa Timur',
    kabupaten: 'Surabaya',
    is_verified: true,
    is_active: true,
    created_at: '2025-02-05T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'u-admin-01',
    role: 'admin',
    nama_lengkap: 'Admin taninesia',
    no_hp: '081200000001',
    provinsi: 'DKI Jakarta',
    kabupaten: 'Jakarta Pusat',
    is_verified: true,
    is_active: true,
    created_at: '2025-01-01T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
]

// ============ POKTAN ============
export const dummyPoktan: Poktan[] = [
  {
    id: 'pk-01',
    ketua_id: 'u-ketua-01',
    nama_poktan: 'Poktan Mekar Tani',
    kode_poktan: 'PKT-JB-001',
    desa: 'Lembang',
    kecamatan: 'Lembang',
    kabupaten: 'Bandung',
    provinsi: 'Jawa Barat',
    latitude: -6.8115,
    longitude: 107.6168,
    komoditas_utama: ['Tomat', 'Cabai Merah', 'Kubis', 'Wortel'],
    jumlah_anggota: 5,
    skor_qa: 87.5,
    skor_ketepatan: 92.0,
    total_transaksi: 24,
    is_qa_certified: true,
    tanggal_sertifikasi: '2025-03-01T00:00:00Z',
    status_sertifikasi: 'aktif',
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'pk-02',
    ketua_id: 'u-petani-03',
    nama_poktan: 'Poktan Sari Bumi',
    kode_poktan: 'PKT-JB-002',
    desa: 'Cisarua',
    kecamatan: 'Cisarua',
    kabupaten: 'Bandung',
    provinsi: 'Jawa Barat',
    latitude: -6.7855,
    longitude: 107.5775,
    komoditas_utama: ['Kentang', 'Kubis', 'Brokoli'],
    jumlah_anggota: 8,
    skor_qa: 78.0,
    skor_ketepatan: 85.0,
    total_transaksi: 16,
    is_qa_certified: true,
    tanggal_sertifikasi: '2025-04-01T00:00:00Z',
    status_sertifikasi: 'aktif',
    created_at: '2025-02-01T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'pk-03',
    ketua_id: 'u-petani-05',
    nama_poktan: 'Poktan Maju Jaya',
    kode_poktan: 'PKT-JT-001',
    desa: 'Batu',
    kecamatan: 'Batu',
    kabupaten: 'Malang',
    provinsi: 'Jawa Timur',
    latitude: -7.8672,
    longitude: 112.5239,
    komoditas_utama: ['Bawang Merah', 'Cabai Rawit', 'Tomat'],
    jumlah_anggota: 12,
    skor_qa: 65.0,
    skor_ketepatan: 70.0,
    total_transaksi: 8,
    is_qa_certified: false,
    status_sertifikasi: 'belum',
    created_at: '2025-03-01T08:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
]

// ============ ANGGOTA POKTAN ============
export const dummyAnggotaPoktan: AnggotaPoktan[] = [
  { id: 'ap-01', poktan_id: 'pk-01', petani_id: 'u-petani-01', lahan_ha: 1.5, komoditas: ['Tomat', 'Cabai Merah'], status: 'aktif', tanggal_bergabung: '2025-02-01T08:00:00Z' },
  { id: 'ap-02', poktan_id: 'pk-01', petani_id: 'u-petani-02', lahan_ha: 2.0, komoditas: ['Kubis', 'Wortel'], status: 'aktif', tanggal_bergabung: '2025-02-10T08:00:00Z' },
  { id: 'ap-03', poktan_id: 'pk-01', petani_id: 'u-petani-04', lahan_ha: 0.8, komoditas: ['Tomat'], status: 'aktif', tanggal_bergabung: '2025-03-15T08:00:00Z' },
  { id: 'ap-04', poktan_id: 'pk-01', petani_id: 'u-petani-05', lahan_ha: 1.2, komoditas: ['Cabai Merah', 'Cabai Rawit'], status: 'aktif', tanggal_bergabung: '2025-04-01T08:00:00Z' },
  { id: 'ap-05', poktan_id: 'pk-01', petani_id: 'u-petani-03', lahan_ha: 3.0, komoditas: ['Kubis', 'Kentang', 'Wortel'], status: 'aktif', tanggal_bergabung: '2025-03-01T08:00:00Z' },
]

// ============ SUPPLIERS ============
export const dummySuppliers: Supplier[] = [
  {
    id: 'sp-01',
    user_id: 'u-supplier-01',
    nama_perusahaan: 'PT Segar Nusantara',
    npwp: '01.234.567.8-012.000',
    jenis_usaha: 'Distributor Hortikultura',
    kapasitas_bulanan_ton: 50,
    wilayah_operasi: ['Jawa Barat', 'DKI Jakarta', 'Banten'],
    deposit_escrow: 25000000,
    rating: 4.6,
    total_preorder: 18,
    is_verified: true,
    created_at: '2025-01-20T08:00:00Z',
  },
  {
    id: 'sp-02',
    user_id: 'u-supplier-02',
    nama_perusahaan: 'CV Mitra Pangan Timur',
    npwp: '02.345.678.9-345.000',
    jenis_usaha: 'Restoran & Katering',
    kapasitas_bulanan_ton: 20,
    wilayah_operasi: ['Jawa Timur', 'Jawa Tengah'],
    deposit_escrow: 12000000,
    rating: 4.3,
    total_preorder: 12,
    is_verified: true,
    created_at: '2025-02-05T08:00:00Z',
  },
]

// ============ PRE-ORDERS ============
export const dummyPreOrders: PreOrder[] = [
  {
    id: 'po-01',
    supplier_id: 'sp-01',
    komoditas: 'Tomat',
    grade: 'A',
    volume_kg: 5000,
    harga_penawaran_per_kg: 12000,
    tanggal_dibutuhkan: '2026-04-15',
    wilayah_asal: 'Jawa Barat',
    wilayah_tujuan: 'DKI Jakarta',
    catatan_spesifikasi: 'Tomat segar, ukuran sedang-besar, warna merah merata',
    catatan_kualitas_supplier: 'Tomat harus firm, tidak boleh ada yang lembek saat ditekan. Tangkai harus masih hijau segar, menandakan baru dipetik maksimal 2 hari.',
    ai_qa_steps: [
      { id: 'sq-01', parameter: 'Kekerasan buah (firmness)', kriteria: 'Buah tidak boleh penyok saat ditekan lembut dengan ibu jari. Toleransi maks 5% buah lembek per batch sampel.' },
      { id: 'sq-02', parameter: 'Kesegaran tangkai', kriteria: 'Tangkai (calyx) berwarna hijau segar, tidak layu atau menguning. Menandakan panen maksimal 48 jam sebelum inspeksi.' },
    ],
    deposit_dibayar: 6000000,
    status: 'open',
    created_at: '2026-03-18T08:00:00Z',
    updated_at: '2026-03-18T08:00:00Z',
  },
  {
    id: 'po-02',
    supplier_id: 'sp-01',
    komoditas: 'Cabai Merah',
    grade: 'A',
    volume_kg: 2000,
    harga_penawaran_per_kg: 45000,
    tanggal_dibutuhkan: '2026-04-10',
    wilayah_tujuan: 'DKI Jakarta',
    catatan_kualitas_supplier: 'Cabai harus merah sempurna tanpa bercak hitam. Tingkat kepedasan harus konsisten, jangan campur cabai muda.',
    ai_qa_steps: [
      { id: 'sq-03', parameter: 'Keseragaman warna merah', kriteria: 'Seluruh batch cabai berwarna merah tua merata, tanpa bercak hitam, coklat, atau area hijau. Toleransi maks 3% buah tidak seragam.' },
      { id: 'sq-04', parameter: 'Kematangan konsisten', kriteria: 'Tidak ada cabai muda (hijau/oranye) tercampur. Semua buah harus matang penuh dengan tekstur kulit halus mengkilap.' },
    ],
    deposit_dibayar: 9000000,
    status: 'matched',
    poktan_matched_id: 'pk-01',
    created_at: '2026-03-15T08:00:00Z',
    updated_at: '2026-03-17T10:00:00Z',
  },
  {
    id: 'po-03',
    supplier_id: 'sp-02',
    komoditas: 'Kubis',
    grade: 'B',
    volume_kg: 8000,
    harga_penawaran_per_kg: 6000,
    tanggal_dibutuhkan: '2026-04-20',
    wilayah_tujuan: 'Jawa Timur',
    deposit_dibayar: 4800000,
    status: 'confirmed',
    poktan_matched_id: 'pk-02',
    created_at: '2026-03-10T08:00:00Z',
    updated_at: '2026-03-16T10:00:00Z',
  },
  {
    id: 'po-04',
    supplier_id: 'sp-02',
    komoditas: 'Kentang',
    grade: 'A',
    volume_kg: 3000,
    harga_penawaran_per_kg: 15000,
    tanggal_dibutuhkan: '2026-05-01',
    wilayah_tujuan: 'Jawa Timur',
    catatan_spesifikasi: 'Kentang granola, ukuran besar',
    deposit_dibayar: 0,
    status: 'open',
    created_at: '2026-03-20T08:00:00Z',
    updated_at: '2026-03-20T08:00:00Z',
  },
  {
    id: 'po-05',
    supplier_id: 'sp-01',
    komoditas: 'Wortel',
    grade: 'A',
    volume_kg: 3000,
    harga_penawaran_per_kg: 10000,
    tanggal_dibutuhkan: '2026-04-25',
    wilayah_tujuan: 'DKI Jakarta',
    deposit_dibayar: 3000000,
    status: 'fulfilled',
    poktan_matched_id: 'pk-01',
    created_at: '2026-02-20T08:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
  },
]

// ============ TRANSAKSI ============
export const dummyTransaksi: Transaksi[] = [
  {
    id: 'tx-01',
    pre_order_id: 'po-02',
    poktan_id: 'pk-01',
    supplier_id: 'sp-01',
    komoditas: 'Cabai Merah',
    grade: 'A',
    volume_estimasi_kg: 2000,
    harga_per_kg: 45000,
    total_nilai: 90000000,
    komisi_platform: 1800000,
    status: 'dikonfirmasi',
    tanggal_panen_estimasi: '2026-04-05',
    created_at: '2026-03-17T10:00:00Z',
    updated_at: '2026-03-17T10:00:00Z',
  },
  {
    id: 'tx-02',
    pre_order_id: 'po-03',
    poktan_id: 'pk-02',
    supplier_id: 'sp-02',
    komoditas: 'Kubis',
    grade: 'B',
    volume_estimasi_kg: 8000,
    volume_aktual_kg: 7850,
    harga_per_kg: 6000,
    total_nilai: 47100000,
    komisi_platform: 942000,
    status: 'dalam_pengiriman',
    tanggal_panen_estimasi: '2026-03-25',
    created_at: '2026-03-16T10:00:00Z',
    updated_at: '2026-03-20T14:00:00Z',
  },
  {
    id: 'tx-03',
    pre_order_id: 'po-05',
    poktan_id: 'pk-01',
    supplier_id: 'sp-01',
    komoditas: 'Wortel',
    grade: 'A',
    volume_estimasi_kg: 3000,
    volume_aktual_kg: 2950,
    harga_per_kg: 10000,
    total_nilai: 29500000,
    komisi_platform: 590000,
    status: 'selesai',
    tanggal_panen_estimasi: '2026-03-01',
    tanggal_serah_terima: '2026-03-08T16:00:00Z',
    created_at: '2026-02-25T10:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'tx-04',
    poktan_id: 'pk-01',
    supplier_id: 'sp-02',
    komoditas: 'Tomat',
    grade: 'A',
    volume_estimasi_kg: 4000,
    volume_aktual_kg: 3900,
    harga_per_kg: 11000,
    total_nilai: 42900000,
    komisi_platform: 858000,
    status: 'selesai',
    tanggal_serah_terima: '2026-02-20T10:00:00Z',
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-02-20T10:00:00Z',
  },
  {
    id: 'tx-05',
    poktan_id: 'pk-01',
    supplier_id: 'sp-01',
    komoditas: 'Cabai Merah',
    grade: 'B',
    volume_estimasi_kg: 1500,
    volume_aktual_kg: 1480,
    harga_per_kg: 38000,
    total_nilai: 56240000,
    komisi_platform: 1124800,
    status: 'selesai',
    tanggal_serah_terima: '2026-01-28T10:00:00Z',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-28T10:00:00Z',
  },
]

// ============ KONTRIBUSI PETANI ============
export const dummyKontribusi: KontribusiPetani[] = [
  { id: 'kp-01', transaksi_id: 'tx-01', petani_id: 'u-petani-01', volume_kg: 800, harga_diterima: 35280000, status_bayar: 'pending' },
  { id: 'kp-02', transaksi_id: 'tx-01', petani_id: 'u-petani-04', volume_kg: 500, harga_diterima: 22050000, status_bayar: 'pending' },
  { id: 'kp-03', transaksi_id: 'tx-01', petani_id: 'u-petani-05', volume_kg: 700, harga_diterima: 30870000, status_bayar: 'pending' },
  { id: 'kp-04', transaksi_id: 'tx-03', petani_id: 'u-petani-02', volume_kg: 1500, harga_diterima: 14700000, status_bayar: 'dibayar', tanggal_bayar: '2026-03-12T10:00:00Z' },
  { id: 'kp-05', transaksi_id: 'tx-03', petani_id: 'u-petani-03', volume_kg: 1450, harga_diterima: 14210000, status_bayar: 'dibayar', tanggal_bayar: '2026-03-12T10:00:00Z' },
  { id: 'kp-06', transaksi_id: 'tx-04', petani_id: 'u-petani-01', volume_kg: 2000, harga_diterima: 21560000, status_bayar: 'dibayar', tanggal_bayar: '2026-02-25T10:00:00Z' },
  { id: 'kp-07', transaksi_id: 'tx-04', petani_id: 'u-petani-04', volume_kg: 1900, harga_diterima: 20482000, status_bayar: 'dibayar', tanggal_bayar: '2026-02-25T10:00:00Z' },
  { id: 'kp-08', transaksi_id: 'tx-05', petani_id: 'u-petani-01', volume_kg: 750, harga_diterima: 27930000, status_bayar: 'dibayar', tanggal_bayar: '2026-02-01T10:00:00Z' },
  { id: 'kp-09', transaksi_id: 'tx-05', petani_id: 'u-petani-05', volume_kg: 730, harga_diterima: 27186000, status_bayar: 'dibayar', tanggal_bayar: '2026-02-01T10:00:00Z' },
]

// ============ QA INSPEKSI ============
export const dummyQAInspeksi: QAInspeksi[] = [
  {
    id: 'qa-01',
    transaksi_id: 'tx-01',
    poktan_id: 'pk-01',
    inspektor_id: 'u-ketua-01',
    jenis_inspektor: 'ketua_poktan',
    komoditas: 'Cabai Merah',
    volume_inspeksi_kg: 2000,
    status: 'pending',
    foto_urls: [],
    fee_qa: 900000,
    fee_dibayar: 0,
    potongan_fee_persen: 0,
    created_at: '2026-03-19T08:00:00Z',
  },
  {
    id: 'qa-02',
    transaksi_id: 'tx-02',
    poktan_id: 'pk-02',
    inspektor_id: 'u-petani-03',
    jenis_inspektor: 'ketua_poktan',
    komoditas: 'Kubis',
    volume_inspeksi_kg: 7850,
    grade_hasil: 'B',
    skor_kualitas: 82,
    foto_urls: ['/demo/qa-kubis-1.jpg', '/demo/qa-kubis-2.jpg', '/demo/qa-kubis-3.jpg'],
    catatan_inspektor: 'Kualitas baik, sedikit daun luar yang perlu dipotong',
    status: 'lulus',
    grade_rekomendasi_sistem: 'Mutu II (Standar)',
    supplier_review_status: 'approved',
    supplier_reviewed_at: '2026-03-19T14:00:00Z',
    penyimpangan_persen: 1.9,
    fee_qa: 471000,
    fee_dibayar: 471000,
    potongan_fee_persen: 0,
    created_at: '2026-03-19T10:00:00Z',
  },
  {
    id: 'qa-03',
    transaksi_id: 'tx-03',
    poktan_id: 'pk-01',
    inspektor_id: 'u-ketua-01',
    jenis_inspektor: 'ketua_poktan',
    komoditas: 'Wortel',
    volume_inspeksi_kg: 2950,
    grade_hasil: 'A',
    skor_kualitas: 91,
    foto_urls: ['/demo/qa-wortel-1.jpg', '/demo/qa-wortel-2.jpg', '/demo/qa-wortel-3.jpg'],
    catatan_inspektor: 'Wortel segar, ukuran seragam, warna oranye cerah',
    status: 'lulus',
    grade_rekomendasi_sistem: 'Mutu I (Super)',
    supplier_review_status: 'approved',
    supplier_reviewed_at: '2026-03-06T10:00:00Z',
    penyimpangan_persen: 1.7,
    fee_qa: 295000,
    fee_dibayar: 295000,
    potongan_fee_persen: 0,
    created_at: '2026-03-05T08:00:00Z',
  },
  {
    id: 'qa-04',
    transaksi_id: 'tx-04',
    poktan_id: 'pk-01',
    inspektor_id: 'u-ketua-01',
    jenis_inspektor: 'ketua_poktan',
    komoditas: 'Tomat',
    volume_inspeksi_kg: 3900,
    grade_hasil: 'A',
    skor_kualitas: 88,
    foto_urls: ['/demo/qa-tomat-1.jpg', '/demo/qa-tomat-2.jpg', '/demo/qa-tomat-3.jpg'],
    catatan_inspektor: 'Tomat segar berkualitas, 2 parameter non-wajib gagal tapi masih dalam batas Mutu II',
    status: 'perlu_tinjauan',
    grade_rekomendasi_sistem: 'Mutu II (Standar)',
    supplier_review_status: 'pending',
    fee_qa: 429000,
    fee_dibayar: 0,
    potongan_fee_persen: 0,
    created_at: '2026-03-21T09:00:00Z',
  },
  {
    id: 'qa-05',
    transaksi_id: 'tx-05',
    poktan_id: 'pk-01',
    inspektor_id: 'u-ketua-01',
    jenis_inspektor: 'ketua_poktan',
    komoditas: 'Cabai Merah',
    volume_inspeksi_kg: 1480,
    grade_hasil: 'B',
    skor_kualitas: 85,
    foto_urls: ['/demo/qa-cabai-1.jpg', '/demo/qa-cabai-2.jpg', '/demo/qa-cabai-3.jpg'],
    catatan_inspektor: 'Kualitas cabai baik, warna merah merata, sedikit cacat mekanis',
    status: 'perlu_tinjauan',
    grade_rekomendasi_sistem: 'Kelas Merah (Premium)',
    grade_override_reason: 'Ada beberapa buah dengan cacat mekanis ringan, lebih cocok grade B',
    supplier_review_status: 'pending',
    fee_qa: 562400,
    fee_dibayar: 0,
    potongan_fee_persen: 0,
    created_at: '2026-03-20T11:00:00Z',
  },
]

// ============ LOGISTIK ============
export const dummyLogistik: Logistik[] = [
  {
    id: 'lg-01',
    transaksi_id: 'tx-02',
    tier: 'first_mile',
    transporter_nama: 'Pak Dedi',
    transporter_hp: '081299887766',
    kendaraan_plat: 'D 1234 AB',
    titik_asal: 'Poktan Sari Bumi, Cisarua',
    titik_tujuan: 'Gudang Transit Bandung',
    latitude_asal: -6.7855,
    longitude_asal: 107.5775,
    latitude_tujuan: -6.9175,
    longitude_tujuan: 107.6191,
    estimasi_tiba: '2026-03-21T14:00:00Z',
    status: 'dalam_perjalanan',
    foto_muat_urls: ['/demo/muat-kubis-1.jpg'],
    foto_tiba_urls: [],
    last_update_posisi: 'Melewati Padalarang',
    last_update_at: '2026-03-21T11:30:00Z',
    asuransi_kargo: true,
    biaya_logistik: 1500000,
    created_at: '2026-03-20T16:00:00Z',
  },
  {
    id: 'lg-02',
    transaksi_id: 'tx-02',
    tier: 'middle_mile',
    transporter_nama: 'PT Logistik Cepat',
    transporter_hp: '02187654321',
    titik_asal: 'Gudang Transit Bandung',
    titik_tujuan: 'Gudang Supplier Surabaya',
    latitude_asal: -6.9175,
    longitude_asal: 107.6191,
    latitude_tujuan: -7.2575,
    longitude_tujuan: 112.7521,
    status: 'menunggu_muat',
    foto_muat_urls: [],
    foto_tiba_urls: [],
    asuransi_kargo: true,
    biaya_logistik: 4500000,
    created_at: '2026-03-20T16:00:00Z',
  },
]

// ============ KREDIT ============
export const dummyKredit: Kredit[] = [
  {
    id: 'kr-01',
    petani_id: 'u-petani-01',
    poktan_id: 'pk-01',
    jumlah_diajukan: 5000000,
    jumlah_disetujui: 5000000,
    tenor_bulan: 6,
    bunga_persen: 0.5,
    status: 'aktif',
    ai_skor: 82,
    ai_kategori: 'Baik',
    tujuan_penggunaan: 'Pembelian bibit cabai dan pupuk organik',
    tanggal_pengajuan: '2026-02-01T08:00:00Z',
    tanggal_keputusan: '2026-02-03T10:00:00Z',
    tanggal_jatuh_tempo: '2026-08-01',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'kr-02',
    petani_id: 'u-petani-02',
    poktan_id: 'pk-01',
    jumlah_diajukan: 8000000,
    tenor_bulan: 4,
    status: 'pending',
    ai_skor: 68,
    ai_kategori: 'Cukup',
    tujuan_penggunaan: 'Sewa alat bajak dan pembelian pupuk',
    tanggal_pengajuan: '2026-03-18T08:00:00Z',
    created_at: '2026-03-18T08:00:00Z',
  },
]

// ============ CICILAN KREDIT ============
export const dummyCicilan: CicilanKredit[] = [
  { id: 'cc-01', kredit_id: 'kr-01', nomor_cicilan: 1, jumlah_cicilan: 858333, tanggal_jatuh_tempo: '2026-03-01', tanggal_bayar: '2026-02-28T10:00:00Z', status: 'lunas' },
  { id: 'cc-02', kredit_id: 'kr-01', nomor_cicilan: 2, jumlah_cicilan: 858333, tanggal_jatuh_tempo: '2026-04-01', status: 'belum_bayar' },
  { id: 'cc-03', kredit_id: 'kr-01', nomor_cicilan: 3, jumlah_cicilan: 858333, tanggal_jatuh_tempo: '2026-05-01', status: 'belum_bayar' },
  { id: 'cc-04', kredit_id: 'kr-01', nomor_cicilan: 4, jumlah_cicilan: 858333, tanggal_jatuh_tempo: '2026-06-01', status: 'belum_bayar' },
  { id: 'cc-05', kredit_id: 'kr-01', nomor_cicilan: 5, jumlah_cicilan: 858333, tanggal_jatuh_tempo: '2026-07-01', status: 'belum_bayar' },
  { id: 'cc-06', kredit_id: 'kr-01', nomor_cicilan: 6, jumlah_cicilan: 858335, tanggal_jatuh_tempo: '2026-08-01', status: 'belum_bayar' },
]

// ============ ANOMALI LOG ============
export const dummyAnomali: AnomaliLog[] = [
  {
    id: 'an-01',
    poktan_id: 'pk-03',
    tingkat_risiko: 'tinggi',
    temuan: {
      kategori: 'A02',
      deskripsi: 'Volume aktual konsisten 25% lebih rendah dari estimasi dalam 3 transaksi terakhir',
      data: { avg_deviasi: 25.3, transaksi_count: 3 },
    },
    rekomendasi: 'Investigasi lahan dan metode estimasi poktan. Pertimbangkan pelatihan QA.',
    status_tindak_lanjut: 'open',
    scanned_at: '2026-03-20T06:00:00Z',
  },
  {
    id: 'an-02',
    poktan_id: 'pk-03',
    tingkat_risiko: 'sedang',
    temuan: {
      kategori: 'A04',
      deskripsi: 'Skor QA turun dari 78 ke 65 dalam 2 bulan terakhir',
      data: { skor_sebelum: 78, skor_sekarang: 65 },
    },
    rekomendasi: 'Review proses QA internal poktan.',
    status_tindak_lanjut: 'open',
    scanned_at: '2026-03-19T06:00:00Z',
  },
  {
    id: 'an-03',
    poktan_id: 'pk-02',
    tingkat_risiko: 'rendah',
    temuan: {
      kategori: 'A05',
      deskripsi: 'Keterlambatan pengiriman 2 hari pada transaksi terakhir',
      data: { hari_terlambat: 2, transaksi_id: 'tx-old-01' },
    },
    rekomendasi: 'Monitor, kemungkinan karena cuaca buruk.',
    status_tindak_lanjut: 'selesai',
    ditangani_oleh: 'u-admin-01',
    catatan_admin: 'Terverifikasi karena banjir di rute pengiriman. Cleared.',
    scanned_at: '2026-03-10T06:00:00Z',
    resolved_at: '2026-03-11T10:00:00Z',
  },
]

// ============ HARGA HISTORIS ============
function generateHargaHistoris(): HargaHistoris[] {
  const data: HargaHistoris[] = []
  const items = [
    { komoditas: 'Tomat', base: 10000, volatility: 3000 },
    { komoditas: 'Cabai Merah', base: 40000, volatility: 15000 },
    { komoditas: 'Kubis', base: 5500, volatility: 1500 },
    { komoditas: 'Wortel', base: 9000, volatility: 2000 },
    { komoditas: 'Kentang', base: 13000, volatility: 3000 },
    { komoditas: 'Bawang Merah', base: 30000, volatility: 10000 },
  ]

  let id = 0
  for (const item of items) {
    for (let week = 12; week >= 0; week--) {
      const date = new Date()
      date.setDate(date.getDate() - week * 7)
      const monday = new Date(date)
      monday.setDate(monday.getDate() - monday.getDay() + 1)

      const variation = (Math.sin(week * 0.8) * item.volatility * 0.5) +
        ((Math.random() - 0.5) * item.volatility * 0.3)

      data.push({
        id: `hh-${++id}`,
        komoditas: item.komoditas,
        wilayah: 'Jawa Barat',
        harga_per_kg: Math.round(item.base + variation),
        volume_total_kg: Math.round(5000 + Math.random() * 15000),
        minggu: monday.toISOString().split('T')[0],
        created_at: monday.toISOString(),
      })
    }
  }
  return data
}

export const dummyHargaHistoris: HargaHistoris[] = generateHargaHistoris()

// ============ PREDIKSI HARGA ============
export const dummyPrediksiHarga: PrediksiHarga[] = [
  {
    id: 'ph-01',
    komoditas: 'Cabai Merah',
    wilayah: 'Jawa Barat',
    tren: 'naik',
    estimasi_2_minggu: { min: 42000, max: 50000, median: 46000 },
    estimasi_4_minggu: { min: 38000, max: 55000, median: 48000 },
    faktor_penentu: ['Cuaca hujan tinggi', 'Permintaan Ramadan', 'Stok menurun'],
    catatan_penting: 'Harga cabai cenderung naik menjelang Ramadan. Disarankan untuk mengamankan stok sekarang.',
    valid_hingga: '2026-03-28',
    created_at: '2026-03-21T06:00:00Z',
  },
]

// ============ NOTIFIKASI ============
export const dummyNotifikasi: Notifikasi[] = [
  { id: 'nf-01', user_id: 'u-ketua-01', judul: 'Pre-Order Baru', pesan: 'Ada pre-order Tomat 5 ton dari PT Segar Nusantara yang cocok dengan poktan Anda', tipe: 'preorder', link: '/poktan/pre-order', is_read: false, created_at: '2026-03-21T08:00:00Z' },
  { id: 'nf-02', user_id: 'u-ketua-01', judul: 'QA Diperlukan', pesan: 'Transaksi TX-01 Cabai Merah menunggu inspeksi QA dari Anda', tipe: 'qa', link: '/poktan/qa', is_read: false, created_at: '2026-03-20T14:00:00Z' },
  { id: 'nf-03', user_id: 'u-ketua-01', judul: 'Pengiriman Diupdate', pesan: 'Kubis sedang dalam perjalanan ke Gudang Transit Bandung', tipe: 'logistik', link: '/poktan/logistik', is_read: true, created_at: '2026-03-20T11:30:00Z' },
  { id: 'nf-04', user_id: 'u-ketua-01', judul: 'Pembayaran Diterima', pesan: 'Pembayaran untuk transaksi Wortel telah masuk ke akun poktan', tipe: 'pembayaran', link: '/poktan/dashboard', is_read: true, created_at: '2026-03-12T10:00:00Z' },
  { id: 'nf-05', user_id: 'u-supplier-01', judul: 'Poktan Matched', pesan: 'Pre-order Cabai Merah Anda telah di-match dengan Poktan Mekar Tani', tipe: 'matching', link: '/supplier/pre-order/po-02', is_read: false, created_at: '2026-03-17T10:00:00Z' },
  { id: 'nf-06', user_id: 'u-supplier-01', judul: 'Wortel Tiba', pesan: 'Pesanan Wortel dari Poktan Mekar Tani telah tiba di gudang Anda', tipe: 'logistik', link: '/supplier/transaksi', is_read: true, created_at: '2026-03-08T16:00:00Z' },
  { id: 'nf-07', user_id: 'u-petani-01', judul: 'Pembayaran Masuk', pesan: 'Anda menerima pembayaran Rp 21.560.000 dari transaksi Tomat', tipe: 'pembayaran', link: '/petani/riwayat', is_read: true, created_at: '2026-02-25T10:00:00Z' },
  { id: 'nf-08', user_id: 'u-admin-01', judul: 'Anomali Terdeteksi', pesan: 'Anomali tingkat TINGGI terdeteksi pada Poktan Maju Jaya', tipe: 'anomali', link: '/admin/compliance', is_read: false, created_at: '2026-03-20T06:00:00Z' },
]

// ============ PENCAIRAN ============
export const dummyPencairan: Pencairan[] = [
  {
    id: 'pc-01',
    petani_id: 'u-petani-01',
    jumlah: 21560000,
    biaya_admin: 2500,
    jumlah_diterima: 21557500,
    rekening: { metode: 'bank', provider: 'BRI', nomor: '0012-01-012345-56-7', atas_nama: 'AHMAD HIDAYAT' },
    status: 'berhasil',
    created_at: '2026-02-26T08:00:00Z',
    selesai_at: '2026-02-26T14:00:00Z',
  },
  {
    id: 'pc-02',
    petani_id: 'u-petani-01',
    jumlah: 27930000,
    biaya_admin: 2500,
    jumlah_diterima: 27927500,
    rekening: { metode: 'bank', provider: 'BRI', nomor: '0012-01-012345-56-7', atas_nama: 'AHMAD HIDAYAT' },
    status: 'berhasil',
    created_at: '2026-02-02T08:00:00Z',
    selesai_at: '2026-02-02T15:00:00Z',
  },
]

export function getPencairanByPetaniId(petaniId: string) {
  return dummyPencairan
    .filter(p => p.petani_id === petaniId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// ============ HELPER: GET BY ROLE ============
export function getUsersByRole(role: string) {
  return dummyUsers.filter(u => u.role === role)
}

export function getPoktanByKetuaId(ketuaId: string) {
  return dummyPoktan.find(p => p.ketua_id === ketuaId)
}

export function getAnggotaByPoktanId(poktanId: string) {
  return dummyAnggotaPoktan
    .filter(a => a.poktan_id === poktanId)
    .map(a => ({
      ...a,
      petani: dummyUsers.find(u => u.id === a.petani_id),
    }))
}

export function getSupplierByUserId(userId: string) {
  return dummySuppliers.find(s => s.user_id === userId)
}

export function getTransaksiByPoktanId(poktanId: string) {
  return dummyTransaksi.filter(t => t.poktan_id === poktanId)
}

export function getTransaksiBySupplierUserid(userId: string) {
  const supplier = getSupplierByUserId(userId)
  if (!supplier) return []
  return dummyTransaksi.filter(t => t.supplier_id === supplier.id)
}

export function getPreOrdersBySupplierId(supplierId: string) {
  return dummyPreOrders.filter(p => p.supplier_id === supplierId)
}

export function getNotifikasiByUserId(userId: string) {
  return dummyNotifikasi.filter(n => n.user_id === userId).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function getKontribusiByPetaniId(petaniId: string) {
  return dummyKontribusi
    .filter(k => k.petani_id === petaniId)
    .map(k => ({
      ...k,
      transaksi: dummyTransaksi.find(t => t.id === k.transaksi_id),
    }))
}

export function getKreditByPetaniId(petaniId: string) {
  return dummyKredit.filter(k => k.petani_id === petaniId)
}

// ============ KYC SUBMISSIONS ============
export const dummyKYCSubmissions: KYCSubmission[] = [
  {
    id: 'kyc-01',
    user_id: 'u-ketua-01',
    user_nama: 'Pak Surya Wijaya',
    user_role: 'ketua_poktan',
    layer: 1,
    trust_level: 'verified',
    documents: [
      { id: 'doc-01', nama: 'KTP', status: 'approved', uploaded_at: '2026-01-20T08:00:00Z' },
      { id: 'doc-02', nama: 'Foto Selfie + KTP', status: 'approved', uploaded_at: '2026-01-20T08:05:00Z' },
      { id: 'doc-03', nama: 'No. HP Terverifikasi', status: 'approved', uploaded_at: '2026-01-20T08:00:00Z' },
    ],
    status: 'approved',
    reviewer_id: 'u-admin-01',
    reviewer_catatan: 'Dokumen lengkap dan valid',
    submitted_at: '2026-01-20T08:00:00Z',
    reviewed_at: '2026-01-21T10:00:00Z',
  },
  {
    id: 'kyc-02',
    user_id: 'u-ketua-01',
    user_nama: 'Pak Surya Wijaya',
    user_role: 'ketua_poktan',
    layer: 2,
    trust_level: 'bronze',
    documents: [
      { id: 'doc-04', nama: 'Surat Keterangan Domisili', status: 'approved', uploaded_at: '2026-02-01T08:00:00Z' },
      { id: 'doc-05', nama: 'SK Poktan dari Dinas Pertanian', status: 'approved', uploaded_at: '2026-02-01T08:10:00Z' },
      { id: 'doc-06', nama: 'Foto Lahan', status: 'approved', uploaded_at: '2026-02-01T08:15:00Z' },
    ],
    status: 'approved',
    reviewer_id: 'u-admin-01',
    submitted_at: '2026-02-01T08:00:00Z',
    reviewed_at: '2026-02-02T14:00:00Z',
  },
  {
    id: 'kyc-03',
    user_id: 'u-ketua-01',
    user_nama: 'Pak Surya Wijaya',
    user_role: 'ketua_poktan',
    layer: 3,
    trust_level: 'silver',
    documents: [
      { id: 'doc-07', nama: 'Rekening Bank atas Nama Poktan', status: 'pending', uploaded_at: '2026-03-10T08:00:00Z' },
      { id: 'doc-08', nama: 'Sertifikat Pelatihan QA', status: 'pending', uploaded_at: '2026-03-10T08:05:00Z' },
    ],
    status: 'pending',
    submitted_at: '2026-03-10T08:00:00Z',
  },
  {
    id: 'kyc-04',
    user_id: 'u-supplier-01',
    user_nama: 'Rini Hartono',
    user_role: 'supplier',
    layer: 1,
    trust_level: 'verified',
    documents: [
      { id: 'doc-09', nama: 'KTP Pemilik', status: 'approved', uploaded_at: '2026-01-22T08:00:00Z' },
      { id: 'doc-10', nama: 'SIUP/NIB', status: 'approved', uploaded_at: '2026-01-22T08:05:00Z' },
      { id: 'doc-11', nama: 'NPWP Perusahaan', status: 'approved', uploaded_at: '2026-01-22T08:10:00Z' },
    ],
    status: 'approved',
    reviewer_id: 'u-admin-01',
    submitted_at: '2026-01-22T08:00:00Z',
    reviewed_at: '2026-01-23T10:00:00Z',
  },
  {
    id: 'kyc-05',
    user_id: 'u-supplier-01',
    user_nama: 'Rini Hartono',
    user_role: 'supplier',
    layer: 2,
    trust_level: 'bronze',
    documents: [
      { id: 'doc-12', nama: 'Rekening Perusahaan', status: 'pending', uploaded_at: '2026-03-15T08:00:00Z' },
      { id: 'doc-13', nama: 'Surat Referensi Bank', status: 'pending', uploaded_at: '2026-03-15T08:05:00Z' },
    ],
    status: 'pending',
    submitted_at: '2026-03-15T08:00:00Z',
  },
  {
    id: 'kyc-08',
    user_id: 'u-petani-01',
    user_nama: 'Ahmad Hidayat',
    user_role: 'petani',
    layer: 1,
    trust_level: 'verified',
    documents: [
      { id: 'doc-18', nama: 'KTP', status: 'approved', uploaded_at: '2026-02-10T08:00:00Z' },
      { id: 'doc-19', nama: 'Foto Selfie + KTP', status: 'approved', uploaded_at: '2026-02-10T08:05:00Z' },
      { id: 'doc-20', nama: 'No. HP Terverifikasi', status: 'approved', uploaded_at: '2026-02-10T08:00:00Z' },
    ],
    status: 'approved',
    reviewer_id: 'u-admin-01',
    reviewer_catatan: 'Identitas terverifikasi',
    submitted_at: '2026-02-10T08:00:00Z',
    reviewed_at: '2026-02-11T10:00:00Z',
  },
  {
    id: 'kyc-06',
    user_id: 'u-petani-05',
    user_nama: 'Eko Prasetyo',
    user_role: 'petani',
    layer: 1,
    trust_level: 'unverified',
    documents: [
      { id: 'doc-14', nama: 'KTP', status: 'revisi', catatan: 'Foto buram, mohon upload ulang', uploaded_at: '2026-03-18T08:00:00Z' },
      { id: 'doc-15', nama: 'Foto Selfie + KTP', status: 'pending', uploaded_at: '2026-03-18T08:05:00Z' },
    ],
    status: 'revisi',
    reviewer_id: 'u-admin-01',
    reviewer_catatan: 'KTP tidak terbaca jelas, mohon foto ulang dengan pencahayaan baik',
    submitted_at: '2026-03-18T08:00:00Z',
    reviewed_at: '2026-03-19T09:00:00Z',
  },
  {
    id: 'kyc-07',
    user_id: 'u-supplier-02',
    user_nama: 'Hendro Wibowo',
    user_role: 'supplier',
    layer: 1,
    trust_level: 'unverified',
    documents: [
      { id: 'doc-16', nama: 'KTP Pemilik', status: 'rejected', catatan: 'KTP sudah expired', uploaded_at: '2026-03-01T08:00:00Z' },
      { id: 'doc-17', nama: 'SIUP/NIB', status: 'pending', uploaded_at: '2026-03-01T08:05:00Z' },
    ],
    status: 'rejected',
    reviewer_id: 'u-admin-01',
    reviewer_catatan: 'KTP sudah tidak berlaku, mohon gunakan KTP yang masih aktif',
    submitted_at: '2026-03-01T08:00:00Z',
    reviewed_at: '2026-03-02T11:00:00Z',
  },
]

// ============ DISPUTES ============
export const dummyDisputes: Dispute[] = [
  {
    id: 'dsp-01',
    transaksi_id: 'tx-04',
    pelapor_id: 'u-supplier-02',
    pelapor_nama: 'CV Mitra Pangan Timur',
    pelapor_role: 'supplier',
    terlapor_id: 'u-ketua-01',
    terlapor_nama: 'Poktan Mekar Tani',
    kategori: 'kualitas',
    deskripsi: 'Tomat yang diterima 30% berukuran kecil tidak sesuai grade A. Banyak yang sudah mulai lembek.',
    bukti: [
      { id: 'ev-01', tipe: 'foto', url: '/demo/dispute-tomat-1.jpg', deskripsi: 'Foto tomat berukuran kecil', uploaded_by: 'CV Mitra Pangan Timur', uploaded_at: '2026-02-21T08:00:00Z' },
      { id: 'ev-02', tipe: 'foto', url: '/demo/dispute-tomat-2.jpg', deskripsi: 'Foto tomat lembek', uploaded_by: 'CV Mitra Pangan Timur', uploaded_at: '2026-02-21T08:05:00Z' },
    ],
    timeline: [
      { id: 'tl-01', aksi: 'Dispute diajukan', oleh: 'CV Mitra Pangan Timur', created_at: '2026-02-21T08:00:00Z' },
      { id: 'tl-02', aksi: 'Investigasi dimulai', oleh: 'Admin taninesia', catatan: 'Meminta foto QA dari poktan', created_at: '2026-02-21T10:00:00Z' },
      { id: 'tl-03', aksi: 'Bukti QA diterima', oleh: 'Poktan Mekar Tani', catatan: 'Mengirim foto inspeksi awal', created_at: '2026-02-21T14:00:00Z' },
    ],
    status: 'mediasi',
    sla_deadline: '2026-02-24T08:00:00Z',
    created_at: '2026-02-21T08:00:00Z',
    updated_at: '2026-02-21T14:00:00Z',
  },
  {
    id: 'dsp-02',
    transaksi_id: 'tx-02',
    pelapor_id: 'u-supplier-02',
    pelapor_nama: 'CV Mitra Pangan Timur',
    pelapor_role: 'supplier',
    terlapor_id: 'u-petani-03',
    terlapor_nama: 'Poktan Sari Bumi',
    kategori: 'keterlambatan',
    deskripsi: 'Pengiriman kubis terlambat 2 hari dari jadwal estimasi.',
    bukti: [
      { id: 'ev-03', tipe: 'dokumen', url: '/demo/dispute-surat.pdf', deskripsi: 'Screenshot tracking pengiriman', uploaded_by: 'CV Mitra Pangan Timur', uploaded_at: '2026-03-22T08:00:00Z' },
    ],
    timeline: [
      { id: 'tl-04', aksi: 'Dispute diajukan', oleh: 'CV Mitra Pangan Timur', created_at: '2026-03-22T08:00:00Z' },
    ],
    status: 'diajukan',
    sla_deadline: '2026-03-25T08:00:00Z',
    created_at: '2026-03-22T08:00:00Z',
    updated_at: '2026-03-22T08:00:00Z',
  },
  {
    id: 'dsp-03',
    transaksi_id: 'tx-05',
    pelapor_id: 'u-supplier-01',
    pelapor_nama: 'PT Segar Nusantara',
    pelapor_role: 'supplier',
    terlapor_id: 'u-ketua-01',
    terlapor_nama: 'Poktan Mekar Tani',
    kategori: 'volume',
    deskripsi: 'Volume cabai merah yang diterima hanya 1.480 kg dari estimasi 1.500 kg (kekurangan 1.3%). Masih dalam toleransi tapi ingin dikonfirmasi.',
    bukti: [
      { id: 'ev-04', tipe: 'dokumen', url: '/demo/dispute-timbang.jpg', deskripsi: 'Foto timbangan di gudang', uploaded_by: 'PT Segar Nusantara', uploaded_at: '2026-01-29T08:00:00Z' },
    ],
    timeline: [
      { id: 'tl-05', aksi: 'Dispute diajukan', oleh: 'PT Segar Nusantara', created_at: '2026-01-29T08:00:00Z' },
      { id: 'tl-06', aksi: 'Investigasi dimulai', oleh: 'Admin taninesia', created_at: '2026-01-29T10:00:00Z' },
      { id: 'tl-07', aksi: 'Resolved - Dalam toleransi', oleh: 'Admin taninesia', catatan: 'Kekurangan 1.3% masih dalam toleransi 5%. Dispute ditutup.', created_at: '2026-01-30T09:00:00Z' },
    ],
    status: 'selesai',
    sla_deadline: '2026-02-01T08:00:00Z',
    resolusi: 'Kekurangan volume 1.3% masih dalam toleransi 5% sesuai SOP. Tidak ada kompensasi.',
    kompensasi: 0,
    created_at: '2026-01-29T08:00:00Z',
    updated_at: '2026-01-30T09:00:00Z',
  },
  {
    id: 'dsp-04',
    transaksi_id: 'tx-03',
    pelapor_id: 'u-ketua-01',
    pelapor_nama: 'Poktan Mekar Tani',
    pelapor_role: 'ketua_poktan',
    terlapor_id: 'u-supplier-01',
    terlapor_nama: 'PT Segar Nusantara',
    kategori: 'pembayaran',
    deskripsi: 'Pencairan pembayaran wortel ke petani terlambat 2 hari dari jadwal.',
    bukti: [
      { id: 'ev-05', tipe: 'catatan', url: '', deskripsi: 'Seharusnya cair 10 Maret, baru cair 12 Maret', uploaded_by: 'Poktan Mekar Tani', uploaded_at: '2026-03-12T10:00:00Z' },
    ],
    timeline: [
      { id: 'tl-08', aksi: 'Dispute diajukan', oleh: 'Poktan Mekar Tani', created_at: '2026-03-12T10:00:00Z' },
      { id: 'tl-09', aksi: 'Investigasi dimulai', oleh: 'Admin taninesia', catatan: 'Memeriksa log pencairan', created_at: '2026-03-12T11:00:00Z' },
      { id: 'tl-10', aksi: 'Eskalasi ke Manager', oleh: 'Admin taninesia', catatan: 'Keterlambatan disebabkan error sistem', created_at: '2026-03-12T14:00:00Z' },
      { id: 'tl-11', aksi: 'Resolved - Kompensasi diberikan', oleh: 'Ops Manager', catatan: 'Kompensasi bunga 0.1%/hari x 2 hari = Rp 59.000', created_at: '2026-03-13T10:00:00Z' },
    ],
    status: 'selesai',
    sla_deadline: '2026-03-15T10:00:00Z',
    resolusi: 'Keterlambatan disebabkan error sistem payment gateway. Kompensasi bunga 0.2% telah ditransfer.',
    kompensasi: 59000,
    created_at: '2026-03-12T10:00:00Z',
    updated_at: '2026-03-13T10:00:00Z',
  },
]

// ============ ONBOARDING MILESTONES ============
export const dummyOnboardingMilestones: OnboardingMilestone[] = [
  // Phase 1: Seeded (Day 1-30)
  { id: 'om-01', phase: 1, nama: 'Poktan Terdaftar', deskripsi: 'Jumlah poktan yang mendaftar dan terverifikasi', target: 10, current: 7, unit: 'poktan', status: 'in_progress' },
  { id: 'om-02', phase: 1, nama: 'Supplier Terdaftar', deskripsi: 'Jumlah supplier yang mendaftar dan deposit escrow', target: 5, current: 3, unit: 'supplier', status: 'in_progress' },
  { id: 'om-03', phase: 1, nama: 'Petani Terdaftar', deskripsi: 'Total petani individu yang tergabung di poktan', target: 50, current: 25, unit: 'petani', status: 'in_progress' },
  { id: 'om-04', phase: 1, nama: 'Pre-Order Pertama', deskripsi: 'Pre-order pertama berhasil di-match', target: 1, current: 1, unit: 'transaksi', status: 'tercapai' },
  // Phase 2: Earned (Day 31-60)
  { id: 'om-05', phase: 2, nama: 'Transaksi Selesai', deskripsi: 'Transaksi end-to-end pertama selesai', target: 10, current: 5, unit: 'transaksi', status: 'in_progress' },
  { id: 'om-06', phase: 2, nama: 'QA Skor Rata-rata', deskripsi: 'Rata-rata skor QA semua poktan', target: 80, current: 76, unit: 'skor', status: 'in_progress' },
  { id: 'om-07', phase: 2, nama: 'Repeat Order', deskripsi: 'Supplier melakukan repeat order', target: 3, current: 1, unit: 'supplier', status: 'in_progress' },
  // Phase 3: Network (Day 61-90)
  { id: 'om-08', phase: 3, nama: 'GMV Bulanan', deskripsi: 'Total nilai transaksi per bulan', target: 500000000, current: 265740000, unit: 'rupiah', status: 'in_progress' },
  { id: 'om-09', phase: 3, nama: 'Wilayah Aktif', deskripsi: 'Jumlah kabupaten/kota dengan transaksi aktif', target: 5, current: 2, unit: 'wilayah', status: 'belum' },
  { id: 'om-10', phase: 3, nama: 'Referral Poktan', deskripsi: 'Poktan baru dari referral poktan existing', target: 5, current: 0, unit: 'poktan', status: 'belum' },
]

// ============ ONBOARDING CHECKLIST ============
export const dummyOnboardingChecklist: OnboardingChecklist[] = [
  { id: 'oc-01', kategori: 'Infrastruktur', item: 'Server production deployed', is_done: true, pic: 'CTO' },
  { id: 'oc-02', kategori: 'Infrastruktur', item: 'Payment gateway terintegrasi', is_done: true, pic: 'CTO' },
  { id: 'oc-03', kategori: 'Infrastruktur', item: 'SMS/WhatsApp gateway aktif', is_done: true, pic: 'CTO' },
  { id: 'oc-04', kategori: 'Operasional', item: 'SOP dispute resolution final', is_done: true, pic: 'COO' },
  { id: 'oc-05', kategori: 'Operasional', item: 'Tim CS terlatih (min 3 orang)', is_done: true, pic: 'COO' },
  { id: 'oc-06', kategori: 'Operasional', item: 'Partner logistik MoU ditandatangani', is_done: false, pic: 'COO' },
  { id: 'oc-07', kategori: 'Marketing', item: 'Landing page & materi sosialisasi', is_done: true, pic: 'CMO' },
  { id: 'oc-08', kategori: 'Marketing', item: 'Roadshow ke 10 poktan target', is_done: false, pic: 'CMO' },
  { id: 'oc-09', kategori: 'Marketing', item: 'Onboarding supplier anchor (min 2)', is_done: true, pic: 'CMO' },
  { id: 'oc-10', kategori: 'Legal', item: 'Terms of Service final', is_done: true, pic: 'Legal' },
  { id: 'oc-11', kategori: 'Legal', item: 'Perjanjian escrow dengan bank partner', is_done: false, pic: 'Legal' },
  { id: 'oc-12', kategori: 'Finance', item: 'Budget Fase 1 disetujui', is_done: true, pic: 'CFO' },
]

// ============ SMART CATALOG ============
export const dummyKatalogKomoditas: KatalogKomoditas[] = [
  {
    id: 'kat-01', nama: 'Tomat', grade: 'A', harga_per_kg: 12000, volume_tersedia_kg: 5000,
    poktan_nama: 'Poktan Mekar Tani', poktan_id: 'pk-01', wilayah: 'Jawa Barat',
    jadwal_panen: '2026-04-10', skor_kualitas: 88, skor_ketepatan: 92, skor_volume: 85, skor_harga: 78,
    margin_persen: 15,
  },
  {
    id: 'kat-02', nama: 'Cabai Merah', grade: 'A', harga_per_kg: 45000, volume_tersedia_kg: 2000,
    poktan_nama: 'Poktan Mekar Tani', poktan_id: 'pk-01', wilayah: 'Jawa Barat',
    jadwal_panen: '2026-04-05', skor_kualitas: 91, skor_ketepatan: 90, skor_volume: 80, skor_harga: 72,
    margin_persen: 12,
  },
  {
    id: 'kat-03', nama: 'Kubis', grade: 'B', harga_per_kg: 6000, volume_tersedia_kg: 8000,
    poktan_nama: 'Poktan Sari Bumi', poktan_id: 'pk-02', wilayah: 'Jawa Barat',
    jadwal_panen: '2026-04-15', skor_kualitas: 78, skor_ketepatan: 85, skor_volume: 90, skor_harga: 88,
    margin_persen: 20,
  },
  {
    id: 'kat-04', nama: 'Wortel', grade: 'A', harga_per_kg: 10000, volume_tersedia_kg: 3000,
    poktan_nama: 'Poktan Mekar Tani', poktan_id: 'pk-01', wilayah: 'Jawa Barat',
    jadwal_panen: '2026-04-20', skor_kualitas: 91, skor_ketepatan: 92, skor_volume: 88, skor_harga: 82,
    margin_persen: 18,
  },
  {
    id: 'kat-05', nama: 'Kentang', grade: 'A', harga_per_kg: 15000, volume_tersedia_kg: 4000,
    poktan_nama: 'Poktan Sari Bumi', poktan_id: 'pk-02', wilayah: 'Jawa Barat',
    jadwal_panen: '2026-04-25', skor_kualitas: 82, skor_ketepatan: 80, skor_volume: 85, skor_harga: 75,
    margin_persen: 14,
  },
  {
    id: 'kat-06', nama: 'Bawang Merah', grade: 'B', harga_per_kg: 30000, volume_tersedia_kg: 2500,
    poktan_nama: 'Poktan Maju Jaya', poktan_id: 'pk-03', wilayah: 'Jawa Timur',
    jadwal_panen: '2026-04-30', skor_kualitas: 65, skor_ketepatan: 70, skor_volume: 75, skor_harga: 85,
    margin_persen: 22,
  },
  {
    id: 'kat-07', nama: 'Brokoli', grade: 'A', harga_per_kg: 18000, volume_tersedia_kg: 1500,
    poktan_nama: 'Poktan Sari Bumi', poktan_id: 'pk-02', wilayah: 'Jawa Barat',
    jadwal_panen: '2026-04-12', skor_kualitas: 85, skor_ketepatan: 88, skor_volume: 70, skor_harga: 68,
    margin_persen: 16,
  },
  {
    id: 'kat-08', nama: 'Cabai Rawit', grade: 'A', harga_per_kg: 55000, volume_tersedia_kg: 1000,
    poktan_nama: 'Poktan Maju Jaya', poktan_id: 'pk-03', wilayah: 'Jawa Timur',
    jadwal_panen: '2026-05-01', skor_kualitas: 70, skor_ketepatan: 68, skor_volume: 65, skor_harga: 90,
    margin_persen: 25,
  },
]

// Current demo user (simulated auth)
export const DEMO_USERS = {
  ketua_poktan: dummyUsers.find(u => u.id === 'u-ketua-01')!,
  petani: dummyUsers.find(u => u.id === 'u-petani-01')!,
  supplier: dummyUsers.find(u => u.id === 'u-supplier-01')!,
  admin: dummyUsers.find(u => u.id === 'u-admin-01')!,
}
