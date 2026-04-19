# Diagram Arsitektur Taninesia

> Render semua diagram di [mermaid.live](https://mermaid.live) atau export ke PNG/SVG untuk proposal.

---

## 1. Arsitektur Sistem (High-Level)

```mermaid
graph TB
    subgraph Users["👥 Pengguna"]
        P["🧑‍🌾 Petani"]
        K["👨‍💼 Ketua Poktan"]
        S["🏢 Supplier"]
        A["🔧 Admin"]
    end

    subgraph Frontend["Frontend — Next.js 16 + React 19"]
        SSR["Server Components\n& Streaming SSR"]
        UI["shadcn/ui + TailwindCSS 4"]
        State["Zustand\nState Management"]
        Maps["Leaflet\nGeolocation"]
        Charts["Recharts\nAnalytics"]
    end

    subgraph API["API Layer — 75+ Endpoints"]
        AuthAPI["Auth API\n/api/auth/*"]
        KYCAPI["KYC API\n/api/kyc/*"]
        AIAPI["AI API\n/api/ai/*"]
        TxAPI["Transaction API\n/api/poktan/* /api/supplier/*"]
        AdminAPI["Admin API\n/api/admin/*"]
    end

    subgraph AI["AI Engine — Groq LLaMA 3.3 70B"]
        Match["Demand-Supply\nMatching"]
        QA["Auto-Grading\nQA"]
        Credit["Credit\nScoring"]
        Price["Price\nPrediction"]
        Anomaly["Anomaly\nDetection"]
        Dispute["Dispute\nResolution AI"]
        Insight["Dashboard\nInsight"]
    end

    subgraph Backend["Backend — Supabase"]
        DB[("PostgreSQL\n40+ Tabel\nRLS Policies")]
        Auth["Supabase Auth\nJWT Tokens"]
        Storage["Supabase Storage\nKYC Documents"]
        RT["Real-time\nSubscriptions"]
    end

    subgraph External["Layanan Eksternal"]
        Groq["Groq Cloud\nLLM Inference"]
        Vercel["Vercel\nEdge Hosting"]
        Didit["Didit KYC\nIdentity Verification"]
    end

    Users --> Frontend
    Frontend --> API
    API --> AI
    API --> Backend
    AI --> Groq
    Frontend --> Vercel
    KYCAPI --> Didit
    Backend --> DB
    Backend --> Auth
    Backend --> Storage
    Backend --> RT

    style Users fill:#E8F5E9,stroke:#2E7D32
    style Frontend fill:#E3F2FD,stroke:#1565C0
    style API fill:#FFF3E0,stroke:#E65100
    style AI fill:#F3E5F5,stroke:#7B1FA2
    style Backend fill:#FBE9E7,stroke:#BF360C
    style External fill:#F5F5F5,stroke:#616161
```

---

## 2. Alur Transaksi End-to-End

```mermaid
flowchart LR
    subgraph Phase1["📋 Registrasi"]
        R1["Poktan & Supplier\nMendaftar"]
        R2["KYC Verification\n3 Layer"]
        R3["SOP Agreement"]
    end

    subgraph Phase2["🔍 Matching"]
        M1["Supplier Buat\nPre-Order"]
        M2["AI Matching\nPoktan-Supplier"]
        M3["Smart Catalog\n& Harga"]
    end

    subgraph Phase3["💰 Transaksi"]
        T1["Negosiasi\n& Deal"]
        T2["Pembayaran\nEscrow"]
        T3["QA Auto-Grading\nA/B/C/Tolak"]
    end

    subgraph Phase4["🚚 Pengiriman"]
        L1["First Mile\nPoktan → Hub"]
        L2["Middle Mile\nHub → Hub"]
        L3["Last Mile\nHub → Supplier"]
    end

    subgraph Phase5["📊 Pasca-Transaksi"]
        P1["Settlement\n& Pencairan"]
        P2["Credit Scoring\nUpdate"]
        P3["Price Prediction\nUpdate"]
        P4["Trust Score\nUpdate"]
    end

    Phase1 --> Phase2 --> Phase3 --> Phase4 --> Phase5

    style Phase1 fill:#E8F5E9,stroke:#2E7D32
    style Phase2 fill:#E3F2FD,stroke:#1565C0
    style Phase3 fill:#FFF8E1,stroke:#F9A825
    style Phase4 fill:#FFF3E0,stroke:#E65100
    style Phase5 fill:#F3E5F5,stroke:#7B1FA2
```

---

## 3. Modul AI & Data Flow

```mermaid
flowchart TB
    subgraph Input["📥 Data Input"]
        D1["Data Poktan\nKomoditas, Lokasi,\nKapasitas"]
        D2["Data Supplier\nPermintaan, Volume,\nKualitas"]
        D3["Data Transaksi\nHarga, Rating,\nHistoris"]
        D4["Data QA\nParameter Inspeksi,\nFoto Panen"]
        D5["Data Harga\n12 Minggu\nHistoris"]
    end

    subgraph Groq["🧠 Groq LLaMA 3.3 70B"]
        Cache["Groq Cache\nTTL-based"]

        subgraph Modules["5 Modul AI"]
            AI1["🔗 Demand-Supply Matching\nMulti-criteria weighted scoring\nLokasi, Volume, Kualitas, Waktu"]
            AI2["📊 Credit Scoring\nRiwayat transaksi, Repayment,\nKonsistensi → Score 0-100"]
            AI3["📈 Price Prediction\nTime-series forecasting\n2 & 4 minggu ke depan"]
            AI4["🔍 Anomaly Detection\nVolume deviation, QA scores,\nDispute patterns → Risk level"]
            AI5["⚖️ Dispute Resolution\nContext analysis,\nRekomendasi kompensasi"]
        end

        AI6["✅ QA Auto-Grading\nRule-based Engine\nWajib/Non-wajib params\n→ Grade A/B/C/Tolak"]
    end

    subgraph Output["📤 Output"]
        O1["Ranked Match List\n+ Reasoning"]
        O2["Skor Kredit\n+ Limit + Faktor"]
        O3["Prediksi Min/Max/Median\n+ Tren + Faktor"]
        O4["Anomali Log\n+ Risk Level"]
        O5["Rekomendasi\nResolusi"]
        O6["Grade + Completeness\n+ Deviation"]
    end

    D1 & D2 --> AI1 --> O1
    D3 --> AI2 --> O2
    D5 --> AI3 --> O3
    D3 & D4 --> AI4 --> O4
    D3 --> AI5 --> O5
    D4 --> AI6 --> O6

    Modules --> Cache

    style Input fill:#E8F5E9,stroke:#2E7D32
    style Groq fill:#F3E5F5,stroke:#7B1FA2
    style Modules fill:#EDE7F6,stroke:#9575CD
    style Output fill:#E3F2FD,stroke:#1565C0
```

---

## 4. Arsitektur Multi-Role & Hak Akses

```mermaid
flowchart TB
    Login["📱 Login via No. HP\nphone@taninesia.local"]
    Auth["Supabase Auth\nJWT Token"]
    RLS["Row Level Security\nis_admin() · my_poktan_ids() · my_supplier_ids()"]

    Login --> Auth --> RLS

    subgraph Roles["Peran & Fitur"]
        direction TB
        subgraph R1["🧑‍🌾 Petani"]
            F1["Dashboard Penjualan"]
            F2["Riwayat Transaksi"]
            F3["Pencairan Dana"]
            F4["KYC & SOP"]
        end

        subgraph R2["👨‍💼 Ketua Poktan"]
            F5["Dashboard Poktan"]
            F6["Kelola Pre-Order"]
            F7["QA Inspeksi"]
            F8["Kelola Anggota"]
            F9["Logistik & Pengiriman"]
            F10["Keuangan & Panen"]
        end

        subgraph R3["🏢 Supplier"]
            F11["Dashboard Supplier"]
            F12["Buat Pre-Order"]
            F13["Smart Katalog"]
            F14["QA Review"]
            F15["Pembayaran Escrow"]
            F16["Tracking Pengiriman"]
        end

        subgraph R4["🔧 Admin"]
            F17["Platform Analytics"]
            F18["KYC Review Queue"]
            F19["Manajemen Transaksi"]
            F20["Kredit & Compliance"]
            F21["Dispute Resolution"]
            F22["Konfigurasi Komoditas"]
        end
    end

    RLS --> R1
    RLS --> R2
    RLS --> R3
    RLS --> R4

    style Login fill:#FFF8E1,stroke:#F9A825
    style Auth fill:#FBE9E7,stroke:#BF360C
    style RLS fill:#FFEBEE,stroke:#C62828
    style R1 fill:#E8F5E9,stroke:#2E7D32
    style R2 fill:#E3F2FD,stroke:#1565C0
    style R3 fill:#FFF3E0,stroke:#E65100
    style R4 fill:#F3E5F5,stroke:#7B1FA2
```

---

## 5. Database Schema (Simplified ERD)

```mermaid
erDiagram
    USERS ||--o{ ANGGOTA_POKTAN : "bergabung"
    USERS ||--o{ KYC_SUBMISSIONS : "mengajukan"
    USERS ||--o{ REKENING : "memiliki"
    USERS ||--o{ PENCAIRAN : "mengajukan"

    POKTAN ||--o{ ANGGOTA_POKTAN : "memiliki"
    POKTAN ||--o{ PRE_ORDER : "menerima"
    POKTAN ||--o{ TRANSAKSI : "menjual"
    POKTAN ||--o{ QA_INSPEKSI : "menginspeksi"
    POKTAN ||--o{ CATATAN_PANEN : "mencatat"
    POKTAN ||--o{ PENCAIRAN_POKTAN : "mencairkan"

    SUPPLIER ||--o{ PRE_ORDER : "membuat"
    SUPPLIER ||--o{ TRANSAKSI : "membeli"
    SUPPLIER ||--o{ HARGA_HISTORIS : "menentukan"

    PRE_ORDER ||--o{ TRANSAKSI : "menghasilkan"

    TRANSAKSI ||--o{ KONTRIBUSI_PETANI : "melibatkan"
    TRANSAKSI ||--o{ PEMBAYARAN_ESCROW : "dibayar"
    TRANSAKSI ||--o{ QA_INSPEKSI : "diinspeksi"
    TRANSAKSI ||--o{ LOGISTIK : "dikirim"
    TRANSAKSI ||--o{ DISPUTES : "disengketakan"

    LOGISTIK ||--o{ PENGIRIMAN : "dilacak"
    PENGIRIMAN ||--o{ PENGIRIMAN_EVENTS : "memiliki"

    USERS ||--o{ KREDIT : "mengajukan"
    KREDIT ||--o{ CICILAN_KREDIT : "dicicil"

    DISPUTES ||--o{ DISPUTE_EVIDENCE : "dilampiri"
    DISPUTES ||--o{ DISPUTE_TIMELINE : "dicatat"

    USERS {
        uuid id PK
        string no_hp
        string nama
        enum role "petani|ketua_poktan|supplier|admin"
        string kyc_status
        boolean is_verified
    }

    POKTAN {
        uuid id PK
        string nama
        string kecamatan
        float qa_score
        string sertifikasi
        int jumlah_anggota
    }

    SUPPLIER {
        uuid id PK
        string nama_perusahaan
        string wilayah_operasi
        float rating
        int kapasitas_ton
    }

    PRE_ORDER {
        uuid id PK
        uuid supplier_id FK
        uuid matched_poktan_id FK
        string komoditas
        float volume_kg
        string grade_min
        jsonb ai_matching_result
    }

    TRANSAKSI {
        uuid id PK
        uuid poktan_id FK
        uuid supplier_id FK
        string komoditas
        float volume_kg
        float harga_per_kg
        float total
        enum status
    }

    QA_INSPEKSI {
        uuid id PK
        uuid transaksi_id FK
        string grade_result "A|B|C|TOLAK"
        jsonb form_data
        boolean supplier_review
    }

    KREDIT {
        uuid id PK
        uuid user_id FK
        float jumlah
        int skor_ai
        enum status
    }
```

---

## 6. Tech Stack Overview

```mermaid
graph LR
    subgraph Client["🖥️ Client Layer"]
        Next["Next.js 16"]
        React["React 19"]
        Tailwind["TailwindCSS 4"]
        Shadcn["shadcn/ui"]
        Zustand["Zustand"]
    end

    subgraph Server["⚙️ Server Layer"]
        API["API Routes\n75+ Endpoints"]
        SSR2["Server Components\nStreaming SSR"]
        Middleware["Auth Middleware\nJWT Validation"]
    end

    subgraph Data["💾 Data Layer"]
        Supa["Supabase\nPostgreSQL"]
        RLS2["Row Level\nSecurity"]
        Realtime["Real-time\nSubscriptions"]
        Store["Supabase\nStorage"]
    end

    subgraph Intelligence["🧠 AI Layer"]
        GroqAPI["Groq API\nLLaMA 3.3 70B"]
        CacheDB["Groq Cache\nTTL-based"]
        Rules["Rule Engine\nQA Grading"]
    end

    subgraph Deploy["🚀 Deployment"]
        VercelDeploy["Vercel\nEdge Functions"]
        CDN["Vercel CDN\nGlobal Edge"]
    end

    Client --> Server --> Data
    Server --> Intelligence
    Client --> Deploy

    style Client fill:#E3F2FD,stroke:#1565C0
    style Server fill:#FFF3E0,stroke:#E65100
    style Data fill:#FBE9E7,stroke:#BF360C
    style Intelligence fill:#F3E5F5,stroke:#7B1FA2
    style Deploy fill:#E8F5E9,stroke:#2E7D32
```

---

## Cara Render ke Gambar

1. **Mermaid Live Editor**: Buka [mermaid.live](https://mermaid.live), paste kode mermaid, lalu export PNG/SVG
2. **VS Code**: Install extension "Markdown Preview Mermaid Support"
3. **CLI**: `npx @mermaid-js/mermaid-cli mmdc -i DIAGRAMS.md -o output.png`

> Pilih diagram yang paling relevan untuk proposal, rekomendasi:
> - **Diagram 1** (Arsitektur Sistem) untuk gambaran umum
> - **Diagram 2** (Alur Transaksi) untuk cara kerja
> - **Diagram 3** (Modul AI) untuk technical approach
