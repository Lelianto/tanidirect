# Taninesia — Dokumentasi Lengkap

> Platform B2B Marketplace Pertanian yang menghubungkan Kelompok Tani (Poktan) langsung ke Supplier besar, memotong rantai tengkulak dengan sistem QA transparan, escrow payment, dan AI matching.

---

## Daftar Isi

1. [Overview & Tech Stack](#1-overview--tech-stack)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [Database Schema](#3-database-schema)
4. [Halaman & Route](#4-halaman--route)
5. [API Endpoints](#5-api-endpoints)
6. [Komponen](#6-komponen)
7. [State Management](#7-state-management)
8. [Types & Interfaces](#8-types--interfaces)
9. [Utilities & Libraries](#9-utilities--libraries)
10. [Flow: Autentikasi](#10-flow-autentikasi)
11. [Flow: Pre-Order & Matching](#11-flow-pre-order--matching)
12. [Flow: Quality Assurance](#12-flow-quality-assurance)
13. [Flow: Transaksi & Pembayaran](#13-flow-transaksi--pembayaran)
14. [Flow: Kredit Petani](#14-flow-kredit-petani)
15. [Flow: Dispute / Sengketa](#15-flow-dispute--sengketa)
16. [Flow: KYC & Trust Level](#16-flow-kyc--trust-level)
17. [Flow: Logistik](#17-flow-logistik)
18. [Fitur AI](#18-fitur-ai)
19. [Pengaturan Platform](#19-pengaturan-platform)
20. [Konfigurasi & Environment](#20-konfigurasi--environment)
21. [Ringkasan Fitur per Role](#21-ringkasan-fitur-per-role)

---

## 1. Overview & Tech Stack

### Teknologi Utama

| Kategori | Teknologi | Versi |
|----------|-----------|-------|
| **Framework** | Next.js (App Router) | 16.2.1 |
| **UI Library** | React | 19.2.4 |
| **Language** | TypeScript | ^5 |
| **Database** | Supabase (PostgreSQL) | — |
| **Auth** | Supabase Auth (email/password) | — |
| **State** | Zustand (with persist) | ^5.0.12 |
| **Styling** | Tailwind CSS | v4 |
| **UI Components** | shadcn/ui | ^4.1.0 |
| **Forms** | React Hook Form + Zod | ^7.71.2 / ^4.3.6 |
| **AI** | Groq SDK (LLaMA 3.3 70B) | ^1.1.1 |
| **Charts** | Recharts | ^3.8.0 |
| **Maps** | React Leaflet | ^5.0.0 |
| **Icons** | Lucide React | ^0.577.0 |
| **Toast** | Sonner | ^2.0.7 |
| **Fonts** | Inter (body), Poppins (heading) | Google Fonts |

### Design System — Custom Colors

```
tani-green:      #16a34a  (primary)
tani-green-dark: #15803d  (primary hover)
tani-blue:       #3b82f6  (secondary / supplier)
tani-amber:      #f59e0b  (accent / petani)
```

---

## 2. Arsitektur Aplikasi

```
┌──────────────────────────────────────────────────────┐
│                     Browser (Client)                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Zustand   │  │ React    │  │ shadcn/ui          │  │
│  │ (persist) │  │ Pages    │  │ Components         │  │
│  └─────┬────┘  └────┬─────┘  └────────────────────┘  │
│        │            │                                  │
│        └────────────┤  fetch()                        │
│                     ▼                                  │
├──────────────────────────────────────────────────────┤
│               Next.js App Router (Server)             │
│  ┌────────────────────────────────────────────────┐   │
│  │  API Routes (/api/auth, /api/supplier, etc.)   │   │
│  └──────────────────┬─────────────────────────────┘   │
│                     │                                  │
│         ┌───────────┴───────────┐                     │
│         ▼                       ▼                     │
│  ┌──────────────┐     ┌──────────────────┐           │
│  │  Supabase    │     │  Groq AI         │           │
│  │  (service    │     │  (LLaMA 3.3)     │           │
│  │   role)      │     │                  │           │
│  └──────────────┘     └──────────────────┘           │
│         │                                             │
│         ▼                                             │
│  ┌──────────────────────────────────────┐            │
│  │  PostgreSQL (Supabase Hosted)        │            │
│  │  + Storage Buckets (KYC, QA photos)  │            │
│  └──────────────────────────────────────┘            │
└──────────────────────────────────────────────────────┘
```

### Struktur Direktori

```
tanidirect/
├── app/
│   ├── (admin)/admin/          # Halaman admin
│   ├── (auth)/                 # Login & register
│   ├── (petani)/petani/        # Halaman petani
│   ├── (poktan)/poktan/        # Halaman ketua poktan
│   ├── (supplier)/supplier/    # Halaman supplier
│   ├── api/                    # API routes (server-side)
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css
├── components/
│   ├── admin/                  # Komponen khusus admin
│   ├── kyc/                    # Komponen KYC
│   ├── petani/                 # Komponen petani
│   ├── poktan/                 # Komponen poktan
│   ├── register/               # Komponen registrasi
│   ├── shared/                 # Komponen bersama
│   ├── supplier/               # Komponen supplier
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── constants/              # Komoditas, wilayah, SOP content
│   ├── data/                   # QA form config
│   ├── didit/                  # DIDIT KYC (disabled)
│   ├── dummy/                  # Mock data untuk demo
│   ├── groq/                   # AI client (Groq LLaMA)
│   ├── qa/                     # Auto-grading logic
│   ├── schemas/                # Zod validation schemas
│   ├── supabase/               # Supabase client (browser & server)
│   └── utils/                  # Currency, date, cn()
├── store/
│   └── index.ts                # Zustand auth store
├── types/
│   └── index.ts                # Semua TypeScript interfaces
├── supabase/
│   └── migrations/             # SQL migration files
├── public/
└── docs/
```

---

## 3. Database Schema

### Enums

| Enum | Values |
|------|--------|
| `user_role` | `petani`, `ketua_poktan`, `supplier`, `admin` |
| `komoditas_grade` | `A` (Premium), `B` (Standard), `C` (Economy) |
| `status_transaksi` | `draft`, `menunggu_konfirmasi`, `dikonfirmasi`, `dalam_pengiriman`, `tiba_di_gudang`, `selesai`, `dibatalkan`, `sengketa` |
| `status_preorder` | `open`, `matched`, `confirmed`, `fulfilled`, `cancelled` |
| `status_qa` | `pending`, `lulus`, `gagal`, `perlu_tinjauan` |
| `tier_logistik` | `first_mile`, `middle_mile`, `last_mile` |
| `status_kredit` | `belum_ada`, `pending`, `disetujui`, `ditolak`, `aktif`, `lunas` |
| `tingkat_risiko` | `rendah`, `sedang`, `tinggi`, `kritis` |
| `trust_level` | `unverified`, `verified`, `bronze`, `silver`, `gold`, `platinum` |
| `kyc_status` | `belum`, `pending`, `approved`, `rejected`, `revisi` |
| `dispute_category` | `kualitas`, `keterlambatan`, `volume`, `pembayaran`, `pembatalan` |
| `dispute_status` | `diajukan`, `investigasi`, `mediasi`, `eskalasi`, `selesai` |

### Tabel Utama

#### `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | FK ke auth.users |
| `role` | user_role | Role pengguna |
| `nama_lengkap` | text | Nama lengkap |
| `no_hp` | text (unique) | Nomor telepon |
| `no_ktp` | text | NIK (opsional) |
| `provinsi`, `kabupaten`, `kecamatan` | text | Wilayah |
| `alamat` | text | Alamat detail |
| `is_verified` | boolean | Status verifikasi |
| `is_active` | boolean | Status aktif |
| `kyc_status` | kyc_status | Status KYC |
| `trust_level` | trust_level | Level kepercayaan |
| `created_at`, `updated_at` | timestamptz | Timestamp |

#### `poktan`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | |
| `ketua_id` | UUID (FK users) | Ketua poktan |
| `nama_poktan` | text | Nama kelompok |
| `kode_poktan` | text (unique) | Kode unik |
| `komoditas_utama` | text[] | Daftar komoditas |
| `jumlah_anggota` | integer | Total anggota |
| `skor_qa` | numeric | Skor rata-rata QA (0-100) |
| `skor_ketepatan` | numeric | Skor on-time delivery |
| `skor_volume` | numeric | Skor konsistensi volume |
| `is_qa_certified` | boolean | Sertifikasi QA |
| `tanggal_sertifikasi` | date | Tanggal sertifikasi |

#### `supplier`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK users) | Pemilik akun |
| `nama_perusahaan` | text | Nama perusahaan |
| `npwp` | text | Nomor pajak |
| `wilayah_operasi` | text[] | Area operasi |
| `kapasitas_bulanan_ton` | numeric | Kapasitas beli/bulan |
| `deposit_escrow` | numeric | Deposit yang ditahan |
| `rating` | numeric | Rating keseluruhan |

#### `pre_order`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | |
| `supplier_id` | UUID (FK supplier) | Supplier pembuat |
| `komoditas` | text | Jenis komoditas |
| `grade` | komoditas_grade | A/B/C |
| `volume_kg` | numeric | Volume yang dibutuhkan |
| `harga_penawaran_per_kg` | numeric | Harga tawaran |
| `tanggal_dibutuhkan` | date | Deadline |
| `wilayah_tujuan` | text | Tujuan pengiriman |
| `catatan` | text | Catatan khusus |
| `ai_qa_steps` | jsonb | Langkah QA dari AI |
| `deposit_dibayar` | numeric | 10% dari total nilai |
| `status` | status_preorder | Status PO |
| `poktan_matched_id` | UUID (FK poktan) | Poktan yang di-match |
| `ai_matching_result` | jsonb | Hasil AI matching |

#### `transaksi`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | |
| `pre_order_id` | UUID (FK pre_order) | Asal pre-order |
| `poktan_id` | UUID (FK poktan) | Poktan pelaksana |
| `supplier_id` | UUID (FK supplier) | Supplier pembeli |
| `komoditas` | text | Jenis komoditas |
| `grade` | komoditas_grade | Grade yang disepakati |
| `volume_estimasi_kg` | numeric | Volume rencana |
| `volume_aktual_kg` | numeric | Volume aktual |
| `harga_per_kg` | numeric | Harga satuan |
| `total_nilai` | numeric | Total transaksi |
| `komisi_platform` | numeric | Fee platform (2%) |
| `status` | status_transaksi | Status lifecycle |

#### `qa_inspeksi`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | |
| `transaksi_id` | UUID (FK transaksi) | |
| `poktan_id` | UUID (FK poktan) | |
| `inspektor_id` | UUID (FK users) | Pelaksana inspeksi |
| `komoditas` | text | |
| `volume_inspeksi_kg` | numeric | |
| `grade_hasil` | komoditas_grade | Grade inspeksi |
| `skor_kualitas` | numeric (0-100) | Skor kualitas |
| `foto_urls` | text[] | 3 foto (batch, detail, timbangan) |
| `catatan` | text | |
| `fee_qa` | numeric | Rp 50/kg |
| `fee_dibayar` | boolean | |
| `supplier_review_status` | text | pending/approved/disputed |
| `grade_rekomendasi_sistem` | komoditas_grade | Auto-grade dari AI |

#### `kredit`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | |
| `petani_id` | UUID (FK users) | Pemohon |
| `poktan_id` | UUID (FK poktan) | Poktan terkait |
| `jumlah_diajukan` | numeric | Nominal pengajuan |
| `jumlah_disetujui` | numeric | Nominal disetujui |
| `tenor_bulan` | integer | Durasi cicilan |
| `bunga_persen` | numeric | Suku bunga |
| `ai_skor` | integer (0-100) | AI credit score |
| `ai_kategori` | text | Kategori AI |
| `ai_result` | jsonb | Detail analisis AI |
| `status` | status_kredit | Status kredit |

#### `disputes`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | |
| `transaksi_id` | UUID (FK transaksi) | |
| `pelapor_id` | UUID (FK users) | Yang melapor |
| `terlapor_id` | UUID (FK users) | Yang dilaporkan |
| `kategori` | dispute_category | Jenis sengketa |
| `deskripsi` | text | Penjelasan |
| `bukti` | text[] | URL bukti |
| `timeline` | jsonb[] | Riwayat aksi |
| `status` | dispute_status | Status sengketa |
| `sla_deadline` | timestamptz | Batas waktu (7 hari) |
| `resolusi` | text | Keputusan |
| `kompensasi` | numeric | Nilai kompensasi |

#### Tabel Pendukung

| Tabel | Fungsi |
|-------|--------|
| `rekening` | Rekening bank/e-wallet pengguna |
| `anggota_poktan` | Relasi petani ↔ poktan |
| `kontribusi_petani` | Kontribusi volume per petani per transaksi |
| `pencairan` | Catatan penarikan dana petani |
| `cicilan_kredit` | Jadwal & status cicilan |
| `logistik` | Tracking pengiriman (3 tier) |
| `kyc_documents` | Dokumen KYC individu |
| `kyc_submissions` | Pengajuan KYC multi-layer |
| `kyc_audit_log` | Riwayat audit KYC |
| `notifikasi` | Notifikasi dalam aplikasi |
| `harga_historis` | Riwayat harga per komoditas/wilayah/minggu |
| `prediksi_harga` | Prediksi harga dari AI |
| `katalog_komoditas` | Smart catalog (aggregate view) |
| `anomali_log` | Log deteksi anomali/fraud |
| `onboarding_milestones` | Tracking onboarding user |
| `onboarding_checklist` | Daftar tugas onboarding |
| `sop_agreements` | Persetujuan SOP per user |
| `dispute_evidence` | Bukti lampiran sengketa |
| `dispute_timeline` | Timeline aksi sengketa |
| `ai_cache` | Cache response AI (Groq) per endpoint |
| `platform_config` | Konfigurasi platform (rekening escrow, QRIS) |

### Row-Level Security (RLS)

Semua tabel dilindungi RLS:
- **Users**: Hanya bisa lihat/edit data sendiri
- **Admin**: Akses penuh ke semua data
- **Poktan Leader**: Akses data anggota kelompoknya
- **Supplier**: Akses pre-order & transaksi miliknya
- **Petani**: Akses kontribusi & riwayat sendiri

---

## 4. Halaman & Route

### Publik & Auth

| Route | File | Deskripsi |
|-------|------|-----------|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/(auth)/login/page.tsx` | Login (demo + real) |
| `/register` | `app/(auth)/register/page.tsx` | Registrasi multi-step |
| `/register/kyc` | `app/(auth)/register/kyc/page.tsx` | Upload dokumen KYC |
| `/register/menunggu-review` | `app/(auth)/register/menunggu-review/page.tsx` | Halaman tunggu review |

### Petani

| Route | Deskripsi |
|-------|-----------|
| `/petani/dashboard` | Dashboard petani — penghasilan, transaksi, kredit |
| `/petani/kyc` | Pengajuan/status KYC |
| `/petani/riwayat` | Riwayat transaksi & kontribusi |
| `/petani/sop` | Baca & setujui SOP |

### Poktan (Ketua Kelompok Tani)

| Route | Deskripsi |
|-------|-----------|
| `/poktan/dashboard` | Dashboard poktan — anggota, skor QA, transaksi |
| `/poktan/anggota` | Kelola anggota kelompok |
| `/poktan/kyc` | Pengajuan/status KYC |
| `/poktan/pre-order` | Lihat & terima pre-order dari supplier |
| `/poktan/qa` | Daftar inspeksi QA |
| `/poktan/qa/[txId]` | Detail inspeksi QA per transaksi |
| `/poktan/logistik` | Tracking logistik pengiriman |
| `/poktan/sop` | Baca & setujui SOP |

### Supplier

| Route | Deskripsi |
|-------|-----------|
| `/supplier/dashboard` | Dashboard supplier |
| `/supplier/katalog` | Smart catalog komoditas dari poktan |
| `/supplier/harga` | Kelola daftar harga |
| `/supplier/pre-order` | Daftar pre-order yang dibuat |
| `/supplier/pre-order/[id]` | Detail PO + hasil AI matching |
| `/supplier/qa` | Review hasil QA |
| `/supplier/transaksi` | Daftar transaksi aktif |
| `/supplier/kyc` | Pengajuan/status KYC |
| `/supplier/sop` | Baca & setujui SOP |

### Admin

| Route | Deskripsi |
|-------|-----------|
| `/admin/dashboard` | Metrik platform keseluruhan |
| `/admin/kyc` | Antrian review KYC |
| `/admin/kyc/queue` | KYC pending queue |
| `/admin/kyc/audit` | Audit log KYC |
| `/admin/poktan` | Kelola & verifikasi poktan |
| `/admin/supplier` | Kelola & verifikasi supplier |
| `/admin/transaksi` | Oversight semua transaksi |
| `/admin/dispute` | Kelola sengketa |
| `/admin/sop-dispute` | Panduan SOP resolusi sengketa |
| `/admin/kredit` | Review pengajuan kredit |
| `/admin/compliance` | Monitoring compliance |
| `/admin/onboarding` | Tracking onboarding user baru |
| `/admin/settings` | Pengaturan rekening escrow & upload QRIS |

---

## 5. API Endpoints

### Auth (`/api/auth/`)

| Method | Endpoint | Input | Output |
|--------|----------|-------|--------|
| `POST` | `/api/auth/login` | `{ no_hp, password }` | `{ user, roleData, sopAgreements, session }` |
| `POST` | `/api/auth/register` | Role-specific data | `{ user, session }` |
| `GET` | `/api/auth/me` | Header: `Authorization: Bearer <token>` | `{ user, roleData, sopAgreements }` |
| `POST` | `/api/auth/refresh` | `{ refresh_token }` | `{ access_token, refresh_token, expires_at }` |
| `POST` | `/api/auth/logout` | — | `{ success }` |

### Petani (`/api/petani/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/petani/dashboard` | Stats: penghasilan, transaksi, kredit |
| `GET` | `/api/petani/riwayat` | Riwayat transaksi + kontribusi |
| `POST` | `/api/petani/cairkan` | Tarik dana ke rekening (fee: Rp 2.500 bank / Rp 1.000 e-wallet) |

### Poktan (`/api/poktan/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/poktan/dashboard` | Stats: anggota, transaksi, skor QA |
| `GET` | `/api/poktan/anggota` | Daftar anggota poktan |
| `GET` | `/api/poktan/pre-order` | Pre-order yang bisa di-match |
| `POST` | `/api/poktan/pre-order` | Terima/match pre-order |
| `GET` | `/api/poktan/qa` | Daftar inspeksi & transaksi pending |
| `POST` | `/api/poktan/qa` | Submit inspeksi QA (3 foto, max 10MB/foto) |
| `GET` | `/api/poktan/logistik` | Data tracking logistik |

### Supplier (`/api/supplier/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/supplier/dashboard` | Stats supplier |
| `GET` | `/api/supplier/katalog` | Smart catalog poktan |
| `POST` | `/api/supplier/harga` | Kelola harga |
| `POST` | `/api/supplier/pre-order` | Buat pre-order (deposit 10%, trigger AI QA steps) |
| `GET` | `/api/supplier/pre-order` | Daftar PO supplier |
| `GET` | `/api/supplier/pre-order/[id]` | Detail PO + AI matching |
| `GET` | `/api/supplier/qa` | Hasil QA pending review |
| `POST` | `/api/supplier/qa-review` | Approve/dispute hasil QA |
| `GET` | `/api/supplier/transaksi` | Daftar transaksi |

### AI (`/api/ai/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/ai/matching` | AI matching poktan terbaik untuk PO |
| `POST` | `/api/ai/qa-notes` | Generate langkah QA dari catatan supplier |
| `POST` | `/api/ai/credit-score` | Hitung credit score petani |
| `POST` | `/api/ai/price-prediction` | Prediksi tren harga |
| `POST` | `/api/ai/anomaly` | Deteksi anomali behavior |
| `POST` | `/api/ai/dispute-recommendation` | Rekomendasi resolusi sengketa |
| `POST` | `/api/ai/dashboard-insight` | Insight dashboard platform |

### KYC (`/api/kyc/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/kyc/upload` | Upload dokumen KYC |
| `GET` | `/api/kyc/status` | Status verifikasi KYC |
| `POST` | `/api/kyc/review` | Admin review KYC |
| `POST` | `/api/kyc/signed-url` | Signed URL untuk storage |
| `GET` | `/api/kyc/workflows` | Workflow KYC tersedia |
| `POST` | `/api/kyc/create-session` | Buat sesi DIDIT (disabled) |
| `GET` | `/api/kyc/session/[sessionId]` | Status sesi DIDIT |
| `POST` | `/api/kyc/webhook` | Callback webhook DIDIT |

### Admin (`/api/admin/`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/dashboard` | Metrik keseluruhan platform |
| `GET` | `/api/admin/compliance` | Data compliance |
| `GET` | `/api/admin/disputes` | Semua sengketa |
| `GET` | `/api/admin/kredit` | Pengajuan kredit |
| `POST` | `/api/admin/kredit` | Review kredit (approve/reject) |
| `GET` | `/api/admin/onboarding` | Data onboarding user |
| `GET` | `/api/admin/poktan` | Daftar poktan |
| `POST` | `/api/admin/poktan` | Verifikasi/sertifikasi poktan |
| `GET` | `/api/admin/supplier` | Daftar supplier |
| `POST` | `/api/admin/supplier` | Verifikasi supplier |
| `GET` | `/api/admin/transaksi` | Semua transaksi |
| `GET` | `/api/admin/kyc/queue` | Antrian KYC pending |
| `GET` | `/api/admin/kyc/audit` | Audit log KYC |
| `GET` | `/api/admin/settings` | Ambil konfigurasi platform |
| `PUT` | `/api/admin/settings` | Update konfigurasi (rekening, dll) |
| `POST` | `/api/admin/settings/qris-upload` | Upload gambar QRIS statis |

### Lainnya

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/sop/agree` | Catat persetujuan SOP |
| `GET` | `/api/notif` | Notifikasi user |
| `POST` | `/api/dispute/create` | Ajukan sengketa baru (SLA 7 hari) |

---

## 6. Komponen

### Shared Components (`components/shared/`)

| Komponen | Fungsi |
|----------|--------|
| `AppShell` | Layout utama, cek auth + role, sidebar + bottom nav |
| `AuthHydrator` | Restore session dari localStorage, validasi token di background |
| `Sidebar` | Navigasi desktop (berbeda per role) |
| `BottomNav` | Navigasi mobile |
| `TopBar` | Header dengan info user |
| `SOPAgreementModal` | Modal persetujuan SOP (wajib sebelum akses fitur) |
| `StatusBadge` | Badge status (draft, confirmed, selesai, dll) |
| `StatCard` | Kartu statistik di dashboard |
| `TrackingTimeline` | Visualisasi timeline transaksi |
| `TrustScoreBadge` | Badge trust level (unverified → platinum) |
| `KomoditasCard` | Kartu komoditas |
| `KYCStatusBanner` | Banner status KYC |
| `LoadingSpinner` | Spinner loading |
| `DiditVerification` | Integrasi DIDIT (disabled) |
| `DisputeFileDialog` | Upload bukti sengketa |

### UI Components (`components/ui/`) — shadcn/ui

Avatar, Badge, Button, Card, Checkbox, Command, DatePicker, Dialog, DropdownMenu, Input, Label, Popover, Progress, ScrollArea, Select, Separator, Sheet, Skeleton, Sonner (Toast), Table, Tabs, Textarea.

### Role-Specific Components

- **`components/admin/`** — Dispute review, KYC audit, compliance monitoring
- **`components/petani/`** — `CairkanDialog` (penarikan dana)
- **`components/poktan/`** — QA inspection form, member management
- **`components/supplier/`** — Pre-order form, katalog, QA review
- **`components/register/`** — `StepIndicator`, `WilayahSelector`
- **`components/kyc/`** — KYC upload, status, review

---

## 7. State Management

### Zustand Auth Store (`store/index.ts`)

```typescript
interface AuthState {
  user: User | null          // Data user yang login
  role: UserRole | null      // Role aktif
  hasAgreedSOP: boolean      // Sudah setuju SOP?
  setUser: (user) => void    // Set user setelah login
  switchRole: (role) => void // Switch ke demo user
  agreeSOP: () => void       // Tandai SOP agreed
  logout: () => void         // Clear semua state + token
}
```

**Persistence:**
- Menggunakan `zustand/middleware` `persist`
- Disimpan di `localStorage` key `auth-storage`
- State yang di-persist: `user`, `role`, `hasAgreedSOP`
- Logout menghapus: `sb-access-token`, `sb-refresh-token`, `auth-storage`

**Demo Users (built-in):**
| Role | Nama | ID |
|------|------|----|
| `ketua_poktan` | Pak Surya (Demo) | `demo-ketua-01` |
| `petani` | Ahmad (Demo) | `demo-petani-01` |
| `supplier` | Budi (Demo) | `demo-supplier-01` |
| `admin` | Admin (Demo) | `demo-admin-01` |

---

## 8. Types & Interfaces

### User Roles & Status

```typescript
type UserRole = 'petani' | 'ketua_poktan' | 'supplier' | 'admin'
type TrustLevel = 'unverified' | 'verified' | 'bronze' | 'silver' | 'gold' | 'platinum'
type KYCLayerStatus = 'belum' | 'pending' | 'approved' | 'rejected' | 'revisi'
```

### Transaction Lifecycle

```typescript
type StatusTransaksi =
  | 'draft'                 // Baru dibuat
  | 'menunggu_konfirmasi'   // Menunggu konfirmasi supplier
  | 'dikonfirmasi'          // Supplier confirm
  | 'dalam_pengiriman'      // Sedang dikirim
  | 'tiba_di_gudang'        // Sampai di gudang
  | 'selesai'               // Selesai
  | 'dibatalkan'            // Dibatalkan
  | 'sengketa'              // Ada dispute

type StatusPreOrder = 'open' | 'matched' | 'confirmed' | 'fulfilled' | 'cancelled'
type StatusQA = 'pending' | 'lulus' | 'gagal' | 'perlu_tinjauan'
type KomoditasGrade = 'A' | 'B' | 'C'  // Premium | Standard | Economy
```

### Credit & Risk

```typescript
type StatusKredit = 'belum_ada' | 'pending' | 'disetujui' | 'ditolak' | 'aktif' | 'lunas'
type TingkatRisiko = 'rendah' | 'sedang' | 'tinggi' | 'kritis'
```

### Dispute

```typescript
type DisputeCategory = 'kualitas' | 'keterlambatan' | 'volume' | 'pembayaran' | 'pembatalan'
type DisputeStatus = 'diajukan' | 'investigasi' | 'mediasi' | 'eskalasi' | 'selesai'
```

### Key Interfaces

Semua interface didefinisikan di `types/index.ts`:
`User`, `Poktan`, `Supplier`, `AnggotaPoktan`, `PreOrder`, `Transaksi`, `KontribusiPetani`, `QAInspeksi`, `Kredit`, `CicilanKredit`, `Pencairan`, `Logistik`, `Rekening`, `KYCDocument`, `KYCSubmission`, `Dispute`, `DisputeEvidence`, `DisputeTimeline`, `Notifikasi`, `HargaHistoris`, `PrediksiHarga`, `AnomalyLog`, `KatalogKomoditas`.

---

## 9. Utilities & Libraries

### Supabase Clients

| File | Penggunaan |
|------|------------|
| `lib/supabase/client.ts` | Browser-side, anon key, RLS enforced |
| `lib/supabase/server.ts` | Server-side, service role key, bypasses RLS |

### Constants

| File | Isi |
|------|-----|
| `lib/constants/komoditas.ts` | 36 komoditas pertanian (Beras, Jagung, Cabai, Tomat, dll) + label grade |
| `lib/constants/wilayah.ts` | 38 provinsi Indonesia |
| `lib/constants/sop-content.ts` | Konten SOP lengkap + framework resolusi sengketa |

### Utilities

| File | Fungsi |
|------|--------|
| `lib/utils/currency.ts` | Format angka ke Rupiah (Rp 1.000.000) |
| `lib/utils/date.ts` | Format tanggal bahasa Indonesia |
| `lib/utils/index.ts` | `cn()` — Tailwind class merger |

### Validation Schemas (`lib/schemas/register.ts`)

Zod schemas untuk validasi registrasi:
- `roleSchema` — Validasi role
- `dataDiriSchema` — Nama, HP, NIK
- `wilayahSchema` — Provinsi, kabupaten, kecamatan
- `poktanSchema` — Data poktan
- `petaniSchema` — Data petani
- `supplierSchema` — Data supplier
- `rekeningSchema` — Data rekening

### AI Client (`lib/groq/client.ts`)

- Provider: **Groq**
- Model: **LLaMA 3.3 70B Versatile**
- Digunakan untuk: matching, QA steps generation, credit scoring, price prediction, anomaly detection

### QA Auto-Grading (`lib/qa/auto-grade.ts`)

Logic otomatis menentukan grade berdasarkan skor kualitas inspeksi.

### Mock Data (`lib/dummy/index.ts`)

Data dummy untuk mode demo: users, poktan, supplier, pre-orders, transaksi, kontribusi, kredit, dll.

---

## 10. Flow: Autentikasi

### Registrasi (Multi-Step)

```
Step 1: Pilih Role (petani / ketua_poktan / supplier)
  ↓
Step 2: Data Diri (nama, HP, NIK)
  ↓
Step 3: Wilayah (provinsi, kabupaten, kecamatan)
  ↓
Step 4: Data Role-Specific
  → Poktan: nama poktan, komoditas, jumlah anggota
  → Petani: luas lahan, komoditas, tanggal gabung
  → Supplier: nama perusahaan, wilayah operasi
  ↓
Step 5: Rekening (opsional, bisa skip)
  ↓
API: POST /api/auth/register
  → Buat user di Supabase Auth (email: {no_hp}@taninesia.local)
  → Insert ke tabel users
  → Insert ke tabel role-specific (poktan/anggota_poktan/supplier)
  → Opsional: insert rekening
  ↓
Redirect ke /register/menunggu-review
```

### Login

```
Mode Demo:
  → Klik salah satu role card
  → switchRole() → Zustand set dummy user
  → Router push ke dashboard role
  → Tidak ada token di localStorage

Mode Real:
  → Input no HP + password
  → POST /api/auth/login
  → Supabase auth.signInWithPassword()
  → Fetch profile, rekening, SOP agreements, role data
  → Response: { user, session: { access_token, refresh_token } }
  → Client: setUser(), simpan token ke localStorage
  → Jika ada SOP agreement: agreeSOP()
  → Router push ke dashboard role
```

### Session Persistence (Setelah Refresh)

```
Page Load
  ↓
Zustand persist hydrate dari localStorage (instant)
  → User langsung lihat dashboard, tidak flash ke login
  ↓
AuthHydrator (useEffect on mount)
  → Cek localStorage ada sb-access-token?
  → Jika tidak ada (demo user): skip validasi
  → Jika ada: GET /api/auth/me dengan Bearer token
    → 200 OK: update store dengan fresh data
    → 401: coba refresh token
      → POST /api/auth/refresh { refresh_token }
      → Berhasil: simpan token baru, retry /api/auth/me
      → Gagal: logout() → redirect ke /login
```

### AppShell Guard

```
AppShell mount
  ↓
Tunggu Zustand persist selesai hydrate
  → Belum hydrated: tampilkan spinner
  → Sudah hydrated + user null: redirect ke /login
  → Sudah hydrated + role !== requiredRole: redirect ke /login
  → Valid: render dashboard + sidebar + bottom nav
  ↓
Cek SOP Agreement
  → Belum setuju (non-admin): tampilkan SOPAgreementModal
  → Sudah setuju: render children
```

---

## 11. Flow: Pre-Order & Matching

```
┌─────────────────────────────────┐
│ SUPPLIER: Buat Pre-Order        │
│ POST /api/supplier/pre-order    │
│                                 │
│ Input:                          │
│  - komoditas (misal: Beras)     │
│  - grade (A/B/C)                │
│  - volume_kg (misal: 5000)      │
│  - harga_penawaran_per_kg       │
│  - tanggal_dibutuhkan           │
│  - wilayah_tujuan               │
│  - catatan (opsional)           │
│                                 │
│ Proses:                         │
│  1. Hitung deposit (10% total)  │
│  2. Jika ada catatan:           │
│     → AI generate QA steps      │
│     → POST /api/ai/qa-notes     │
│  3. Insert ke tabel pre_order   │
│  4. Status: 'open'              │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ AI MATCHING                     │
│ POST /api/ai/matching           │
│                                 │
│ Input: preOrderId               │
│ Proses:                         │
│  1. Ambil data PO               │
│  2. Cari poktan yang cocok:     │
│     - Komoditas match           │
│     - Wilayah terdekat          │
│     - Skor QA tinggi            │
│     - QA certified              │
│     - Kapasitas memadai         │
│  3. Groq AI ranking + scoring   │
│  4. Return ranked candidates    │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ POKTAN: Terima Match            │
│ POST /api/poktan/pre-order      │
│                                 │
│ Poktan lihat detail PO:         │
│  - Komoditas & grade            │
│  - Volume & harga               │
│  - Deadline                     │
│  - QA requirements (AI steps)   │
│                                 │
│ Terima → Status: 'matched'      │
│ poktan_matched_id diisi         │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ SUPPLIER: Konfirmasi            │
│                                 │
│ Status: 'confirmed'             │
│ → Transaksi dibuat otomatis     │
│ → Status transaksi: 'draft'     │
└─────────────────────────────────┘
```

---

## 12. Flow: Quality Assurance

```
┌─────────────────────────────────┐
│ Transaksi status: 'dikonfirmasi'│
│                                 │
│ Poktan leader perlu inspeksi QA │
│ Halaman: /poktan/qa/[txId]      │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ POKTAN: Submit Inspeksi QA      │
│ POST /api/poktan/qa             │
│                                 │
│ Input:                          │
│  - komoditas                    │
│  - volume_inspeksi_kg           │
│  - grade_hasil (A/B/C)          │
│  - skor_kualitas (0-100)        │
│  - catatan                      │
│  - 3 foto (max 10MB each):     │
│    ① Foto batch keseluruhan     │
│    ② Foto detail komoditas      │
│    ③ Foto timbangan             │
│                                 │
│ Proses:                         │
│  1. Upload foto ke Supabase     │
│  2. Hitung fee QA (Rp 50/kg)   │
│  3. Auto-grade dari sistem      │
│  4. Insert qa_inspeksi          │
│  5. Status: 'perlu_tinjauan'    │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ SUPPLIER: Review QA             │
│ POST /api/supplier/qa-review    │
│                                 │
│ Supplier lihat:                 │
│  - Foto batch, detail, scale    │
│  - Grade & skor kualitas        │
│  - Volume inspeksi              │
│  - AI recommended grade         │
│                                 │
│ Opsi:                           │
│  ✅ Approve → status: 'lulus'   │
│  ❌ Dispute → sengketa diajukan │
└─────────────────────────────────┘
```

### Auto-Grading Logic

```
Skor 85-100 → Grade A (Premium)
Skor 70-84  → Grade B (Standard)
Skor < 70   → Grade C (Economy)
```

---

## 13. Flow: Transaksi & Pembayaran

```
Pre-Order Confirmed
  ↓
Transaksi dibuat (status: 'draft')
  ↓
Menunggu konfirmasi (status: 'menunggu_konfirmasi')
  ↓
Dikonfirmasi (status: 'dikonfirmasi')
  ↓
QA Inspection dilakukan
  ↓
QA Approved → Pengiriman dimulai
  ↓
Dalam pengiriman (status: 'dalam_pengiriman')
  ↓
Tiba di gudang (status: 'tiba_di_gudang')
  ↓
Selesai (status: 'selesai')
  → Komisi platform: 2% dari total_nilai
  → Fee QA: Rp 50/kg
  → Sisa masuk ke poktan → distribusi ke petani
```

### Pencairan Dana Petani

```
POST /api/petani/cairkan
  → Input: petani_id, jumlah, rekening
  → Validasi: saldo tersedia
  → Biaya admin:
    - Bank transfer: Rp 2.500
    - E-wallet: Rp 1.000
  → jumlah_diterima = jumlah - biaya_admin
  → Insert pencairan (status: 'diproses')
  → Admin memproses → status: 'berhasil' / 'gagal'
```

---

## 14. Flow: Kredit Petani

```
┌─────────────────────────────────┐
│ PETANI: Ajukan Kredit           │
│                                 │
│ Input:                          │
│  - jumlah_diajukan              │
│  - tenor_bulan                  │
│  - tujuan                       │
│ Status: 'pending'               │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ AI CREDIT SCORING               │
│ POST /api/ai/credit-score       │
│                                 │
│ Analisis:                       │
│  - Riwayat transaksi            │
│  - Volume kontribusi            │
│  - Konsistensi penghasilan      │
│  - Status verifikasi            │
│  - Membership poktan            │
│                                 │
│ Output:                         │
│  - skor: 0-100                  │
│  - kategori:                    │
│    80+  → Sangat Baik (max 10M) │
│    65-79 → Baik (max 7.5M)      │
│    50-64 → Cukup (max 5M)       │
│    <50  → Perlu Perhatian (2M)  │
│  - faktorPositif[]              │
│  - faktorRisiko[]               │
│  - rekomendasi                  │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ ADMIN: Review                   │
│ POST /api/admin/kredit          │
│                                 │
│ Pertimbangkan:                  │
│  - AI recommendation            │
│  - Manual assessment            │
│                                 │
│ Approve → set jumlah, tenor,    │
│           bunga → status:       │
│           'disetujui' → 'aktif' │
│                                 │
│ Reject → status: 'ditolak'     │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ CICILAN                         │
│                                 │
│ Jadwal cicilan bulanan dibuat   │
│ Bisa auto-deduct dari earning   │
│ Semua lunas → status: 'lunas'  │
└─────────────────────────────────┘
```

---

## 15. Flow: Dispute / Sengketa

```
┌─────────────────────────────────┐
│ USER: Ajukan Sengketa           │
│ POST /api/dispute/create        │
│                                 │
│ Input:                          │
│  - transaksi_id                 │
│  - pelapor_id                   │
│  - kategori:                    │
│    • kualitas                   │
│    • keterlambatan              │
│    • volume                     │
│    • pembayaran                 │
│    • pembatalan                 │
│  - deskripsi                    │
│  - bukti (foto/dokumen)         │
│                                 │
│ SLA: 7 hari dari pengajuan      │
│ Status: 'diajukan'              │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ ADMIN: Investigasi              │
│ Status: 'investigasi'           │
│                                 │
│ Review:                         │
│  - Detail transaksi             │
│  - Bukti yang dilampirkan       │
│  - QA results                   │
│  - Timeline komunikasi          │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────────────┐
│ MEDIASI / ESKALASI              │
│                                 │
│ Resolusi per kategori:          │
│ ┌───────────────┬─────────────┐ │
│ │ Kualitas      │ Diskon 10-  │ │
│ │               │ 30% atau    │ │
│ │               │ retur penuh │ │
│ ├───────────────┼─────────────┤ │
│ │ Keterlambatan │ 5%/hari     │ │
│ │               │ (max 20%)   │ │
│ ├───────────────┼─────────────┤ │
│ │ Volume        │ Pro-rata    │ │
│ │               │ atau reject │ │
│ ├───────────────┼─────────────┤ │
│ │ Pembayaran    │ Bunga 0.1%  │ │
│ │               │ /hari       │ │
│ ├───────────────┼─────────────┤ │
│ │ Pembatalan    │ 50% deposit │ │
│ │               │ atau 5%     │ │
│ │               │ penalty     │ │
│ └───────────────┴─────────────┘ │
│                                 │
│ Status: 'selesai'               │
│ Kompensasi diterapkan           │
│ Notifikasi ke kedua pihak       │
└─────────────────────────────────┘
```

---

## 16. Flow: KYC & Trust Level

### Layer KYC

| Layer | Dokumen | Verifikasi |
|-------|---------|------------|
| **Layer 1** | KTP + Selfie | Identitas dasar |
| **Layer 2** | NPWP / Surat Poktan | Legalitas usaha |
| **Layer 3** | Sertifikat / Izin khusus | Sertifikasi lanjutan |

### Trust Level Progression

```
unverified → verified → bronze → silver → gold → platinum
     ↑                     ↑        ↑       ↑        ↑
     │                     │        │       │        │
  Baru daftar         KYC L1    KYC L2  KYC L3   Semua
                      approved  approved approved  + track
                                                   record
```

### Flow

```
User register → kyc_status: 'pending', trust_level: 'unverified'
  ↓
Upload dokumen di /register/kyc atau /{role}/kyc
  → POST /api/kyc/upload
  → kyc_status: 'pending'
  ↓
Admin review di /admin/kyc
  → POST /api/kyc/review
  → Approve: kyc_status → 'approved', trust_level naik
  → Reject: kyc_status → 'rejected', alasan diberikan
  → Revisi: kyc_status → 'revisi', user diminta perbaiki
  ↓
Audit trail dicatat di kyc_audit_log
```

> **Catatan:** Integrasi DIDIT third-party KYC saat ini **disabled**. KYC menggunakan flow manual upload + admin review.

---

## 17. Flow: Logistik

```
Transaksi dikonfirmasi
  ↓
┌─────────────────────────────────────────┐
│ TIER 1: First Mile                       │
│ Lahan → Titik kumpul poktan             │
│                                          │
│ Data: transporter, kendaraan, rute GPS  │
│ Status: belum_berangkat → dalam_perjalanan│
│         → tiba_di_gudang                 │
│ Foto: loading                            │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ TIER 2: Middle Mile                      │
│ Titik kumpul → Gudang/warehouse         │
│                                          │
│ Tracking GPS aktif                       │
│ Estimasi waktu tiba                      │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ TIER 3: Last Mile                        │
│ Gudang → Lokasi akhir supplier          │
│                                          │
│ Foto: delivery                           │
│ Konfirmasi penerimaan                    │
│ → Update status transaksi               │
└─────────────────────────────────────────┘
```

---

## 18. Fitur AI

Semua fitur AI menggunakan **Groq** dengan model **LLaMA 3.3 70B Versatile**.

### AI Caching (`lib/groq/cache.ts`)

Semua AI endpoint (kecuali price-prediction yang sudah punya cache sendiri via `prediksi_harga`) menggunakan **DB-based caching** via tabel `ai_cache` di Supabase. Ini mengurangi API calls berulang ke Groq untuk input yang sama.

**Helper functions:**
- `getCache(endpoint, cacheKey)` — Cek cache, return response atau null jika expired
- `setCache(endpoint, cacheKey, response, ttlHours)` — Simpan/update cache dengan TTL
- `invalidateCache(endpoint, cacheKey?)` — Hapus cache per endpoint atau per key

**Tabel `ai_cache`:**
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Auto-generated |
| `endpoint` | text | Nama endpoint ('matching', 'credit-score', dll) |
| `cache_key` | text | Key unik (preOrderId, petaniId, hash, dll) |
| `response` | JSONB | Full JSON response |
| `created_at` | timestamptz | Waktu cache dibuat |
| `expires_at` | timestamptz | Waktu cache expired |

**TTL per endpoint:**

| Endpoint | Cache Key | TTL | Alasan |
|----------|-----------|-----|--------|
| `matching` | `preOrderId` | 24 jam | Ranking poktan stabil kecuali data berubah |
| `credit-score` | `petaniId` | 7 hari | Skor kredit stabil, berubah saat ada transaksi baru |
| `price-prediction` | — | 7 hari | Sudah punya cache via `prediksi_harga` (tidak pakai `ai_cache`) |
| `anomaly` | `poktanId` | 6 jam | Data transaksi & QA berubah, tapi tidak perlu real-time |
| `dispute-recommendation` | `disputeId` | 24 jam | Rekomendasi stabil kecuali ada bukti baru |
| `dashboard-insight` | `"platform"` | 1 jam | Data global, berubah perlahan |
| `qa-notes` | MD5(`catatan+komoditas+grade`) | 30 hari | Input identik = output identik |

### 1. AI Matching (`/api/ai/matching`)

**Tujuan:** Mencari poktan terbaik untuk memenuhi pre-order supplier.

**Faktor scoring:**
- Kesesuaian komoditas & grade
- Kedekatan wilayah
- Skor QA historis
- Status sertifikasi QA
- Kapasitas & track record volume
- Ketepatan pengiriman

**Output:** Ranked list dengan compatibility score per poktan.

### 2. AI QA Steps (`/api/ai/qa-notes`)

**Tujuan:** Generate langkah-langkah inspeksi QA berdasarkan catatan khusus supplier.

**Input:** Catatan supplier, jenis komoditas, grade yang diminta.
**Output:** Array of steps (kriteria pemeriksaan spesifik).

### 3. AI Credit Score (`/api/ai/credit-score`)

**Tujuan:** Menilai kelayakan kredit petani.

**Analisis:**
- Riwayat transaksi (frekuensi, total nilai)
- Konsistensi volume kontribusi
- Lama bergabung di poktan
- Status KYC & trust level
- Luas lahan & diversifikasi komoditas

**Output:**
| Skor | Kategori | Batas Kredit |
|------|----------|-------------|
| 80-100 | Sangat Baik | Rp 10.000.000 |
| 65-79 | Baik | Rp 7.500.000 |
| 50-64 | Cukup | Rp 5.000.000 |
| < 50 | Perlu Perhatian | Rp 2.000.000 |

### 4. AI Price Prediction (`/api/ai/price-prediction`)

**Tujuan:** Prediksi tren harga komoditas berdasarkan data historis.

### 5. AI Anomaly Detection (`/api/ai/anomaly`)

**Tujuan:** Deteksi perilaku mencurigakan (fraud, manipulasi volume, dll).

### 6. AI Dispute Recommendation (`/api/ai/dispute-recommendation`)

**Tujuan:** Memberikan rekomendasi resolusi sengketa berdasarkan data dispute, bukti, timeline, QA, dan preseden kasus serupa.

**Output:** Rekomendasi resolusi (kompensasi/tolak/mediasi/eskalasi), saran kompensasi, alasan, preseden, dan tingkat kepercayaan.

### 7. AI Dashboard Insight (`/api/ai/dashboard-insight`)

**Tujuan:** Generate executive summary dan insight dari data platform (transaksi, dispute, anomali, QA, kredit, pre-order).

**Output:** Ringkasan eksekutif, key insights, peringatan, dan rekomendasi aksi.

---

## 19. Pengaturan Platform

Admin bisa mengelola konfigurasi platform via halaman `/admin/settings`.

### Rekening Escrow Taninesia

Rekening bank yang digunakan untuk menerima pembayaran escrow dari supplier sebelum dana dicairkan ke poktan/petani.

**Konfigurasi:**
| Field | Deskripsi |
|-------|-----------|
| `bank` | Nama bank (BCA, BRI, Mandiri, dll) |
| `nomor` | Nomor rekening |
| `atas_nama` | Nama pemilik rekening (PT Taninesia Digital) |

### QRIS Statis

Admin bisa upload gambar QRIS statis yang ditampilkan ke supplier saat checkout.

**Spesifikasi upload:**
- Format: JPG, PNG, WebP
- Max size: 2MB
- Storage: Supabase bucket `platform-assets`

### Database: `platform_config`

Tabel key-value generic untuk konfigurasi platform.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `key` | text (PK) | Key konfigurasi (`rekening_escrow`, `qris`) |
| `value` | JSONB | Nilai konfigurasi |
| `updated_at` | timestamptz | Terakhir diupdate |
| `updated_by` | UUID (FK → users) | Admin yang mengupdate |

### API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/settings` | Ambil semua konfigurasi platform |
| `PUT` | `/api/admin/settings` | Update konfigurasi (key + value) |
| `POST` | `/api/admin/settings/qris-upload` | Upload gambar QRIS (FormData: file, admin_id) |

---

## 20. Konfigurasi & Environment

### Environment Variables (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
GROQ_API_KEY=gsk_...

# KYC (optional, currently disabled)
DIDIT_API_KEY=...
DIDIT_WORKFLOW_ID=...
```

### Storage Buckets (Supabase)

| Bucket | Isi |
|--------|-----|
| `kyc-documents` | Dokumen KYC (KTP, selfie, NPWP) |
| `qa-photos` | Foto inspeksi QA (batch, detail, timbangan) |
| `dispute-evidence` | Bukti pendukung sengketa |
| `platform-assets` | Aset platform (QRIS, logo, dll) |

### Scripts (`package.json`)

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## 21. Ringkasan Fitur per Role

### Petani (Anggota Kelompok Tani)

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Lihat penghasilan, jumlah transaksi, status kredit |
| Riwayat Transaksi | Daftar semua transaksi dengan detail kontribusi |
| Pencairan Dana | Tarik penghasilan ke bank/e-wallet |
| Kredit | Ajukan pinjaman dengan AI credit scoring |
| KYC | Upload dokumen verifikasi identitas |
| SOP | Baca & setujui ketentuan platform |

### Ketua Poktan (Pemimpin Kelompok Tani)

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Statistik kelompok: anggota, skor QA, transaksi |
| Anggota | Kelola daftar anggota poktan |
| Pre-Order | Lihat & terima pre-order dari supplier |
| Quality Assurance | Lakukan inspeksi QA dengan foto & grading |
| Logistik | Pantau pengiriman 3-tier |
| KYC & SOP | Verifikasi & persetujuan |

### Supplier (Pembeli Korporat)

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Overview aktivitas pembelian |
| Katalog | Smart catalog komoditas dari seluruh poktan |
| Harga | Kelola daftar harga beli |
| Pre-Order | Buat PO dengan deposit 10%, AI matching otomatis |
| QA Review | Review hasil inspeksi QA, approve/dispute |
| Transaksi | Pantau semua transaksi aktif |
| KYC & SOP | Verifikasi perusahaan & persetujuan |

### Admin (Operator Platform)

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Metrik platform: user, transaksi, revenue |
| KYC | Antrian review + audit log dokumen verifikasi |
| Poktan | Verifikasi & sertifikasi kelompok tani |
| Supplier | Verifikasi supplier |
| Transaksi | Oversight seluruh transaksi platform |
| Dispute | Kelola sengketa, mediasi, resolusi |
| Kredit | Review & approve pengajuan kredit |
| Compliance | Monitoring kepatuhan |
| Onboarding | Tracking progres user baru |
| SOP Dispute | Panduan resolusi sengketa sesuai SOP |
| Pengaturan | Atur rekening escrow Taninesia & upload QRIS statis |

### Fitur Platform (Cross-Role)

| Fitur | Deskripsi |
|-------|-----------|
| Escrow Payment | Deposit 10% sebagai jaminan transaksi |
| Komisi 2% | Platform fee dari setiap transaksi selesai |
| Fee QA Rp 50/kg | Kompensasi inspeksi kualitas |
| AI Matching | Otomatis carikan poktan terbaik |
| AI Credit Scoring | Penilaian kelayakan kredit berbasis data |
| Multi-Layer KYC | Trust level progresif (unverified → platinum) |
| SOP Agreement | Wajib setuju sebelum akses fitur |
| Notifikasi | Real-time notification dalam aplikasi |
| Demo Mode | Akses langsung tanpa registrasi untuk testing |
| Session Persistence | Token-based auth dengan auto-refresh |
| Dispute SLA 7 Hari | Batas waktu penyelesaian sengketa |
| GPS Logistics | Tracking 3-tier (first/middle/last mile) |
| AI Caching | DB-based cache untuk semua AI endpoint, hemat API calls |

---

*Dokumentasi ini di-generate dari codebase tanidirect. Untuk detail implementasi, lihat source code di masing-masing file yang direferensikan.*
