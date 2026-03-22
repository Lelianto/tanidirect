// ============================================================
// QA Form Definitions — extracted from /docs FormQA_A/B/C.docx
// ============================================================

export interface QAFormParameter {
  no: number
  parameter: string
  kriteria: string
}

export interface QAFormSection {
  id: string
  title: string
  wajibLulusSemua?: boolean
  parameters: QAFormParameter[]
}

export interface QAFormGrade {
  grade: string
  kriteria: string
  toleransi: string
}

export interface QAGradeRule {
  grade: string
  maxGagalNonWajib: number
}

export interface QAFormDefinition {
  komoditas: string
  label: string
  referensi: string
  dokumen: 'A' | 'B' | 'C' | 'generic'
  sections: QAFormSection[]
  grades: QAFormGrade[]
  gradeRules: QAGradeRule[]
}

export interface QADraft {
  transaksi_id: string
  komoditas: string
  form_label: string
  volume_sampel: string
  results: Record<number, { lulus: boolean | null; catatan: string }>
  grade_pilihan: string
  foto_batch: boolean
  foto_detail: boolean
  foto_timbangan: boolean
  catatan_tambahan: string
  grade_rekomendasi?: string
  grade_override_reason?: string
  updated_at: string
}

// Helper
function p(no: number, parameter: string, kriteria: string): QAFormParameter {
  return { no, parameter, kriteria }
}

// ============================================================
// DOKUMEN A — SNI LENGKAP
// ============================================================

const TOMAT: QAFormDefinition = {
  komoditas: 'Tomat',
  label: 'TOMAT SEGAR',
  referensi: 'SNI 01-3162-1992',
  dokumen: 'A',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi fisik buah', 'Utuh, segar, tidak retak, tidak pecah, bebas kerusakan berat akibat mekanis'),
        p(2, 'Kematangan', 'Buah sudah mencapai kematangan fisiologis minimum — tidak boleh masih hijau keras (mentah)'),
        p(3, 'Kebersihan', 'Bebas kotoran, tanah, residu kimia yang terlihat, dan benda asing yang menempel'),
        p(4, 'Hama & penyakit', 'Bebas serangan ulat, kutu, busuk basah (Phytophthora), dan antraknosa'),
        p(5, 'Bau', 'Bebas bau busuk, bau fermentasi, bau asing — aroma khas tomat segar'),
      ],
    },
    {
      id: 'B', title: 'KESERAGAMAN & WARNA',
      parameters: [
        p(6, 'Keseragaman varietas', 'Hanya satu varietas dalam satu kemasan — tidak campur bulat dengan lonjong/cherry'),
        p(7, 'Warna Mutu I', 'Merah merata \u2265 75% permukaan buah untuk pengiriman lokal; merah-oranye untuk antarpulau'),
        p(8, 'Warna Mutu II', 'Oranye merata hingga merah muda — masih bisa diterima untuk pasar lokal jarak dekat'),
        p(9, 'Keseragaman warna batch', 'Dalam satu kemasan, variasi tingkat kematangan tidak lebih dari 2 tingkat warna'),
      ],
    },
    {
      id: 'C', title: 'UKURAN BUAH (Diameter Horizontal)',
      parameters: [
        p(10, 'Ukuran Besar (Kode A)', 'Diameter buah > 6 cm — untuk pasar premium, modern market, horeka'),
        p(11, 'Ukuran Sedang (Kode B)', 'Diameter buah 4 \u2013 6 cm — pasar tradisional, restoran reguler'),
        p(12, 'Ukuran Kecil (Kode C)', 'Diameter buah < 4 cm (termasuk cherry tomat) — industri saus, pengolahan'),
        p(13, 'Keseragaman ukuran kemasan', 'Perbedaan diameter antar buah dalam satu kemasan tidak melebihi 1 cm'),
      ],
    },
    {
      id: 'D', title: 'TOLERANSI KERUSAKAN',
      parameters: [
        p(14, 'Cacat kulit / lecet ringan', 'Mutu I: \u2264 5% buah; Mutu II: \u2264 10% buah dari total isi kemasan'),
        p(15, 'Buah busuk sebagian', 'Mutu I: 0%; Mutu II: \u2264 2% — buah busuk total harus dibuang sebelum QA'),
        p(16, 'Retak / pecah (tidak meluas)', 'Mutu I: 0%; Mutu II: \u2264 5% — retak kulit kering (bukan basah) masih bisa diterima'),
        p(17, 'Serangan serangga / bolong', 'Semua mutu: 0% — satu lubang bekas serangga sudah cukup untuk menyingkirkan buah'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(18, 'Tangkai buah', 'Dipetik dengan atau tanpa tangkai — jika tanpa tangkai, bekas patahan harus kering'),
        p(19, 'Wadah penyimpanan sementara', 'Peti kayu berlubang atau kontainer plastik berlubang — BUKAN karung tertutup'),
        p(20, 'Perlindungan dari matahari', 'Setelah panen, ditaruh di tempat teduh — paparan panas mempercepat pembusukan'),
        p(21, 'Pengemasan akhir', 'Disusun hati-hati, tidak ditumpuk melebihi 3 lapis untuk ukuran besar'),
      ],
    },
  ],
  grades: [
    { grade: 'Mutu I (Super)', kriteria: 'Semua persyaratan umum OK; cacat \u2264 5%; busuk 0%; ukuran seragam kode A atau B', toleransi: 'Cacat \u2264 5%, busuk 0%' },
    { grade: 'Mutu II (Standar)', kriteria: 'Persyaratan umum OK; cacat \u2264 10%; busuk \u2264 2%; warna oranye-merah', toleransi: 'Cacat \u2264 10%, busuk \u2264 2%' },
    { grade: 'TOLAK', kriteria: 'Gagal persyaratan umum; busuk > 2%; atau kerusakan melebihi batas Mutu II', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Mutu I (Super)', maxGagalNonWajib: 0 },
    { grade: 'Mutu II (Standar)', maxGagalNonWajib: 4 },
  ],
}

const KENTANG: QAFormDefinition = {
  komoditas: 'Kentang',
  label: 'KENTANG SEGAR',
  referensi: 'SNI 01-3175-1992',
  dokumen: 'A',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi umbi', 'Utuh, keras (firm), tidak lembek, tidak berair — umbi lunak menandakan pembusukan'),
        p(2, 'Kulit umbi', 'Kulit masih menempel, tidak terkelupas luas — bekas gosok ringan masih dapat diterima'),
        p(3, 'Hama & penyakit', 'Bebas hama penggerek (Phthorimaea) dan penyakit busuk (Phytophthora, Fusarium)'),
        p(4, 'Tunas (sprout)', 'Mutu I: 0 tunas; Mutu II: tunas \u2264 3 mm — tunas panjang tanda simpan terlalu lama'),
        p(5, 'Bau', 'Bebas bau busuk, bau tanah berlebih, bau apek — aroma harus netral / khas kentang'),
        p(6, 'Kebersihan', 'Sisa tanah yang menempel \u2264 1% dari berat — cuci jika perlu sebelum dikemas'),
      ],
    },
    {
      id: 'B', title: 'UKURAN UMBI (Diameter Minimum)',
      parameters: [
        p(7, 'Kelas A (Besar)', 'Berat per umbi > 150 g; diameter > 6 cm — untuk kentang goreng, horeka'),
        p(8, 'Kelas B (Sedang)', 'Berat per umbi 75 \u2013 150 g; diameter 4 \u2013 6 cm — pasar swalayan, rumah tangga'),
        p(9, 'Kelas C (Kecil)', 'Berat per umbi 40 \u2013 75 g; diameter minimum 3 cm — untuk industri, pakan'),
        p(10, 'Keseragaman ukuran', 'Dalam satu kemasan, variasi ukuran maksimum satu kelas — tidak campur A dan C'),
      ],
    },
    {
      id: 'C', title: 'TINGKAT KERUSAKAN UMBI',
      parameters: [
        p(11, 'Luka mekanis / iris', 'Mutu I: \u2264 3%; Mutu II: \u2264 8% dari jumlah umbi dalam kemasan'),
        p(12, 'Busuk (sebagian atau total)', 'Semua mutu: 0% — umbi busuk harus dibuang total sebelum dikemas'),
        p(13, 'Umbi hijau (greening)', 'Mutu I: 0%; Mutu II: \u2264 2% — hijau menandakan solanine tinggi, berbahaya'),
        p(14, 'Bentuk abnormal / deformasi', 'Mutu I: \u2264 2%; Mutu II: \u2264 5% — umbi bentuk sangat tidak beraturan'),
        p(15, 'Serangan serangga / bolong', 'Mutu I: 0%; Mutu II: \u2264 1% — bekas penggerek mengurangi nilai jual signifikan'),
      ],
    },
    {
      id: 'D', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(16, 'Curing (penyembuhan luka)', 'Kentang baru panen sebaiknya dicuring 10\u201314 hari di suhu 15\u00b0C sebelum dikemas'),
        p(17, 'Penghindaran sinar matahari', 'Disimpan di gudang gelap atau tertutup — paparan sinar matahari menyebabkan greening'),
        p(18, 'Jenis kemasan', 'Karung anyaman (60\u201380 kg) atau peti berlubang — memiliki sirkulasi udara baik'),
        p(19, 'Label kemasan', 'Terdapat: nama produk, kelas mutu, berat bersih, asal Poktan, tanggal panen'),
      ],
    },
  ],
  grades: [
    { grade: 'Mutu I (Super)', kriteria: 'Semua syarat umum OK; luka \u2264 3%; busuk 0%; hijau 0%; tunas 0%', toleransi: 'Luka \u2264 3%, busuk/hijau/tunas 0%' },
    { grade: 'Mutu II (Standar)', kriteria: 'Syarat umum OK; luka \u2264 8%; busuk 0%; hijau \u2264 2%; tunas \u2264 3mm', toleransi: 'Luka \u2264 8%, busuk 0%, hijau \u2264 2%' },
    { grade: 'TOLAK', kriteria: 'Ada busuk, hijau > batas, tunas panjang, atau luka melebihi batas Mutu II', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Mutu I (Super)', maxGagalNonWajib: 0 },
    { grade: 'Mutu II (Standar)', maxGagalNonWajib: 3 },
  ],
}

const WORTEL: QAFormDefinition = {
  komoditas: 'Wortel',
  label: 'WORTEL SEGAR',
  referensi: 'SNI 3163:2014',
  dokumen: 'A',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi umbi', 'Segar, keras (firm), tidak layu, tidak retak memanjang, bebas kerusakan berat'),
        p(2, 'Kebersihan', 'Bebas tanah berlebih, bebas benda asing, bebas getah atau noda yang tidak wajar'),
        p(3, 'Hama & penyakit', 'Bebas bekas serangan ulat, bebas penyakit busuk (bercak hitam, lendir)'),
        p(4, 'Bau', 'Bebas bau busuk, bau apek — aroma khas wortel segar'),
        p(5, 'Daun / pucuk (jika ada)', 'Jika wortel disertai daun: daun segar, tidak layu, tidak menguning'),
      ],
    },
    {
      id: 'B', title: 'WARNA DAN TAMPILAN',
      parameters: [
        p(6, 'Warna kulit luar', 'Oranye cerah merata sesuai varietas — tidak ada bercak putih/hitam luas'),
        p(7, 'Warna Mutu I', 'Oranye merata > 90% permukaan — tidak ada bagian yang masih pucat/putih'),
        p(8, 'Warna Mutu II', 'Oranye dengan sedikit area pucat atau bercak ringan yang tidak lebih dari 10%'),
        p(9, 'Tidak bercabang berlebih', 'Mutu I: akar tunggang tunggal tidak bercabang; Mutu II: \u2264 2 cabang minor'),
      ],
    },
    {
      id: 'C', title: 'UKURAN UMBI',
      parameters: [
        p(10, 'Panjang umbi Mutu I', '12 \u2013 22 cm — optimal untuk pasar modern, industri jus'),
        p(11, 'Panjang umbi Mutu II', '7 \u2013 25 cm — untuk pasar tradisional, industri olahan'),
        p(12, 'Diameter pangkal umbi', 'Mutu I: 2,5 \u2013 5 cm; Mutu II: 1,5 \u2013 6 cm'),
        p(13, 'Keseragaman ukuran', 'Dalam satu kemasan, variasi panjang tidak lebih dari 5 cm'),
      ],
    },
    {
      id: 'D', title: 'TINGKAT KERUSAKAN',
      parameters: [
        p(14, 'Cacat mekanis / lecet', 'Mutu I: \u2264 5%; Mutu II: \u2264 10% dari jumlah umbi dalam kemasan'),
        p(15, 'Busuk (sebagian / total)', 'Semua mutu: 0% — langsung singkirkan sebelum QA dilakukan'),
        p(16, 'Retak / belah memanjang', 'Mutu I: 0%; Mutu II: \u2264 5% (retak kering, bukan retak basah berlendir)'),
        p(17, 'Serangan serangga', 'Mutu I: 0%; Mutu II: \u2264 2% — lubang bekas serangga harus singkat ke dalam'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(18, 'Pemangkasan daun', 'Daun dipotong 1\u20132 cm dari pangkal umbi — memperlambat dehidrasi umbi'),
        p(19, 'Pembersihan tanah', 'Tanah dibersihkan dengan sikat kering atau kain — BUKAN dicuci dengan air berlebih'),
        p(20, 'Kemasan', 'Karung jaring (max 50 kg) atau peti berlubang — memiliki sirkulasi udara baik'),
        p(21, 'Penyimpanan sementara', 'Di tempat sejuk, teduh, tidak lembab — hindari tumpukan terlalu tinggi'),
      ],
    },
  ],
  grades: [
    { grade: 'Mutu I (Super)', kriteria: 'Semua syarat umum OK; warna oranye merata; cacat \u2264 5%; busuk 0%; tidak bercabang', toleransi: 'Cacat \u2264 5%, busuk 0%' },
    { grade: 'Mutu II (Standar)', kriteria: 'Syarat umum OK; cacat \u2264 10%; busuk 0%; boleh \u2264 2 cabang minor', toleransi: 'Cacat \u2264 10%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Busuk > 0%, atau cacat melebihi batas Mutu II, atau gagal persyaratan umum', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Mutu I (Super)', maxGagalNonWajib: 0 },
    { grade: 'Mutu II (Standar)', maxGagalNonWajib: 4 },
  ],
}

const BAWANG_PUTIH: QAFormDefinition = {
  komoditas: 'Bawang Putih',
  label: 'BAWANG PUTIH',
  referensi: 'SNI 01-3160-1992 (rev. 2019)',
  dokumen: 'A',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi umbi', 'Utuh, padat (firm), tidak lembek, tidak pecah, tidak berlendir'),
        p(2, 'Kulit pembungkus', 'Kulit luar (tunica) masih menempel dan utuh — tidak terkelupas total'),
        p(3, 'Hama & penyakit', 'Bebas tungau, bebas penyakit busuk leher (Botrytis), bebas jamur hitam'),
        p(4, 'Tunas aktif', 'Tidak ada tunas hijau yang sudah keluar dari ujung siung'),
        p(5, 'Bau', 'Aroma khas bawang putih tajam — bebas bau busuk, bau apek, bau asing'),
        p(6, 'Kebersihan', 'Bebas tanah, kotoran, dan sisa akar yang berlebih'),
      ],
    },
    {
      id: 'B', title: 'KONDISI PANEN & KERING',
      parameters: [
        p(7, 'Tingkat kekeringan', 'Tangkai sudah kering sempurna — tidak ada tangkai hijau atau setengah kering'),
        p(8, 'Akar', 'Akar dipotong bersih, maks. sisa akar 1 cm dari pangkal umbi'),
        p(9, 'Tangkai (untuk gedengan)', 'Panjang tangkai kering minimal 5 cm — diperlukan untuk pengikatan gedengan'),
        p(10, 'Pemisahan siung longgar', 'Umbi yang siungnya sudah longgar / terlepas dipisahkan — tidak campur dengan yang utuh'),
      ],
    },
    {
      id: 'C', title: 'UKURAN UMBI',
      parameters: [
        p(11, 'Kelas Super (Besar)', 'Diameter umbi > 5 cm — untuk pasar premium, ekspor'),
        p(12, 'Kelas I (Sedang)', 'Diameter umbi 3,5 \u2013 5 cm — pasar swalayan, restoran'),
        p(13, 'Kelas II (Kecil)', 'Diameter umbi 2,5 \u2013 3,5 cm — pasar tradisional, bumbu industri'),
        p(14, 'Keseragaman dalam kemasan', 'Variasi ukuran maksimum satu kelas — tidak campur Super dengan Kelas II'),
      ],
    },
    {
      id: 'D', title: 'TINGKAT KERUSAKAN',
      parameters: [
        p(15, 'Siung busuk dalam umbi', 'Semua kelas: 0% — satu siung busuk cukup untuk menyingkirkan seluruh umbi'),
        p(16, 'Kerusakan kulit / memar', 'Kelas Super: 0%; Kelas I: \u2264 5%; Kelas II: \u2264 10% dari jumlah umbi'),
        p(17, 'Umbi pecah / terbuka', 'Kelas Super: 0%; Kelas I: \u2264 3%; Kelas II: \u2264 5%'),
        p(18, 'Bercak jamur hitam (jelaga)', 'Semua kelas: \u2264 2% dari permukaan per umbi — jamur hitam merata = tolak'),
      ],
    },
    {
      id: 'E', title: 'PENGEMASAN',
      parameters: [
        p(19, 'Bentuk penyajian', 'Protolan (lepas) atau gedengan (tali) — tidak campur dalam satu kemasan'),
        p(20, 'Kapasitas kemasan', 'Karung 50\u201380 kg atau jaring (net bag) 1\u20135 kg untuk pasar modern'),
        p(21, 'Label', 'Nama produk, kelas mutu, berat bersih, nama Poktan, tanggal panen'),
      ],
    },
  ],
  grades: [
    { grade: 'Kelas Super', kriteria: 'Semua syarat umum OK; busuk 0%; kerusakan kulit 0%; diameter > 5 cm seragam', toleransi: 'Kerusakan 0%, busuk 0%' },
    { grade: 'Kelas I', kriteria: 'Syarat umum OK; busuk 0%; kerusakan kulit \u2264 5%; diameter 3,5\u20135 cm', toleransi: 'Kerusakan \u2264 5%, busuk 0%' },
    { grade: 'Kelas II', kriteria: 'Syarat umum OK; busuk 0%; kerusakan kulit \u2264 10%; diameter 2,5\u20133,5 cm', toleransi: 'Kerusakan \u2264 10%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Ada siung busuk, tunas aktif panjang, atau kerusakan melebihi batas Kelas II', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Kelas Super', maxGagalNonWajib: 0 },
    { grade: 'Kelas I', maxGagalNonWajib: 2 },
    { grade: 'Kelas II', maxGagalNonWajib: 5 },
  ],
}

const KEDELAI: QAFormDefinition = {
  komoditas: 'Kedelai',
  label: 'KEDELAI (BIJI KERING)',
  referensi: 'SNI 01-3922-1995',
  dokumen: 'A',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi biji', 'Biji kering, bersih, utuh — tidak berkecambah, tidak berjamur, tidak berlendir'),
        p(2, 'Bau', 'Bebas bau apek, bau tengik — aroma khas kedelai kering yang netral'),
        p(3, 'Hama gudang', 'Bebas kumbang gudang dan kutu — periksa dengan saringan kasar'),
        p(4, 'Kebersihan', 'Bebas tanah, kerikil, potongan batang/daun, dan benda asing'),
      ],
    },
    {
      id: 'B', title: 'KADAR AIR (Wajib Diukur dengan Moisture Meter)',
      parameters: [
        p(5, 'Mutu I \u2014 Kadar air', '\u2264 13% — untuk penyimpanan, industri tahu/tempe jangka panjang'),
        p(6, 'Mutu II \u2014 Kadar air', '> 13% sampai \u2264 14% — untuk pengolahan segera'),
        p(7, 'Mutu III \u2014 Kadar air', '> 14% sampai \u2264 16% — untuk konsumsi sangat segera, risiko jamur meningkat'),
        p(8, 'TOLAK \u2014 Kadar air', '> 16% — risiko jamur dan kerusakan tidak dapat diterima'),
      ],
    },
    {
      id: 'C', title: 'PERSENTASE BIJI RUSAK',
      parameters: [
        p(9, 'Biji rusak total (busuk/jamur)', 'Mutu I: \u2264 2%; Mutu II: \u2264 3%; Mutu III: \u2264 5% dari berat total'),
        p(10, 'Biji belah / pecah', 'Mutu I: \u2264 3%; Mutu II: \u2264 5%; Mutu III: \u2264 8%'),
        p(11, 'Biji keriput / kisut', 'Mutu I: \u2264 2%; Mutu II: \u2264 5%; Mutu III: \u2264 8%'),
        p(12, 'Biji warna lain / varietas lain', 'Mutu I: \u2264 1%; Mutu II: \u2264 2%; Mutu III: \u2264 5%'),
      ],
    },
    {
      id: 'D', title: 'KOTORAN & BENDA ASING',
      parameters: [
        p(13, 'Kerikil / pasir / tanah', 'Mutu I: \u2264 0,5%; Mutu II: \u2264 1%; Mutu III: \u2264 2%'),
        p(14, 'Polong / kulit / batang', 'Mutu I: \u2264 1%; Mutu II: \u2264 2%; Mutu III: \u2264 3%'),
        p(15, 'Benda asing keras (logam, plastik)', 'Semua mutu: 0% — berbahaya untuk mesin pengolahan'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(16, 'Pengeringan', 'Kedelai dikeringkan sampai kadar air target — jemur 3\u20135 hari atau gunakan mesin dryer'),
        p(17, 'Pemilahan', 'Biji rusak, benda asing, dan biji warna lain dipilah sebelum dikemas'),
        p(18, 'Kemasan', 'Karung goni 50\u201360 kg atau karung plastik bersih — bukan karung bekas bahan kimia'),
        p(19, 'Label', 'Nama produk, mutu (I/II/III), berat bersih, kadar air terukur, nama Poktan, tanggal'),
      ],
    },
  ],
  grades: [
    { grade: 'Mutu I', kriteria: 'Kadar air \u2264 13%; biji rusak \u2264 2%; biji pecah \u2264 3%; kotoran \u2264 0,5%', toleransi: 'Kadar air \u2264 13%, rusak \u2264 2%' },
    { grade: 'Mutu II', kriteria: 'Kadar air \u2264 14%; biji rusak \u2264 3%; biji pecah \u2264 5%; kotoran \u2264 1%', toleransi: 'Kadar air \u2264 14%, rusak \u2264 3%' },
    { grade: 'Mutu III', kriteria: 'Kadar air \u2264 16%; biji rusak \u2264 5%; biji pecah \u2264 8%; kotoran \u2264 2%', toleransi: 'Kadar air \u2264 16%, rusak \u2264 5%' },
    { grade: 'TOLAK', kriteria: 'Kadar air > 16%, ada benda asing keras, atau berjamur banyak', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Mutu I', maxGagalNonWajib: 0 },
    { grade: 'Mutu II', maxGagalNonWajib: 2 },
    { grade: 'Mutu III', maxGagalNonWajib: 5 },
  ],
}

const BERAS: QAFormDefinition = {
  komoditas: 'Beras',
  label: 'BERAS',
  referensi: 'SNI 6128:2020',
  dokumen: 'A',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi beras', 'Kering, bersih, tidak bau, bebas benda asing, bebas hama hidup'),
        p(2, 'Bau', 'Bebas bau apek, bau tengik, bau asam — aroma beras segar yang netral'),
        p(3, 'Hama gudang hidup', '0 ekor hama hidup dalam sampel 1 kg — hama mati \u2264 1 ekor masih dapat diterima'),
        p(4, 'Bebas bahan berbahaya', 'Tidak ada benda logam, plastik, batu — periksa dengan tangan atau saringan magnet'),
      ],
    },
    {
      id: 'B', title: 'KADAR AIR (Wajib Diukur dengan Moisture Meter)',
      parameters: [
        p(5, 'Premium / Mutu I', 'Kadar air \u2264 14% — standar untuk beras premium, pasar modern, ekspor'),
        p(6, 'Mutu II', 'Kadar air \u2264 14% — sama dengan Mutu I, pembeda ada di butir patah & benda asing'),
        p(7, 'Mutu III', 'Kadar air \u2264 14% — kadar air sama, perbedaan di persentase butir patah yang lebih tinggi'),
        p(8, 'TOLAK', 'Kadar air > 14% — beras basah, risiko jamur dan kerusakan kualitas sangat tinggi'),
      ],
    },
    {
      id: 'C', title: 'DERAJAT SOSOH & WARNA',
      parameters: [
        p(9, 'Derajat sosoh Premium/Mutu I', '\u2265 95% — beras putih bersih, lapisan dedak hampir tidak ada'),
        p(10, 'Derajat sosoh Mutu II', '\u2265 90% — sedikit lapisan dedak masih bisa terlihat'),
        p(11, 'Derajat sosoh Mutu III', '\u2265 80% — untuk beras merah/hitam atau beras lokal tertentu'),
        p(12, 'Warna (untuk beras putih)', 'Putih bersih, tidak kuning, tidak kehijauan — kuning menandakan penyimpanan lama'),
      ],
    },
    {
      id: 'D', title: 'BUTIR PATAH & MENIR (SNI 6128:2020)',
      parameters: [
        p(13, 'Butir patah (broken) Premium', '\u2264 15% dari berat total — ukur dengan memilah manual sampel 100 g'),
        p(14, 'Butir patah Mutu I', '\u2264 25% dari berat total'),
        p(15, 'Butir patah Mutu II', '\u2264 35% dari berat total'),
        p(16, 'Menir (butir sangat kecil)', 'Premium: \u2264 0,5%; Mutu I: \u2264 1%; Mutu II: \u2264 2%; Mutu III: \u2264 3%'),
      ],
    },
    {
      id: 'E', title: 'BENDA ASING & KOTORAN',
      parameters: [
        p(17, 'Benda asing (batu, plastik)', 'Premium & Mutu I: 0%; Mutu II: \u2264 0,02%; Mutu III: \u2264 0,05% dari berat'),
        p(18, 'Butir gabah (tidak terkupas)', 'Premium: \u2264 0 butir/100g; Mutu I: \u2264 1 butir/100g; Mutu II: \u2264 2 butir/100g'),
        p(19, 'Butir merah / hitam (kontaminan)', 'Premium: \u2264 0%; Mutu I: \u2264 1%; Mutu II: \u2264 3%; Mutu III: \u2264 5% dari berat'),
        p(20, 'Dedak / sekam', 'Premium: \u2264 0,02%; Mutu I: \u2264 0,05%; Mutu II: \u2264 0,1%'),
      ],
    },
    {
      id: 'F', title: 'PENANGANAN & PENGEMASAN',
      parameters: [
        p(21, 'Kemasan primer', 'Karung PP 25/50 kg atau kemasan vakum — tidak bocor, tidak basah dari luar'),
        p(22, 'Kondisi kemasan', 'Jahitan rapat, tidak ada robekan, tidak ada bekas air/embun di dalam kemasan'),
        p(23, 'Label wajib', 'Nama produk, mutu (Premium/I/II/III), berat bersih, kadar air, nama Poktan/penggilingan, tanggal giling'),
        p(24, 'Penyimpanan sementara', 'Di atas palet kayu, jarak min. 20 cm dari dinding, di ruang kering < 70% kelembaban'),
      ],
    },
  ],
  grades: [
    { grade: 'Premium', kriteria: 'Kadar air \u2264 14%; sosoh \u2265 95%; butir patah \u2264 15%; benda asing 0%; menir \u2264 0,5%', toleransi: 'Patah \u2264 15%, asing 0%' },
    { grade: 'Mutu I', kriteria: 'Kadar air \u2264 14%; sosoh \u2265 90%; butir patah \u2264 25%; benda asing 0%', toleransi: 'Patah \u2264 25%, asing 0%' },
    { grade: 'Mutu II', kriteria: 'Kadar air \u2264 14%; sosoh \u2265 90%; butir patah \u2264 35%; benda asing \u2264 0,02%', toleransi: 'Patah \u2264 35%, asing \u2264 0,02%' },
    { grade: 'Mutu III', kriteria: 'Kadar air \u2264 14%; sosoh \u2265 80%; butir patah \u2264 50%; benda asing \u2264 0,05%', toleransi: 'Patah \u2264 50%' },
    { grade: 'TOLAK', kriteria: 'Kadar air > 14%, ada hama hidup, bau apek, atau melebihi batas Mutu III', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Premium', maxGagalNonWajib: 0 },
    { grade: 'Mutu I', maxGagalNonWajib: 2 },
    { grade: 'Mutu II', maxGagalNonWajib: 5 },
    { grade: 'Mutu III', maxGagalNonWajib: 8 },
  ],
}

// ============================================================
// DOKUMEN B — SNI TERBATAS
// ============================================================

const KUBIS: QAFormDefinition = {
  komoditas: 'Kubis',
  label: 'KUBIS / KOL',
  referensi: 'SNI 01-3188-1992 + Standar Pasar Lokal',
  dokumen: 'B',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM SNI (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi krop', 'Segar, kompak, padat — krop yang terasa ringan / rongga di dalam = tanda kualitas buruk'),
        p(2, 'Kebersihan', 'Bebas tanah, kotoran, benda asing, residu pestisida yang terlihat'),
        p(3, 'Hama & penyakit', 'Bebas ulat kubis (Plutella xylostella), bebas penyakit busuk hitam (Xanthomonas)'),
        p(4, 'Bau', 'Bebas bau busuk, bau fermentasi — aroma khas kubis segar'),
      ],
    },
    {
      id: 'B', title: 'KONDISI DAUN LUAR & KROP',
      parameters: [
        p(5, 'Daun luar pelindung', 'Minimal 2\u20133 daun luar masih menempel dan segar sebagai pelindung alami krop'),
        p(6, 'Daun layu / menguning', 'Mutu I: 0 daun layu/kuning; Mutu II: \u2264 2 daun layu/kuning'),
        p(7, 'Kekompakan krop', 'Krop padat saat ditekan ringan — tidak berongga, tidak ada celah besar di dalam'),
        p(8, 'Tangkai bawah', 'Dipotong rata tidak lebih dari 1 cm dari dasar krop'),
      ],
    },
    {
      id: 'C', title: 'UKURAN & BERAT KROP',
      parameters: [
        p(9, 'Kubis Besar', 'Berat krop > 1,5 kg per kepala — untuk pasar modern, industri, horeka'),
        p(10, 'Kubis Sedang', 'Berat krop 0,8 \u2013 1,5 kg per kepala — pasar tradisional, konsumsi rumah tangga'),
        p(11, 'Kubis Kecil', 'Berat krop < 0,8 kg — untuk industri pengolahan, sup, pasar B-grade'),
        p(12, 'Keseragaman dalam kemasan', 'Variasi berat antar krop dalam satu kemasan tidak lebih dari 30%'),
      ],
    },
    {
      id: 'D', title: 'TINGKAT KERUSAKAN',
      parameters: [
        p(13, 'Daun robek / tergores luas', 'Mutu I: \u2264 5% area daun luar; Mutu II: \u2264 15% area — kerusakan dalam krop = tolak'),
        p(14, 'Busuk (sebagian / total)', 'Semua mutu: 0% — satu titik busuk di dalam krop = singkirkan seluruh krop'),
        p(15, 'Bekas gigitan serangga', 'Mutu I: \u2264 5%; Mutu II: \u2264 15% area daun luar — bekas di daun dalam = tolak'),
        p(16, 'Retak / pecah di krop', 'Semua mutu: 0% — krop yang retak cepat membusuk selama pengiriman'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(17, 'Waktu panen ke pengiriman', 'Maksimum 24 jam di suhu ruang — kubis sangat sensitif terhadap suhu tinggi'),
        p(18, 'Kemasan', 'Jaring net besar atau karung longgar — tidak boleh dikemas rapat tanpa sirkulasi udara'),
        p(19, 'Tumpukan dalam kendaraan', 'Maksimum 3 lapisan tumpukan — berat berlebih merusak krop di bawah'),
      ],
    },
  ],
  grades: [
    { grade: 'Mutu I (Super)', kriteria: 'Semua syarat umum OK; krop padat; daun luar minimal 2 lembar segar; cacat \u2264 5%; busuk 0%', toleransi: 'Cacat \u2264 5%, busuk 0%' },
    { grade: 'Mutu II (Standar)', kriteria: 'Syarat umum OK; boleh \u2264 2 daun layu; cacat \u2264 15%; busuk 0%', toleransi: 'Cacat \u2264 15%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Ada busuk, krop berongga, retak di dalam, atau daun rusak di dalam krop', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Mutu I (Super)', maxGagalNonWajib: 0 },
    { grade: 'Mutu II (Standar)', maxGagalNonWajib: 4 },
  ],
}

const MANGGA: QAFormDefinition = {
  komoditas: 'Mangga',
  label: 'MANGGA SEGAR',
  referensi: 'SNI 3164:2009 (Fokus Ekspor) + Adaptasi Pasar Lokal',
  dokumen: 'B',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM SNI (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi buah', 'Utuh, segar, bebas kerusakan fisik berat, bebas serangan hama & penyakit'),
        p(2, 'Kematangan fisiologis', 'Buah sudah mencapai kematangan minimum — kulit tidak boleh sepenuhnya hijau keras'),
        p(3, 'Kebersihan', 'Bebas kotoran, getah (lateks) kering berlebih, residu pestisida yang terlihat'),
        p(4, 'Bau', 'Aroma khas mangga — bebas bau busuk, bau fermentasi, bau kimia'),
        p(5, 'Penyakit utama', 'Bebas antraknosa (bercak hitam), busuk pangkal, dan penyakit kudis (scab)'),
      ],
    },
    {
      id: 'B', title: 'VARIETAS & KESERAGAMAN',
      parameters: [
        p(6, 'Keseragaman varietas', 'Hanya satu varietas dalam satu kemasan — Harum Manis, Gedong, Manalagi, dll. tidak campur'),
        p(7, 'Tingkat kematangan seragam', 'Dalam satu kemasan, variasi kematangan tidak lebih dari 2 tingkat warna'),
        p(8, 'Warna kulit sesuai varietas', 'Warna sesuai karakteristik varietas — misal Gedong Gincu: oranye-merah; Harum Manis: kuning-hijau'),
      ],
    },
    {
      id: 'C', title: 'UKURAN BUAH (SNI 3164:2009 Kode Ukuran)',
      parameters: [
        p(9, 'Kode 1 (Sangat Besar)', 'Berat buah > 450 g — premium, ekspor, horeka'),
        p(10, 'Kode 2 (Besar)', 'Berat buah 351 \u2013 450 g — pasar modern premium'),
        p(11, 'Kode 3 (Sedang)', 'Berat buah 251 \u2013 350 g — pasar swalayan reguler'),
        p(12, 'Kode 4 (Kecil)', 'Berat buah 181 \u2013 250 g — pasar tradisional, industri jus'),
        p(13, 'Keseragaman dalam kemasan', 'Perbedaan berat antar buah dalam satu kemasan maksimum satu kode ukuran'),
      ],
    },
    {
      id: 'D', title: 'TINGKAT KERUSAKAN',
      parameters: [
        p(14, 'Cacat kulit / lecet ringan', 'Kelas Super: \u2264 5% area permukaan buah; Kelas I: \u2264 10%; Kelas II: \u2264 15%'),
        p(15, 'Bercak antraknosa', 'Kelas Super: 0 bercak; Kelas I: \u2264 2 bercak kecil (< 5mm); Kelas II: \u2264 5 bercak kecil'),
        p(16, 'Bekas getah (lateks) mengering', 'Kelas Super: \u2264 2%; Kelas I: \u2264 5%; Kelas II: \u2264 10% area permukaan'),
        p(17, 'Busuk (sebagian / total)', 'Semua kelas: 0% — busuk kecil sekalipun menyebar cepat ke buah lain'),
        p(18, 'Bekas serangga / lubang', 'Kelas Super & I: 0%; Kelas II: \u2264 1 lubang kecil per buah'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(19, 'Pemetikan dengan tangkai', 'Dipetik dengan tangkai min. 1 cm — hindari lateks mengenai kulit buah saat petik'),
        p(20, 'Pembersihan lateks', 'Setelah petik: simpan buah tengkurap (tangkai bawah) di wadah berlubang selama 30 menit'),
      ],
    },
  ],
  grades: [
    { grade: 'Kelas Super (Ekspor)', kriteria: 'Semua syarat SNI OK; cacat \u2264 5%; antraknosa 0%; busuk 0%; ukuran Kode 1-2', toleransi: 'Cacat \u2264 5%, busuk/antraknosa 0%' },
    { grade: 'Kelas I (Pasar Modern)', kriteria: 'Syarat umum OK; cacat \u2264 10%; \u2264 2 bercak kecil; busuk 0%', toleransi: 'Cacat \u2264 10%, busuk 0%' },
    { grade: 'Kelas II (Pasar Lokal)', kriteria: 'Syarat umum OK; cacat \u2264 15%; \u2264 5 bercak kecil; busuk 0%', toleransi: 'Cacat \u2264 15%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Ada busuk, antraknosa luas, atau cacat melebihi batas Kelas II', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Kelas Super (Ekspor)', maxGagalNonWajib: 0 },
    { grade: 'Kelas I (Pasar Modern)', maxGagalNonWajib: 2 },
    { grade: 'Kelas II (Pasar Lokal)', maxGagalNonWajib: 5 },
  ],
}

const PISANG: QAFormDefinition = {
  komoditas: 'Pisang',
  label: 'PISANG SEGAR',
  referensi: 'ASEAN GAP + Standar Ekspor',
  dokumen: 'B',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi sisir / buah', 'Sisir utuh, buah tidak rontok dari jantung sisir, kulit tidak retak/pecah besar'),
        p(2, 'Tingkat kematangan', 'Kulit masih hijau hingga kuning-hijau — BUKAN kuning penuh (sudah terlalu matang untuk kirim jauh)'),
        p(3, 'Kebersihan', 'Bebas kotoran, tanah, getah pisang kering berlebih, serangga'),
        p(4, 'Hama & penyakit', 'Bebas penyakit layu Fusarium (Panama disease), bebas thrips, bebas bercak Sigatoka'),
        p(5, 'Bau', 'Aroma pisang segar — bebas bau busuk, bau fermentasi'),
      ],
    },
    {
      id: 'B', title: 'UKURAN BUAH',
      parameters: [
        p(6, 'Panjang buah Kelas A', 'Panjang buah \u2265 20 cm — untuk ekspor, pasar modern premium'),
        p(7, 'Panjang buah Kelas B', 'Panjang buah 15 \u2013 19 cm — pasar swalayan reguler'),
        p(8, 'Panjang buah Kelas C', 'Panjang buah < 15 cm — pasar lokal, industri keripik, olahan'),
        p(9, 'Ketebalan buah (Grade Ekspor)', 'Diameter minimum 3,0 cm di bagian tengah buah'),
        p(10, 'Jumlah buah per sisir', 'Kelas A: 12\u201316 buah/sisir; Kelas B: 10\u201314 buah/sisir'),
      ],
    },
    {
      id: 'C', title: 'KONDISI KULIT',
      parameters: [
        p(11, 'Bekas gosok / baret ringan', 'Kelas A: \u2264 5% area kulit; Kelas B: \u2264 15%; Kelas C: \u2264 25% — baret dalam = tolak'),
        p(12, 'Bercak coklat (bruise)', 'Kelas A: 0%; Kelas B: \u2264 3 bercak < 1cm; Kelas C: \u2264 5 bercak kecil'),
        p(13, 'Busuk / mould pada kulit', 'Semua kelas: 0% — satu titik busuk di ujung buah cukup untuk singkirkan sisir'),
        p(14, 'Bekas thrips (garis/bercak perak)', 'Kelas A: 0%; Kelas B: \u2264 5% area kulit'),
      ],
    },
    {
      id: 'D', title: 'KONDISI SISIR',
      parameters: [
        p(15, 'Keutuhan sisir', 'Setiap sisir minimum 75% buah masih menempel — sisir rontok sebagian = turun kelas'),
        p(16, 'Ujung jantung sisir (crown)', 'Crown bersih, tidak busuk, tidak berjamur — crown busuk merusak seluruh sisir'),
        p(17, 'Tandan / jumlah sisir per tandan', '1 tandan = 5\u201312 sisir ideal'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(18, 'Penanganan pemotongan tandan', 'Tandan dipotong dengan pisau bersih — bukan ditekan/dipatahkan. Potong tangkai min. 5 cm'),
        p(19, 'Pembersihan getah', 'Sisir dicuci air bersih atau dilap untuk menghilangkan getah'),
        p(20, 'Kemasan', 'Karton berlubang (untuk ekspor/modern market) atau tandan disusun longgar dalam bak'),
      ],
    },
  ],
  grades: [
    { grade: 'Kelas A (Ekspor/Premium)', kriteria: 'Semua syarat OK; panjang \u2265 20cm; baret \u2264 5%; thrips 0%; busuk 0%; crown bersih', toleransi: 'Baret \u2264 5%, busuk/thrips 0%' },
    { grade: 'Kelas B (Pasar Modern)', kriteria: 'Syarat umum OK; panjang 15-19cm; baret \u2264 15%; bercak \u2264 3; busuk 0%', toleransi: 'Baret \u2264 15%, busuk 0%' },
    { grade: 'Kelas C (Pasar Lokal)', kriteria: 'Syarat umum OK; panjang \u2265 12cm; baret \u2264 25%; busuk 0%', toleransi: 'Baret \u2264 25%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Busuk di mana pun, crown busuk, baret dalam (menembus daging), atau thrips parah', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Kelas A (Ekspor/Premium)', maxGagalNonWajib: 0 },
    { grade: 'Kelas B (Pasar Modern)', maxGagalNonWajib: 2 },
    { grade: 'Kelas C (Pasar Lokal)', maxGagalNonWajib: 5 },
  ],
}

// ============================================================
// DOKUMEN C — TANPA SNI (Standar Platform)
// ============================================================

const SINGKONG: QAFormDefinition = {
  komoditas: 'Singkong',
  label: 'SINGKONG / UBI KAYU SEGAR',
  referensi: 'Standar Industri Tapioka & Permentan',
  dokumen: 'C',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM DASAR (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi umbi', 'Segar, keras, tidak lembek, tidak berlendir, tidak berjamur di permukaan'),
        p(2, 'Kebersihan', 'Bebas tanah berlebih, bebas benda asing — tidak harus dicuci, cukup dibersihkan dari tanah besar'),
        p(3, 'Kadar HCN (estimasi visual)', 'Varietas pahit (HCN tinggi) harus diberi label \u2018pahit\u2019 — TIDAK boleh campur dengan varietas manis'),
        p(4, 'Bau', 'Bebas bau busuk, bau asam fermentasi — aroma netral/segar singkong'),
        p(5, 'Tidak bertunas panjang', 'Tunas \u2264 3 cm masih dapat diterima — tunas panjang tanda simpan terlalu lama'),
      ],
    },
    {
      id: 'B', title: 'UMUR PANEN & SPESIFIKASI FISIK',
      parameters: [
        p(6, 'Umur panen optimal', '8\u201312 bulan setelah tanam untuk konsumsi; 10\u201324 bulan untuk industri (kadar pati lebih tinggi)'),
        p(7, 'Panjang umbi', 'Minimum 20 cm per umbi — umbi terlalu pendek (< 15 cm) sering tidak diterima industri'),
        p(8, 'Diameter pangkal', 'Minimum 4 cm — umbi terlalu kurus = rendemen pati rendah'),
        p(9, 'Berat minimum per umbi', 'Minimum 200 g untuk industri tapioka; pasar konsumsi tidak ada batasan berat minimum'),
      ],
    },
    {
      id: 'C', title: 'KERUSAKAN UMBI',
      parameters: [
        p(10, 'Luka / sayatan mekanis', 'Kelas I: \u2264 5% area permukaan; Kelas II: \u2264 15% — luka dalam mencapai isi = potensi busuk cepat'),
        p(11, 'Busuk sebagian', 'Semua kelas: 0% — singkong busuk tidak bisa diselamatkan, singkirkan seluruhnya'),
        p(12, 'Bercak hitam / biru dalam daging', '0% — bercak hitam/biru di daging (bluing) menandakan oksidasi atau kerusakan enzim'),
        p(13, 'Umbi bercabang berlebih', 'Kelas I: umbi lurus/sedikit percabangan; Kelas II: boleh bercabang — maks 2 cabang'),
      ],
    },
    {
      id: 'D', title: 'PENANGANAN PASCA PANEN (Kritis untuk Singkong)',
      parameters: [
        p(14, 'Batas waktu panen ke pengiriman', 'MAKSIMUM 24\u201348 jam setelah dicabut — singkong paling cepat rusak di antara semua umbi-umbian'),
        p(15, 'Perlakuan cut-end (ujung batang)', 'Ujung bekas batang dan akar dipotong — potongan rata memudahkan pengemasan'),
        p(16, 'Kemasan sementara', 'Tumpukan di wadah terbuka / karung longgar — BUKAN ditutup rapat'),
        p(17, 'Tidak dicuci sebelum kirim', 'Singkong TIDAK boleh dicuci sebelum pengiriman — air mempercepat pembusukan'),
      ],
    },
  ],
  grades: [
    { grade: 'Kelas I (Industri Premium)', kriteria: 'Segar, panjang \u2265 25cm, diameter \u2265 5cm, luka \u2264 5%, busuk 0%, dikirim < 24 jam', toleransi: 'Luka \u2264 5%, busuk 0%, < 24 jam' },
    { grade: 'Kelas II (Industri Standar)', kriteria: 'Segar, panjang \u2265 20cm, diameter \u2265 4cm, luka \u2264 15%, busuk 0%, dikirim < 48 jam', toleransi: 'Luka \u2264 15%, busuk 0%, < 48 jam' },
    { grade: 'TOLAK', kriteria: 'Busuk, bercak biru/hitam di daging, tunas > 5cm, atau dikirim > 48 jam setelah panen', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Kelas I (Industri Premium)', maxGagalNonWajib: 0 },
    { grade: 'Kelas II (Industri Standar)', maxGagalNonWajib: 3 },
  ],
}

const UBI_JALAR: QAFormDefinition = {
  komoditas: 'Ubi Jalar',
  label: 'UBI JALAR SEGAR',
  referensi: 'Standar Pasar & Balitkabi Kementan',
  dokumen: 'C',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM DASAR (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi umbi', 'Segar, keras, tidak lembek, tidak berlendir, tidak berjamur'),
        p(2, 'Keseragaman varietas', 'Hanya satu varietas warna daging dalam kemasan — putih, kuning, oranye, ungu tidak boleh campur'),
        p(3, 'Hama & penyakit', 'Bebas hama penggerek umbi (Cylas formicarius) — bekas penggerek terlihat dari lubang kecil'),
        p(4, 'Bau', 'Bebas bau busuk, bau fermentasi — aroma netral/manis khas ubi jalar'),
        p(5, 'Bebas tanah berlebih', 'Tanah dibersihkan dari permukaan — sisa tanah sedikit di lekukan masih dapat diterima'),
      ],
    },
    {
      id: 'B', title: 'UKURAN UMBI',
      parameters: [
        p(6, 'Kelas Besar', 'Berat umbi > 300 g; panjang > 20 cm — untuk pasar modern, industri keripik, horeka'),
        p(7, 'Kelas Sedang', 'Berat umbi 150 \u2013 300 g; panjang 12 \u2013 20 cm — pasar tradisional, konsumsi rumah tangga'),
        p(8, 'Kelas Kecil', 'Berat umbi 80 \u2013 150 g; panjang < 12 cm — industri tepung, pakan, atau pasar B-grade'),
        p(9, 'Keseragaman dalam kemasan', 'Variasi ukuran dalam satu kemasan maksimum satu kelas — tidak campur besar dan kecil'),
      ],
    },
    {
      id: 'C', title: 'KERUSAKAN UMBI',
      parameters: [
        p(10, 'Cacat mekanis (luka, goresan)', 'Kelas Besar: \u2264 5%; Kelas Sedang: \u2264 10%; Kelas Kecil: \u2264 15% dari jumlah umbi'),
        p(11, 'Busuk sebagian atau total', 'Semua kelas: 0% — singkirkan sebelum QA. Busuk menyebar cepat dalam kemasan'),
        p(12, 'Bekas penggerek / lubang', 'Kelas Besar: 0%; Kelas Sedang: \u2264 2% umbi; Kelas Kecil: \u2264 5% umbi'),
        p(13, 'Deformasi / bentuk sangat tidak beraturan', 'Kelas Besar: \u2264 3%; Kelas Sedang: \u2264 8%; Kelas Kecil: \u2264 15%'),
        p(14, 'Kulit pecah / retak besar', 'Kelas Besar & Sedang: \u2264 5%; Kelas Kecil: \u2264 10% — retak memudahkan masuknya jamur'),
      ],
    },
    {
      id: 'D', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(15, 'Curing (penyembuhan)', 'Ubi jalar sebaiknya dicuring 4\u20137 hari di suhu 28\u201330\u00b0C sebelum dikemas — memperkuat kulit'),
        p(16, 'Batas waktu pengiriman', 'Maksimum 7 hari dari panen (tanpa curing) atau 14 hari (dengan curing) di suhu ruang'),
        p(17, 'Kemasan', 'Karung jaring atau peti berlubang — memiliki sirkulasi udara; kapasitas max 50 kg'),
        p(18, 'Perlindungan benturan', 'Lapisi dengan kertas koran atau jerami antar lapis untuk mencegah memar saat transit'),
      ],
    },
  ],
  grades: [
    { grade: 'Kelas Besar (Super)', kriteria: 'Semua syarat OK; berat > 300g; cacat \u2264 5%; penggerek 0%; busuk 0%', toleransi: 'Cacat \u2264 5%, busuk/penggerek 0%' },
    { grade: 'Kelas Sedang', kriteria: 'Syarat umum OK; berat 150-300g; cacat \u2264 10%; penggerek \u2264 2%; busuk 0%', toleransi: 'Cacat \u2264 10%, busuk 0%' },
    { grade: 'Kelas Kecil', kriteria: 'Syarat umum OK; berat 80-150g; cacat \u2264 15%; busuk 0%', toleransi: 'Cacat \u2264 15%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Busuk di mana pun, penggerek parah, atau cacat melebihi batas kelas kecil', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Kelas Besar (Super)', maxGagalNonWajib: 0 },
    { grade: 'Kelas Sedang', maxGagalNonWajib: 2 },
    { grade: 'Kelas Kecil', maxGagalNonWajib: 4 },
  ],
}

const CABAI_RAWIT: QAFormDefinition = {
  komoditas: 'Cabai Rawit',
  label: 'CABAI RAWIT SEGAR',
  referensi: 'Mengacu SNI Cabai Merah 01-4480-1998 (Dimodifikasi)',
  dokumen: 'C',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi buah', 'Segar, tidak layu, tidak berkerut, bebas kerusakan fisik berat'),
        p(2, 'Kematangan', 'Merah merata \u2265 80% untuk pasar lokal; campuran merah-hijau \u2264 20% masih dapat diterima'),
        p(3, 'Hama & penyakit', 'Bebas thrips, tungau, busuk buah (antraknosa), dan penyakit layu'),
        p(4, 'Kebersihan', 'Bebas kotoran, tanah, benda asing, dan sisa pestisida yang terlihat'),
        p(5, 'Bau', 'Aroma pedas khas cabai rawit — bebas bau busuk, bau kimia'),
      ],
    },
    {
      id: 'B', title: 'KARAKTERISTIK SPESIFIK RAWIT',
      parameters: [
        p(6, 'Ukuran buah kecil (normal)', 'Panjang 1,5 \u2013 5 cm adalah ukuran normal untuk cabai rawit — BUKAN cacat ukuran'),
        p(7, 'Jenis rawit dalam kemasan', 'Rawit putih/hijau dan rawit merah TIDAK boleh campur dalam satu kemasan'),
        p(8, 'Tangkai buah', 'Dipetik dengan tangkai min. 0,5 cm — tangkai mempertahankan kesegaran lebih lama'),
        p(9, 'Tingkat kepedasan', 'Tidak ada alat ukur kepedasan di lapangan — catat varietas untuk referensi Supplier'),
      ],
    },
    {
      id: 'C', title: 'KESERAGAMAN & WARNA',
      parameters: [
        p(10, 'Warna Kelas Merah (Premium)', 'Merah merata \u2265 90% buah dalam batch — untuk pasar premium, bumbu instant'),
        p(11, 'Warna Kelas Campur', 'Merah \u2265 70%, hijau/oranye \u2264 30% — untuk pasar tradisional, konsumsi umum'),
        p(12, 'Keseragaman warna dalam batch', 'Untuk kelas campur, tidak boleh ada buah yang masih sepenuhnya hijau muda (belum matang)'),
      ],
    },
    {
      id: 'D', title: 'TINGKAT KERUSAKAN',
      parameters: [
        p(13, 'Cacat mekanis / lecet', 'Kelas Merah: \u2264 3%; Kelas Campur: \u2264 8% dari total buah dalam sampel 100 g'),
        p(14, 'Busuk sebagian / total', 'Semua kelas: 0% — busuk menyebar sangat cepat di antara cabai rawit yang kecil'),
        p(15, 'Serangan antraknosa (bercak coklat bulat)', 'Semua kelas: 0% — antraknosa adalah penyakit utama dan mudah menyebar'),
        p(16, 'Buah kisut / keriput', 'Kelas Merah: \u2264 2%; Kelas Campur: \u2264 5% — kisut menandakan kehilangan air berlebih'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN',
      parameters: [
        p(17, 'Wadah panen', 'Keranjang berlubang atau wadah dangkal — BUKAN karung tertutup'),
        p(18, 'Waktu panen ke pengiriman', 'Ideal: < 6 jam. Maks: 12 jam di suhu ruang; 3\u20135 hari jika didinginkan 8\u201310\u00b0C'),
        p(19, 'Pengemasan akhir', 'Kemasan ringan 1\u20135 kg untuk retail atau karung jaring 20\u201330 kg untuk grosir'),
      ],
    },
  ],
  grades: [
    { grade: 'Kelas Merah (Premium)', kriteria: 'Merah \u2265 90%; cacat \u2264 3%; busuk 0%; antraknosa 0%; segar tidak kisut', toleransi: 'Cacat \u2264 3%, busuk/antraknosa 0%' },
    { grade: 'Kelas Campur', kriteria: 'Merah \u2265 70%; cacat \u2264 8%; busuk 0%; antraknosa 0%', toleransi: 'Cacat \u2264 8%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Ada busuk, antraknosa ditemukan, atau kisut > batas, atau hijau mentah > 30%', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Kelas Merah (Premium)', maxGagalNonWajib: 0 },
    { grade: 'Kelas Campur', maxGagalNonWajib: 4 },
  ],
}

const SAYURAN_DAUN: QAFormDefinition = {
  komoditas: 'Sayuran Daun',
  label: 'SAYURAN DAUN SEGAR (KANGKUNG, BAYAM, SAWI, PAKCOY)',
  referensi: 'ASEAN GAP Produce Quality Module & Standar Hortikultura Kementan',
  dokumen: 'C',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi daun & batang', 'Segar, tegak (tidak layu/lemas), bersih, tidak kotor berlebih, bebas kerusakan berat'),
        p(2, 'Hama & penyakit', 'Bebas ulat daun, kutu daun (aphid), dan penyakit busuk daun (downy mildew)'),
        p(3, 'Kebersihan tanah', 'Akar dan batang bawah dibersihkan dari tanah — tanah mempercepat pembusukan'),
        p(4, 'Bau', 'Aroma segar khas masing-masing sayuran — bebas bau busuk, bau kimia pestisida'),
        p(5, 'Jenis dalam kemasan', 'Hanya satu jenis sayuran per kemasan — tidak boleh campur kangkung dengan bayam'),
      ],
    },
    {
      id: 'B', title: 'KONDISI DAUN (ASEAN GAP Produce Quality)',
      parameters: [
        p(6, 'Warna daun', 'Hijau segar merata sesuai jenis — tidak ada yellowing (menguning) lebih dari 10% per ikat'),
        p(7, 'Daun layu / lemas', 'Kelas I: 0 daun layu; Kelas II: \u2264 10% daun per ikat terlihat layu tapi tidak busuk'),
        p(8, 'Daun berlubang (bekas ulat)', 'Kelas I: \u2264 3% luas daun per ikat; Kelas II: \u2264 10% — jika ulat masih ada = tolak'),
        p(9, 'Daun menguning / nekrosis', 'Kelas I: \u2264 5% daun; Kelas II: \u2264 15% — nekrosis = jaringan daun mati'),
        p(10, 'Daun busuk / berlendir', 'Semua kelas: 0% — satu daun busuk mengontaminasi seluruh ikat'),
      ],
    },
    {
      id: 'C', title: 'KONDISI BATANG & AKAR',
      parameters: [
        p(11, 'Kondisi batang', 'Batang masih segar, tidak berlubang, tidak berlendir, tidak busuk di pangkal'),
        p(12, 'Panjang batang seragam', 'Dalam satu ikat: variasi panjang maksimum 5 cm'),
        p(13, 'Akar (jika ikut dipanen)', 'Akar dipotong bersih atau dibiarkan menempel — BUKAN akar busuk yang dibiarkan'),
        p(14, 'Batang berlubang (bayam)', 'Bayam batang berlubang = tanda sudah terlalu tua/bolting — tolak atau turunkan kelas'),
      ],
    },
    {
      id: 'D', title: 'UKURAN IKAT & BERAT',
      parameters: [
        p(15, 'Berat per ikat standar', '250 g atau 500 g per ikat sesuai permintaan Supplier — seragam dalam satu pengiriman'),
        p(16, 'Kerapatan ikat', 'Diikat tidak terlalu kencang — tekanan berlebih memar batang dan mempercepat pembusukan'),
        p(17, 'Ukuran tanaman', 'Kelas I: tinggi/panjang seragam \u00b115%; Kelas II: variasi \u00b130% masih diterima'),
      ],
    },
    {
      id: 'E', title: 'PENANGANAN PASCA PANEN (KRITIS)',
      parameters: [
        p(18, 'Waktu panen ke pengiriman', 'MAKS 4\u20136 jam di suhu ruang; 1\u20132 hari jika didinginkan 4\u20138\u00b0C'),
        p(19, 'Waktu panen optimal', 'Panen dini hari (04:00\u201307:00) — suhu rendah, turgiditas daun maksimal'),
        p(20, 'Pendinginan segera (pre-cooling)', 'Rendam akar/pangkal batang dalam air dingin bersih 15\u201320 menit setelah panen'),
        p(21, 'Kemasan akhir', 'Ikat dimasukkan standing tegak dalam kardus berlubang atau wadah plastik berlubang'),
      ],
    },
  ],
  grades: [
    { grade: 'Kelas I (Premium)', kriteria: 'Segar, hijau merata, daun layu 0%, lubang \u2264 3%, busuk 0%, dipanen dini hari, sampai < 4 jam', toleransi: 'Lubang \u2264 3%, busuk/layu 0%' },
    { grade: 'Kelas II (Standar)', kriteria: 'Segar, layu \u2264 10%, lubang \u2264 10%, kuning \u2264 15%, busuk 0%, sampai < 6 jam', toleransi: 'Lubang \u2264 10%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Ada busuk/lendir, ulat masih hidup di daun, layu parah tidak bisa pulih, atau bau busuk', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Kelas I (Premium)', maxGagalNonWajib: 0 },
    { grade: 'Kelas II (Standar)', maxGagalNonWajib: 4 },
  ],
}

// ============================================================
// GENERIC FALLBACK — for komoditas without specific form
// ============================================================

const GENERIC: QAFormDefinition = {
  komoditas: 'Generic',
  label: 'INSPEKSI KUALITAS UMUM',
  referensi: 'Standar Internal TaniDirect',
  dokumen: 'generic',
  sections: [
    {
      id: 'A', title: 'PERSYARATAN UMUM (Wajib Lulus Semua)', wajibLulusSemua: true,
      parameters: [
        p(1, 'Kondisi fisik produk', 'Produk utuh, tidak rusak parah, layak konsumsi / layak proses'),
        p(2, 'Kebersihan', 'Bebas kotoran, tanah, benda asing, residu yang terlihat'),
        p(3, 'Hama & penyakit', 'Bebas serangan hama dan penyakit yang terlihat secara visual'),
        p(4, 'Bau', 'Aroma normal sesuai produk — bebas bau busuk, bau fermentasi, bau asing'),
        p(5, 'Kematangan / kesiapan', 'Sesuai tingkat kematangan atau kesiapan yang diminta supplier'),
      ],
    },
    {
      id: 'B', title: 'KESERAGAMAN & TAMPILAN',
      parameters: [
        p(6, 'Keseragaman varietas/jenis', 'Satu varietas/jenis dalam satu kemasan — tidak boleh campur'),
        p(7, 'Keseragaman ukuran', 'Ukuran relatif seragam dalam kemasan — variasi wajar'),
        p(8, 'Warna / penampilan', 'Sesuai standar produk — tidak ada perubahan warna abnormal'),
      ],
    },
    {
      id: 'C', title: 'TINGKAT KERUSAKAN',
      parameters: [
        p(9, 'Cacat fisik', 'Mutu I: \u2264 5%; Mutu II: \u2264 10% dari total produk dalam sampel'),
        p(10, 'Busuk / rusak', 'Semua mutu: 0% — produk busuk harus disingkirkan sebelum dikemas'),
        p(11, 'Serangan hama / lubang', 'Mutu I: 0%; Mutu II: \u2264 2% dari jumlah produk'),
      ],
    },
    {
      id: 'D', title: 'PENGEMASAN & PENANGANAN',
      parameters: [
        p(12, 'Kemasan sesuai produk', 'Wadah bersih, berlubang/berventilasi sesuai kebutuhan produk'),
        p(13, 'Label kemasan', 'Nama produk, mutu, berat, asal Poktan, tanggal panen/sortir'),
        p(14, 'Kondisi kemasan', 'Tidak rusak, tidak basah, tidak terkontaminasi'),
      ],
    },
  ],
  grades: [
    { grade: 'Mutu I (Premium)', kriteria: 'Semua syarat umum OK; cacat \u2264 5%; busuk 0%', toleransi: 'Cacat \u2264 5%, busuk 0%' },
    { grade: 'Mutu II (Standar)', kriteria: 'Syarat umum OK; cacat \u2264 10%; busuk 0%', toleransi: 'Cacat \u2264 10%, busuk 0%' },
    { grade: 'TOLAK', kriteria: 'Gagal persyaratan umum atau melebihi batas Mutu II', toleransi: '\u2014' },
  ],
  gradeRules: [
    { grade: 'Mutu I (Premium)', maxGagalNonWajib: 0 },
    { grade: 'Mutu II (Standar)', maxGagalNonWajib: 2 },
  ],
}

// ============================================================
// MAPPING & LOOKUP
// ============================================================

const FORM_DEFINITIONS: QAFormDefinition[] = [
  TOMAT, KENTANG, WORTEL, BAWANG_PUTIH, KEDELAI, BERAS,
  KUBIS, MANGGA, PISANG,
  SINGKONG, UBI_JALAR, CABAI_RAWIT, SAYURAN_DAUN,
]

// Komoditas names → form definition
const KOMODITAS_MAP: Record<string, QAFormDefinition> = {
  // Dok A — SNI Lengkap
  'Tomat': TOMAT,
  'Kentang': KENTANG,
  'Wortel': WORTEL,
  'Bawang Putih': BAWANG_PUTIH,
  'Kedelai': KEDELAI,
  'Beras': BERAS,
  // Dok B — SNI Terbatas
  'Kubis': KUBIS,
  'Mangga': MANGGA,
  'Pisang': PISANG,
  // Dok C — Tanpa SNI
  'Singkong': SINGKONG,
  'Ubi Jalar': UBI_JALAR,
  'Cabai Rawit': CABAI_RAWIT,
  // Sayuran daun (multiple komoditas → same form)
  'Kangkung': SAYURAN_DAUN,
  'Bayam': SAYURAN_DAUN,
  'Sawi': SAYURAN_DAUN,
  'Pakcoy': SAYURAN_DAUN,
  // Cabai Merah uses modified Cabai Rawit form
  'Cabai Merah': CABAI_RAWIT,
}

export function getQAForm(komoditas: string): QAFormDefinition {
  return KOMODITAS_MAP[komoditas] || { ...GENERIC, komoditas, label: komoditas.toUpperCase(), gradeRules: GENERIC.gradeRules }
}

export function getAvailableKomoditas(): string[] {
  return Object.keys(KOMODITAS_MAP)
}

// ============================================================
// DRAFT HELPERS (localStorage)
// ============================================================

const DRAFT_PREFIX = 'qa-draft-'

export function saveDraft(draft: QADraft): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DRAFT_PREFIX + draft.transaksi_id, JSON.stringify(draft))
}

export function loadDraft(transaksiId: string): QADraft | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(DRAFT_PREFIX + transaksiId)
  if (!raw) return null
  try {
    return JSON.parse(raw) as QADraft
  } catch {
    return null
  }
}

export function deleteDraft(transaksiId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DRAFT_PREFIX + transaksiId)
}

export function getAllDraftIds(): string[] {
  if (typeof window === 'undefined') return []
  const ids: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(DRAFT_PREFIX)) {
      ids.push(key.slice(DRAFT_PREFIX.length))
    }
  }
  return ids
}
