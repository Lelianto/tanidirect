# PROPOSAL 1st SUBMISSION
# Digdaya x Hackathon PIDI 2026

---

## 1. TEAM IDENTITY

**Nama Tim:** [ISI]

**Ketua Tim:** [ISI]

**Anggota Tim:**
1. [ISI] — [Peran]
2. [ISI] — [Peran]
3. [ISI] — [Peran]

**Institusi/Afiliasi:** [ISI]

**Kontak (Email/HP):** [ISI]

### Ringkasan Tim
<!-- Maks 600 karakter -->

[ISI — Deskripsikan latar belakang tim, keahlian masing-masing anggota, dan pengalaman relevan yang dimiliki tim dalam bidang teknologi pertanian, pengembangan platform digital, atau riset ketahanan pangan.]

### Executive Summary
<!-- Maks 600 karakter -->

Taninesia adalah platform marketplace B2B pertanian berbasis AI yang menghubungkan Kelompok Tani (Poktan) langsung dengan supplier dan pembeli institusional, mengeliminasi 3-5 lapisan tengkulak dalam rantai pasok komoditas. Platform ini mengintegrasikan lima modul AI — demand-supply matching, auto-grading QA, credit scoring, price prediction, dan anomaly detection — untuk meningkatkan pendapatan petani hingga 2-3x lipat sekaligus menekan post-harvest loss secara signifikan. Prototipe fungsional telah live di taninesia.vercel.app dengan arsitektur 40+ tabel data dan 75+ API endpoint.

---

## 2. PROBLEM STATEMENT

**Problem Statement yang Dipilih:** Pilar 2 — Peningkatan Produktivitas, Ketahanan Pangan, dan Penciptaan Lapangan Kerja

**Sub-Problem Acuan:**
- **Utama:** Digitalisasi Ketahanan Pangan (Platform Penjualan Langsung, Demand-Supply Matching, Pembiayaan Petani, Logistik Pangan Cerdas)
- **Sekunder:** Inklusi Ekonomi UMKM (Credit Scoring, B2B Matchmaking)

### Tujuan Utama
<!-- Maks 800 karakter -->

Tujuan utama Taninesia adalah membangun ekosistem digital pertanian B2B yang memutus ketergantungan 33,4 juta rumah tangga petani terhadap rantai tengkulak, sehingga petani memperoleh bagian harga yang adil dari komoditas yang mereka hasilkan. Secara spesifik, platform ini bertujuan: (1) Meningkatkan pendapatan petani dari 20-30% menjadi 60-70% dari harga akhir komoditas melalui koneksi langsung Poktan ke Supplier tanpa perantara; (2) Menurunkan post-harvest loss dari 20-40% menjadi di bawah 10% melalui demand-supply matching berbasis AI yang akurat; (3) Membuka akses pembiayaan formal bagi petani melalui credit scoring berbasis data transaksi digital di platform; (4) Memperkuat ketahanan pangan nasional melalui transparansi data supply-demand komoditas secara real-time lintas wilayah.

---

## 3. PROBLEM DEFINITION

### Masalah Utama yang Ingin Diselesaikan
<!-- Maks 1000 karakter -->

Rantai pasok pertanian Indonesia didominasi oleh 3-5 lapisan perantara (tengkulak) yang menyerap 70-80% nilai ekonomi komoditas, menyisakan hanya 20-30% bagi petani sebagai produsen utama. Struktur ini menciptakan tiga masalah kritis yang saling terkait. Pertama, asimetri informasi: petani tidak mengetahui harga pasar aktual, tren permintaan, maupun kebutuhan spesifik pembeli institusional, sehingga terpaksa menerima harga rendah yang didikte tengkulak tanpa daya tawar. Kedua, inefisiensi logistik dan post-harvest loss mencapai 20-40% (FAO) karena tidak adanya mekanisme matching antara supply dan demand secara real-time — komoditas membusuk sebelum menemukan pembeli yang tepat. Ketiga, eksklusi finansial: petani sulit mengakses kredit formal karena tidak memiliki rekam jejak transaksi yang terdigitalisasi sebagai basis penilaian kelayakan kredit. Ketiga masalah ini saling memperkuat dalam siklus kemiskinan struktural yang menghambat produktivitas dan ketahanan pangan nasional.

### Siapa yang Paling Terdampak
<!-- Maks 700 karakter -->

Pihak yang paling terdampak adalah 33,4 juta rumah tangga petani Indonesia (BPS 2023), khususnya petani skala kecil dengan lahan di bawah 0,5 hektar yang tergabung dalam 72.000+ Kelompok Tani (Poktan). Mereka menghadapi posisi tawar lemah terhadap tengkulak, tidak memiliki akses langsung ke pasar institusional, dan tereksklusi dari sistem keuangan formal. Dampak sekunder dirasakan oleh supplier dan pembeli institusional (hotel, restoran, katering, industri pengolahan) yang kesulitan mendapatkan pasokan komoditas berkualitas konsisten dengan harga transparan. Secara makro, konsumen akhir turut menanggung beban harga pangan tinggi akibat inefisiensi berlapis dalam rantai pasok.

### Bukti dan Data Pendukung Masalah
<!-- Maks 800 karakter -->

Data BPS 2023 mencatat 33,4 juta rumah tangga petani Indonesia dengan mayoritas berskala kecil (lahan di bawah 0,5 hektar). Studi World Bank menunjukkan petani Indonesia hanya menerima 20-30% dari harga akhir komoditas, jauh di bawah benchmark 40-60% di negara dengan rantai pasok terdigitalisasi. FAO melaporkan post-harvest loss komoditas pertanian Indonesia mencapai 20-40%, setara kerugian puluhan triliun rupiah per tahun. Survei Bank Indonesia mengungkapkan hanya 22% pelaku UMKM sektor pertanian yang berhasil mengakses kredit formal dari perbankan. Sementara itu, 72.000+ Poktan yang terdaftar di Kementerian Pertanian belum terdigitalisasi secara memadai untuk terhubung langsung dengan pasar institusional, menciptakan gap besar yang dapat dijembatani oleh teknologi digital.

---

## 4. PROPOSED SOLUTION

### Solusi Inti
<!-- Maks 900 karakter -->

Taninesia adalah platform marketplace B2B pertanian berbasis AI yang menghubungkan Poktan langsung ke supplier dan pembeli institusional tanpa perantara, mengubah rantai pasok berlapis menjadi koneksi langsung. Platform ini mengintegrasikan lima modul AI yang saling memperkuat: (1) Demand-Supply Matching — mencocokkan kebutuhan pembeli dengan ketersediaan komoditas Poktan secara real-time berdasarkan lokasi, volume, dan kualitas; (2) Auto-Grading QA — penilaian kualitas komoditas otomatis berbasis parameter standar; (3) Credit Scoring — penilaian kelayakan kredit petani berdasarkan akumulasi riwayat transaksi digital; (4) Price Prediction — prediksi harga komoditas untuk membantu petani menentukan waktu jual optimal; (5) Anomaly Detection — deteksi transaksi mencurigakan untuk keamanan ekosistem. Seluruh modul berjalan di atas Groq LLaMA 3.3 70B untuk inferensi cepat dan efisien.

### Gambar/Skema Solusi

> **[CATATAN UNTUK TIM]:** Tambahkan diagram arsitektur atau skema alur solusi Taninesia di sini. Dapat berupa screenshot dari taninesia.vercel.app atau diagram yang dibuat terpisah.

### Cara Kerja Solusi
<!-- Maks 900 karakter -->

Alur kerja Taninesia terdiri dari empat tahap terintegrasi. **Registrasi:** Poktan mendaftar dan menginput data komoditas (jenis, volume, lokasi, jadwal panen, kualitas) melalui dashboard intuitif yang dirancang untuk pengguna dengan literasi digital beragam. **Matching:** Sistem AI secara otomatis mencocokkan data supply Poktan dengan demand dari pembeli institusional yang terdaftar, mempertimbangkan lokasi geografis, volume kebutuhan, preferensi kualitas, dan waktu pengiriman optimal. **Transaksi:** Setelah match ditemukan, kedua pihak melakukan negosiasi dan transaksi langsung melalui platform dengan transparansi penuh. Sistem QA melakukan auto-grading untuk memastikan standar kualitas terpenuhi. **Pasca-Transaksi:** Data transaksi terakumulasi menjadi basis credit scoring yang membuka akses pembiayaan. Price prediction membantu Poktan merencanakan waktu jual optimal berikutnya.

---

## 5. IMPACT & OUTCOME

### Manfaat Utama
<!-- Maks 800 karakter -->

Manfaat utama Taninesia mencakup tiga dimensi strategis. **Ekonomi:** Peningkatan pendapatan petani 2-3x lipat melalui eliminasi tengkulak dan akses langsung ke harga pasar transparan. Penghematan biaya pengadaan bagi pembeli institusional hingga 15-25%. **Ketahanan Pangan:** Penurunan post-harvest loss melalui demand-supply matching yang presisi, memastikan komoditas terdistribusi tepat waktu sebelum rusak. Transparansi data supply-demand real-time mendukung perencanaan ketahanan pangan nasional dan daerah. **Inklusi Finansial:** Rekam jejak transaksi digital membuka akses kredit formal bagi petani yang sebelumnya unbanked, memungkinkan investasi untuk peningkatan produktivitas. Penciptaan lapangan kerja baru di ekosistem logistik pertanian digital.

### Dampak Jangka Pendek dan Menengah
<!-- Maks 600 karakter -->

**Jangka Pendek (0-12 bulan):** Onboarding 100+ Poktan aktif di 5 kabupaten sentra produksi, memfasilitasi transaksi langsung senilai Rp 1 miliar, dan membuktikan peningkatan pendapatan petani minimal 50% dibandingkan jalur tengkulak. Validasi seluruh modul AI dengan data riil. **Jangka Menengah (1-3 tahun):** Ekspansi ke 1.000+ Poktan di 10 provinsi sentra produksi, integrasi pembiayaan formal dengan lembaga keuangan mitra, dan kontribusi data supply-demand real-time untuk dashboard ketahanan pangan daerah. Target penurunan post-harvest loss 50% di wilayah cakupan.

---

## 6. INNOVATION

### Keunikan Solusi
<!-- Maks 700 karakter -->

Taninesia memiliki tiga keunikan fundamental. Pertama, pendekatan B2B-first yang fokus pada transaksi Poktan-ke-Supplier institusional, bukan petani individu ke konsumen akhir, sehingga volume transaksi lebih besar dan dampak ekonomi lebih terukur. Kedua, integrasi lima modul AI dalam satu ekosistem (matching, grading, credit scoring, price prediction, anomaly detection) yang saling memperkuat — data transaksi memperbaiki credit scoring, yang membuka pembiayaan, yang meningkatkan volume transaksi. Ketiga, arsitektur dioptimalkan untuk latensi rendah menggunakan Groq LLaMA 3.3 70B, memungkinkan inferensi AI real-time bahkan di daerah dengan konektivitas terbatas.

### Posisi Dibandingkan Solusi yang Sudah Ada
<!-- Maks 700 karakter -->

Platform pertanian existing seperti TaniHub, Sayurbox, dan Lima Farm fokus pada model B2C/D2C yang melayani konsumen urban individual, bukan pembeli institusional berskala besar. Mereka beroperasi sebagai reseller yang membeli dari petani lalu menjual kembali, tetap menambah lapisan perantara. Taninesia berbeda: (1) murni B2B marketplace yang menghubungkan Poktan langsung ke pembeli institusional; (2) bertindak sebagai fasilitator transaksi peer-to-peer, bukan reseller; (3) dilengkapi AI credit scoring yang membuka akses pembiayaan formal — fitur yang tidak dimiliki platform existing; (4) model revenue berbasis fee transaksi kecil (2%), bukan margin jual-beli yang membebani petani.

---

## 7. TECHNICAL APPROACH

### Teknologi Utama yang Digunakan
<!-- Maks 700 karakter -->

Taninesia dibangun dengan stack teknologi modern yang mengutamakan performa dan skalabilitas. **Frontend:** Next.js 16 dengan React 19 untuk server-side rendering, streaming SSR, dan pengalaman pengguna responsif di berbagai perangkat. **Backend & Database:** Supabase (PostgreSQL) dengan 40+ tabel relasional dinormalisasi, Row Level Security, dan real-time subscriptions untuk update data instan. **AI/ML:** Groq LLaMA 3.3 70B untuk inferensi AI dengan latensi ultra-rendah. **API:** 75+ endpoint RESTful mencakup seluruh fungsionalitas platform. **Deployment:** Vercel untuk hosting dengan edge functions dan automatic scaling. Prototipe telah live di taninesia.vercel.app.

### Alasan Pemilihan Teknologi
<!-- Maks 600 karakter -->

Next.js 16 + React 19 dipilih karena mendukung Server Components dan streaming SSR yang krusial untuk performa di jaringan lambat pedesaan. Supabase dipilih sebagai backend karena menyediakan PostgreSQL terkelola dengan built-in auth, real-time, dan Row Level Security — mempercepat development tanpa mengorbankan keamanan. Groq dipilih untuk inferensi AI karena throughput 10-50x lebih cepat dari GPU tradisional, memungkinkan penggunaan model 70B parameter dengan latensi sub-detik. Seluruh stack bersifat open-source friendly, cost-efficient untuk tahap awal, dan siap production scale.

### Algoritma atau Model AI
<!-- Maks 700 karakter -->

Lima modul AI diimplementasikan di atas Groq LLaMA 3.3 70B sebagai backbone inferensi. **Demand-Supply Matching:** Algoritma multi-criteria matching mempertimbangkan komoditas, volume, lokasi, waktu, dan preferensi kualitas menggunakan weighted scoring. **Auto-Grading QA:** Penilaian kualitas berdasarkan parameter standar (kadar air, ukuran, kerusakan) dengan output grade A/B/C. **Credit Scoring:** Model scoring berbasis riwayat transaksi, konsistensi supply, dan ketepatan pengiriman. **Price Prediction:** Time-series forecasting harga komoditas berdasarkan data historis dan faktor musiman. **Anomaly Detection:** Identifikasi pola transaksi abnormal untuk pencegahan fraud secara proaktif.

### Data atau Input yang Dibutuhkan
<!-- Maks 900 karakter -->

Taninesia membutuhkan empat kategori data. **Data Poktan & Komoditas:** Profil Poktan, jenis komoditas, kapasitas produksi, lokasi geografis, jadwal panen, dan foto produk — diinput langsung oleh Poktan melalui dashboard. **Data Permintaan:** Kebutuhan pembeli institusional meliputi jenis komoditas, volume, frekuensi pembelian, standar kualitas, dan lokasi pengiriman — diinput oleh pembeli saat registrasi dan pemesanan. **Data Transaksi:** Riwayat seluruh transaksi yang terjadi di platform (harga, volume, waktu, rating kedua pihak) menjadi basis untuk credit scoring dan price prediction. **Data Referensi Eksternal:** Harga komoditas dari pasar induk dan BPS sebagai benchmark, data cuaca untuk prediksi panen, serta regulasi standar kualitas dari Kementerian Pertanian. Seluruh data disimpan di Supabase PostgreSQL dengan enkripsi at-rest dan strict Row Level Security per role pengguna.

### Keamanan dan Skalabilitas
<!-- Maks 600 karakter -->

**Keamanan:** Row Level Security (RLS) di Supabase memastikan setiap pengguna hanya mengakses data miliknya. Autentikasi multi-layer dengan Supabase Auth. Enkripsi data at-rest dan in-transit. Anomaly detection otomatis untuk pencegahan fraud. **Skalabilitas:** Arsitektur serverless di Vercel dengan auto-scaling horizontal sesuai beban trafik. Supabase PostgreSQL mendukung connection pooling untuk ribuan koneksi simultan. Edge functions meminimalkan latensi untuk pengguna di berbagai wilayah Indonesia. Desain database dinormalisasi untuk mendukung pertumbuhan hingga jutaan transaksi.

---

## 8. IMPLEMENTATION

**Status Inovasi Saat Ini:** Prototipe Fungsional — Platform telah live di taninesia.vercel.app dengan 40+ tabel database, 75+ API endpoint, dan seluruh modul utama telah terimplementasi.

### Realistiskah Solusi Ini Diimplementasikan?
<!-- Maks 700 karakter -->

Taninesia sangat realistis untuk diimplementasikan karena tiga alasan kuat. Pertama, prototipe fungsional sudah berjalan — bukan sekadar konsep, melainkan platform operasional yang dapat diakses dan diuji langsung di taninesia.vercel.app dengan fitur lengkap. Kedua, seluruh teknologi yang digunakan (Next.js, Supabase, Groq) bersifat production-ready dan telah terbukti andal di skala besar. Ketiga, model bisnis berbasis fee transaksi kecil (2%) memastikan biaya rendah bagi pengguna sekaligus revenue berkelanjutan. Tantangan utama adalah akuisisi pengguna awal, yang akan diatasi melalui kemitraan dengan Dinas Pertanian daerah dan pendekatan langsung ke Poktan di sentra produksi.

### Tahapan Pengembangan
<!-- Maks 900 karakter -->

**Fase 1 — Validasi (Bulan 1-3):** Pilot di 2-3 kabupaten sentra produksi, onboarding 50 Poktan dan 20 pembeli institusional. Validasi product-market fit dan iterasi UX berdasarkan feedback lapangan. Target: 100 transaksi berhasil. **Fase 2 — Optimasi (Bulan 4-6):** Penyempurnaan modul AI berdasarkan data transaksi riil. Integrasi payment gateway untuk transaksi langsung dalam aplikasi. Pengembangan fitur logistik dan tracking pengiriman real-time. Target: 500 transaksi, 100 Poktan aktif. **Fase 3 — Skalasi (Bulan 7-12):** Ekspansi ke 10 kabupaten sentra produksi, kemitraan dengan lembaga keuangan untuk aktivasi fitur pembiayaan. Peluncuran credit scoring berbasis akumulasi data transaksi. Target: 2.000 transaksi, 300 Poktan. **Fase 4 — Pertumbuhan (Tahun 2-3):** Ekspansi skala nasional, integrasi dengan sistem informasi Kementerian Pertanian, dan pengembangan fitur logistik end-to-end.

### Model Bisnis
<!-- Maks 1000 karakter -->

Taninesia mengadopsi model revenue tiga pilar yang berkelanjutan dan dirancang tidak membebani petani. **Pilar 1 — Transaction Fee (2%):** Biaya sebesar 2% dari nilai setiap transaksi yang berhasil, dibagi antara penjual (1%) dan pembeli (1%). Dengan asumsi GMV Rp 10 miliar di tahun kedua, revenue dari pilar ini mencapai Rp 200 juta per tahun. **Pilar 2 — QA Service Fee (Rp 50/kg):** Biaya jasa auto-grading kualitas komoditas oleh sistem AI untuk memastikan standar terpenuhi. Dengan volume 1.000 ton per bulan di tahun kedua, revenue mencapai Rp 50 juta/bulan. **Pilar 3 — Pembiayaan (Bunga Kredit):** Margin bunga dari fasilitas kredit yang disalurkan melalui kemitraan dengan lembaga keuangan, berdasarkan credit scoring yang dihasilkan platform. Target aktivasi di tahun kedua. Model ini dirancang agar biaya per transaksi sangat rendah bagi petani, namun menghasilkan revenue signifikan seiring pertumbuhan volume. Unit economics positif ditargetkan pada pencapaian GMV Rp 5 miliar/bulan.

---

## 9. ATTACHMENT

### Screenshots Produk

> **[CATATAN UNTUK TIM]:** Tambahkan screenshot dari taninesia.vercel.app yang menunjukkan:
> 1. Dashboard utama
> 2. Halaman marketplace / listing komoditas
> 3. Fitur matching Poktan-Supplier
> 4. Halaman profil Poktan
> 5. Fitur AI (grading, credit scoring, dll.)
> 6. Halaman transaksi

---

*Dokumen ini disiapkan untuk 1st Submission Digdaya x Hackathon PIDI 2026.*
*Platform: [taninesia.vercel.app](https://taninesia.vercel.app)*
