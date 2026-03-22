export const SOP_SECTIONS = [
  {
    id: 'aturan-umum',
    title: 'Aturan Umum Platform',
    content: [
      {
        subtitle: 'Kualitas Produk',
        items: [
          'Setiap pengiriman wajib melalui proses QA (Quality Assurance) oleh Ketua Poktan.',
          'Foto bukti kualitas wajib diunggah minimal 3 foto per inspeksi.',
          'Standar grade mengikuti ketentuan platform: Grade A (Premium), Grade B (Standar), Grade C (Ekonomi).',
          'Toleransi penyimpangan volume maksimal 5% dari estimasi awal.',
        ],
      },
      {
        subtitle: 'Pembayaran & Escrow',
        items: [
          'Supplier wajib membayar deposit escrow 10% dari nilai pre-order sebelum matching.',
          'Dana escrow disimpan oleh platform dan dicairkan setelah transaksi selesai.',
          'Pencairan ke petani dilakukan dalam 3 hari kerja setelah transaksi dikonfirmasi selesai.',
          'Biaya admin pencairan: Rp 2.500 per transaksi (bank transfer) atau Rp 1.000 (e-wallet).',
        ],
      },
      {
        subtitle: 'Komisi Platform',
        items: [
          'Komisi platform sebesar 2% dari total nilai transaksi.',
          'Fee QA untuk Ketua Poktan sebesar 1% dari nilai inspeksi.',
          'Potongan fee QA berlaku jika skor kualitas di bawah standar.',
        ],
      },
    ],
  },
  {
    id: 'dispute-resolution',
    title: 'Penyelesaian Sengketa (Dispute Resolution)',
    content: [
      {
        subtitle: 'S-01: Sengketa Kualitas',
        items: [
          'Berlaku jika kualitas barang tidak sesuai grade yang dijanjikan.',
          'Supplier bisa ajukan dispute dalam 24 jam setelah barang diterima.',
          'Bukti foto sebelum & sesudah wajib dilampirkan.',
          'Kompensasi: diskon 10-30% untuk Grade turun 1 level, retur penuh jika tidak layak.',
        ],
      },
      {
        subtitle: 'S-02: Sengketa Keterlambatan',
        items: [
          'Berlaku jika pengiriman terlambat lebih dari 24 jam dari estimasi.',
          'Kompensasi: diskon 5% per hari keterlambatan (maks 20%).',
          'Jika lebih dari 3 hari terlambat, supplier berhak membatalkan dengan pengembalian deposit.',
        ],
      },
      {
        subtitle: 'S-03: Sengketa Volume',
        items: [
          'Berlaku jika volume aktual menyimpang lebih dari 5% dari estimasi.',
          'Kekurangan 5-10%: penyesuaian harga pro-rata.',
          'Kekurangan >10%: supplier berhak menolak + pengembalian deposit proporsional.',
        ],
      },
      {
        subtitle: 'S-04: Sengketa Pembayaran',
        items: [
          'Berlaku jika pencairan tidak dilakukan dalam 3 hari kerja.',
          'Platform wajib menyelesaikan dalam 24 jam setelah laporan.',
          'Jika kesalahan platform: kompensasi bunga 0.1% per hari keterlambatan.',
        ],
      },
      {
        subtitle: 'S-05: Sengketa Pembatalan',
        items: [
          'Pembatalan oleh supplier setelah matching: kehilangan 50% deposit.',
          'Pembatalan oleh poktan setelah konfirmasi: penalti 5% dari nilai transaksi.',
          'Force majeure (bencana alam, dll): pembatalan tanpa penalti dengan bukti valid.',
        ],
      },
    ],
  },
  {
    id: 'kompensasi-penalti',
    title: 'Kompensasi & Penalti',
    tableHeaders: ['Skenario', 'Kompensasi/Penalti', 'Batas Waktu'],
    tableRows: [
      ['Kualitas turun 1 grade', 'Diskon 10-30%', '24 jam setelah terima'],
      ['Kualitas tidak layak', 'Retur penuh + ongkir', '24 jam setelah terima'],
      ['Terlambat 1-3 hari', 'Diskon 5%/hari (maks 20%)', 'Otomatis'],
      ['Terlambat >3 hari', 'Hak batal + refund deposit', 'Otomatis'],
      ['Volume kurang 5-10%', 'Penyesuaian harga pro-rata', '48 jam'],
      ['Volume kurang >10%', 'Hak tolak + refund deposit', '48 jam'],
      ['Pencairan terlambat', 'Bunga 0.1%/hari', 'Setelah laporan'],
      ['Batal oleh supplier', 'Kehilangan 50% deposit', 'Langsung'],
      ['Batal oleh poktan', 'Penalti 5% nilai transaksi', 'Langsung'],
    ],
  },
  {
    id: 'matriks-eskalasi',
    title: 'Matriks Eskalasi',
    tableHeaders: ['Level', 'Penanganan', 'Waktu Respon', 'Pengambil Keputusan'],
    tableRows: [
      ['Level 1 - Otomatis', 'Sistem menghitung kompensasi otomatis', '< 1 jam', 'Sistem'],
      ['Level 2 - CS', 'Customer Service mediasi kedua pihak', '< 24 jam', 'CS Staff'],
      ['Level 3 - Manager', 'Manajer operasional review kasus', '< 48 jam', 'Ops Manager'],
      ['Level 4 - Direksi', 'Keputusan final untuk kasus besar (>Rp 50jt)', '< 72 jam', 'Direksi'],
    ],
  },
  {
    id: 'hak-kewajiban',
    title: 'Hak & Kewajiban',
    content: [
      {
        subtitle: 'Petani & Poktan',
        items: [
          'Wajib memberikan estimasi volume dan jadwal panen yang akurat.',
          'Wajib mengikuti proses QA sebelum pengiriman.',
          'Berhak menerima pembayaran tepat waktu sesuai kesepakatan.',
          'Berhak mengajukan banding 1x per transaksi jika merasa keputusan tidak adil.',
        ],
      },
      {
        subtitle: 'Supplier',
        items: [
          'Wajib membayar deposit escrow sebelum matching.',
          'Wajib menerima barang yang sudah lulus QA sesuai grade.',
          'Berhak menolak barang yang tidak sesuai spesifikasi dengan bukti.',
          'Berhak mengajukan dispute dalam batas waktu yang ditentukan.',
        ],
      },
      {
        subtitle: 'Platform (taninesia)',
        items: [
          'Wajib menjaga dana escrow dengan aman.',
          'Wajib memproses pencairan dalam 3 hari kerja.',
          'Wajib menyelesaikan dispute sesuai SLA yang ditentukan.',
          'Berhak memotong komisi dan fee sesuai ketentuan.',
        ],
      },
    ],
  },
  {
    id: 'proses-banding',
    title: 'Proses Banding',
    content: [
      {
        subtitle: 'Ketentuan Banding',
        items: [
          'Setiap pihak berhak mengajukan banding 1 kali per transaksi.',
          'Banding harus disertai bukti baru yang belum disampaikan sebelumnya.',
          'Banding diajukan maksimal 7 hari setelah keputusan dispute.',
          'Keputusan banding bersifat final dan mengikat kedua pihak.',
          'Banding ditangani oleh level eskalasi yang lebih tinggi dari keputusan awal.',
        ],
      },
    ],
  },
]
