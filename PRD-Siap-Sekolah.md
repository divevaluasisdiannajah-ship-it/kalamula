# 📄 PRODUCT REQUIREMENT DOCUMENT (PRD)

## **Siap Sekolah**

> *"Fondasi Tepat untuk Langkah Awal yang Kuat."*

---

### 1. RINGKASAN PRODUK & LATAR BELAKANG (*PRODUCT OVERVIEW*)

* **Nama Aplikasi**: Siap Sekolah
* **Tagline**: *"Fondasi Tepat untuk Langkah Awal yang Kuat."*
* **Tujuan Utama**: Memfasilitasi proses asesmen diagnostik kesiapan belajar calon siswa SD berbasis 6 Kemampuan Fondasi (Transisi PAUD ke SD yang Menyenangkan). Aplikasi ini digunakan oleh 5 evaluator pos di lapangan untuk input data kualitatif secara *real-time*, mendeteksi *red flags*, memetakan kesiapan membaca, serta menghasilkan *dashboard master*, laporan profil individu (PDF 1 halaman), dan paket rekomendasi diferensiasi pembelajaran + pembagian kelas seimbang (Kelas 1A & 1B).
* **Kapasitas & Skema Operasional**: Total target **56 Calon Siswa** (2 Rombel: Kelas 1A @ 28 anak & Kelas 1B @ 28 anak), dievaluasi secara berkala per *batch/gelombang* (15–20 anak per 2–4 minggu).
* **Target Pengguna & Hak Akses (RBAC)**:

  1. **Admin / Koordinator PPDB**: Full Access (Manajemen Config/Rubrik Dinamis, Batch Manager, Import/Export Excel, Smart Class Balancer, PDF Generator, Lock/Unlock Batch).
  2. **Evaluator Pos 1–5**: Restricted Mobile Access via PIN 4-Digit atau QR Code Pos (Hanya melihat daftar anak dan menginput skor, *red flags*, & catatan anekdot di pos tugasnya pada batch aktif).
  3. **Guru Kelas 1 SD (Fase A)**: Read-Only Access (Membaca *Dashboard Master*, Grafik Radar Peta Kesiapan, Stasiun Literasi, dan Laporan Profil Individu Siswa).

---

### 2. ARSITEKTUR TEKNIS & TECH STACK (FULLSTACK CLOUDFLARE)

* **Frontend Framework**: Next.js / Remix (React) dipadukan dengan **Tailwind CSS + Shadcn/ui** (iOS Minimalist Design System, Anti-AI Slop).
* **Hosting & Backend API**: **Cloudflare Pages & Cloudflare Workers** (Serverless Edge Functions, API response latency < 50ms).
* **Database**: **Cloudflare D1 (SQLite)** atau **Supabase (PostgreSQL)** dengan dukungan fitur JSONB untuk skema konfigurasi rubrik dinamis (*Config-Driven Architecture*).
* **Storage & File Management**: **Cloudflare R2** untuk penyimpanan template Excel `.xlsx` dan dokumen PDF Laporan Profil Siswa.
* **PWA & Offline Capability**: Progressive Web App (PWA) dengan *Service Worker & IndexedDB/LocalStorage Sync* (Mode *Offline-First* agar data tidak hilang saat koneksi Wi-Fi sekolah tidak stabil).
* **PDF Generator**: `@react-pdf/renderer` atau `pdf-lib` (Proses pencetakan laporan PDF secara *client-side* / *edge* yang ringan).

---

### 3. SPESIFIKASI FUNGSIONAL & FITUR UTAMA

#### A. Modul Pengaturan Dinamis (*No-Code CMS Admin*)

* **Dynamic Assessment Builder**: Admin dapat menambah, mengedit, atau menonaktifkan Pos Observasi, Indikator, Deskripsi Skor 1–4, dan *Checklist Red Flags* tanpa perlu melakukan *refactoring* kode program (*zero-code modification*).
* **Batch & Cohort Manager**: Membuka, memantau, dan mengunci sesi observasi berkala (misal: *Batch 1*, *Batch 2*).
* **Import/Export Data Siswa via Excel**:

  * Download template `.xlsx` dengan *header* baku: `No_Pendaftaran`, `Nama_Lengkap`, `Nama_Panggilan`, `Tanggal_Lahir`, `Jenis_Kelamin`, `Nama_Orang_Tua`, `No_WhatsApp`.
  * Engine *Upload & Auto-Validation*: Mendeteksi data ganda (*duplicate registration*), validasi format tanggal lahir, dan peringatan *mandatory field* yang kosong.

#### B. Antarmuka Evaluator Pos (*Mobile/Tablet UX*)

* **Sistem Login Ringkas**: Login via PIN 4-Digit atau QR Code spesifik Pos (Pos 1 s.d. Pos 5).
* **Spesifikasi Ergonomi iOS Human Interface**:

  * *Sticky Header*: Menampilkan Foto/Avatar, Nama Panggilan, Badge Warna Kelompok, dan *Progress Ring* pengisian (misal: `3/4 Indikator Selesai`).
  * *iOS Segmented Controls*: Button pilihan skor **1 (BT), 2 (MB), 3 (BSH), 4 (BSB)** berukuran jumbo (`height >= 48px`, *full-width*, *tactile feedback*).
  * *iOS Toggle Switch*: Sakelar On/Off untuk pemicu sinyal *Red Flag*.
  * *iOS Bottom Sheet*: Modal lembar bawah untuk input cepat catatan anekdot lisan (*Voice-to-Text*) atau teks pendek.
  * *Sync Indicator Dot*: Penanda visual di sudut atas: 🟢 *(Tersinkron)* / 🟡 *(Tersimpan Lokal)*.
* **Form Kuesioner Orang Tua via QR Code**: Orang tua di ruang tunggu dapat memindai QR Code untuk mengisi 5 pertanyaan pilihan ganda singkat terkait riwayat kemandirian/kesehatan anak, yang datanya otomatis terintegrasi ke Laporan PDF.

#### C. Rubrik & Indikator 5 Pos Observasi (Transisi PAUD-SD)

##### 1. POS 1: Kedatangan, Self-Care, & Kematangan Emosi

* **1.1**: Berpisah dari orang tua dengan tenang tanpa kecemasan ekstrem.
* **1.2**: Mandiri melepaskan & merapikan sepatu di rak serta menggantungkan tas.
* **1.3**: Menggunakan kata santun (*tolong, terima kasih, maaf*) & budaya mengantre/bersabar.
* 🚨 **Red Flag Checklist**: Tantrum histeris melantai (>10 menit), panik berlebihan, atau perilaku agresif membahayakan.

##### 2. POS 2: Motorik Kasar & Koordinasi Fisik

* **2.1**: Keseimbangan & koordinasi tubuh (berjalan lurus, meniti papan titian, melompat 2 kaki).
* **2.2**: Ketepatan merespons instruksi gerak verbal & koordinasi mata-tangan (tangkap bola).
* 🚨 **Red Flag Checklist**: Tonus otot kaku/lemas (*hipertonia/hipotonia*), sering jatuh tanpa sebab, atau tidak bisa melompat 2 kaki.

##### 3. POS 3: Kematangan Kognitif & Numerasi Dasar

* **3.1**: Memilah benda berdasarkan atribut (warna/ukuran) & melengkapi pola berulang (*patterning*).
* **3.2**: Memahami konsep perbandingan kuantitas (*banyak/sedikit*) & pemecahan masalah (puzzle/balok).
* 🚨 **Red Flag Checklist**: Disorientasi spasial berat, tidak paham hubungan sebab-akibat sederhana, atau frustrasi ekstrem saat tantangan gagal.

##### 4. POS 4: Bahasa Lisan, Pra-Literasi, & Motorik Halus

* **4.1**: Menyimak & memahami pesan cerita lisan yang dibacakan (*read-aloud*).
* **4.2**: Mengomunikasikan gagasan lisan tentang hasil gambarnya dengan kalimat yang jelas.
* **4.3**: Kontrol motorik halus & genggaman alat tulis fungsional (*pincer/tripod grasp*).
* **4.4 🆕 Pemetaan Kesiapan Membaca (Reading Level)**:

  * `Level 1 (Logografis)`: Belum membaca; sebut objek dari gambar/simbol visual.
  * `Level 2 (Pengenalan Huruf/Fonem)`: Kenal beberapa bentuk/bunyi huruf vokal/konsonan.
  * `Level 3 (Suku Kata / Kata Sederhana)`: Mengeja/membaca kata berkombinasi KV (misal: *bu-ku, bo-la*).
  * `Level 4 (Membaca Lancar & Paham Makna)`: Membaca kalimat pendek dengan lancar dan memahami artinya.
* 🚨 **Red Flag Checklist**: Bicara tidak dapat dipahami (*speech delay* berat), ekolalia (menirukan kata tanpa makna), *no joint attention* (kontak mata absen total), atau otot tangan sangat lemas.

##### 5. POS 5: Bermain Bebas, Interaksi Sosial, & Koordinator Tim

* **5.1**: Bermain kooperatif, berbagi mainan, dan berinteraksi sehat dalam kelompok.
* **5.2**: Regulasi emosi saat terjadi perbedaan pendapat/konflik kecil dalam bermain.
* 🚨 **Red Flag Checklist**: *Extreme social withdrawal* (menyendiri total/menolak disapa), impulsif ekstrem, atau hiperaktif.

#### D. Engine Smart Class Balancer (Algoritma Pembagi Kelas 1A & 1B)

* **Metode Distribution**: *Serpentine / Snake Distribution Logic* berbasis bobot variabel.
* **Aturan Urutan Variabel Penyeimbang**:

  1. *Hard Constraint*: Keseimbangan Jenis Kelamin (Wajib 14 Laki-laki & 14 Perempuan per kelas).
  2. *Priority 1*: Pemerataan Siswa dengan Sinyal *Red Flag* (disebar seimbang antara 1A dan 1B).
  3. *Priority 2*: Keseimbangan Sebaran Level Membaca (Proporsi anak Level 1–2 dan Level 3–4 seimbang).
  4. *Priority 3*: Keseimbangan Rata-Rata Skor Keseluruhan.
* **Fitur Override & Manual Swap**: Admin dapat menukar siswa antar-kelas (*drag-and-drop*) dengan indikator peringatan visual jika terjadi ketidakseimbangan statistik.

#### E. Modul Pelaporan & Paket Rekomendasi Guru Kelas 1

1. **Laporan Profil Individual Siswa (PDF 1–2 Halaman)**:

   * Header Identitas + Foto/Avatar Siswa.
   * *Radar Chart* Peta Kesiapan 5 Pos Observasi.
   * Deskripsi Naratif Kualitatif Autentik per Pos.
   * Status Pemetaan Kesiapan Membaca (Level 1–4).
   * Catatan Potensi Unik & Saran Stimulasi Orang Tua di Rumah.
2. **Master Summary Dashboard & Excel Export**.
3. **Paket Rekomendasi Guru Kelas 1 (Fase A)**:

   * *Stasiun Literasi / TaRL*: Kelompok A (Intervensi Pra-Literasi L1–L2) vs Kelompok B (Penguatan Membaca L3–L4).
   * *Panduan Masa Transisi MPLS (2 Minggu Pertama)*.
   * *Penyesuaian Alur Tujuan Pembelajaran (ATP) Kurikulum Merdeka*.
   * *Strategi Penanganan Khusus Siswa Red Flag*.

---

### 4. UI/UX DESIGN SYSTEM SPECIFICATION (iOS MINIMALIST)

* **Filosofi Design**: *Apple-Inspired Minimalist (Anti-AI Slop)*. Tanpa gradien neon, tanpa efek *glow*, tanpa ornamen dekoratif yang tidak perlu.
* **Palet Warna Semantic**:

  * Latar Belakang: Soft Warm Gray / Off-White (`#F2F2F7` / `#F8F9FA`).
  * Kartu / Panel: Pure White (`#FFFFFF`), `rounded-2xl` (16px), border `1px solid #E5E5EA`.
  * Primary Accent: iOS Blue (`#007AFF`).
  * Status Success / Synced: iOS Green (`#34C759`).
  * Status Warning / Need Support: iOS Amber (`#FF9500`).
  * Status Danger / Red Flag: iOS Red (`#FF3B30`).
* **Tipografi**: System Font Stack (`-apple-system`, `SF Pro Text`, `Inter`) dengan kontras teks tinggi (`#1C1C1E`).
* **Ergonomi Touch Zone**: Ukuran minimum tombol interaktif `48px x 48px` untuk kemudahan navigasi satu tangan.

---

### 5. SKEMA DATABASE CONCEPTUAL (SQL / JSONB)

```sql
-- Tabel Pengguna & Hak Akses
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'evaluator', 'teacher')),
    pin_hash TEXT,
    pos_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Batch / Gelombang Observasi
CREATE TABLE batches (
    id TEXT PRIMARY KEY,
    batch_name TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT CHECK(status IN ('active', 'locked')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Data Siswa
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    registration_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    birth_date DATE NOT NULL,
    gender TEXT CHECK(gender IN ('L', 'P')),
    parent_name TEXT,
    phone TEXT,
    batch_id TEXT REFERENCES batches(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pengaturan Rubrik & Indikator Dinamis
CREATE TABLE assessment_configs (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    pos_number INTEGER NOT NULL,
    pos_name TEXT NOT NULL,
    indicators_json JSONB NOT NULL,
    red_flags_json JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Hasil Input Evaluator
CREATE TABLE evaluations (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id),
    pos_number INTEGER NOT NULL,
    evaluator_id TEXT REFERENCES users(id),
    scores_json JSONB NOT NULL,
    reading_level TEXT CHECK(reading_level IN ('L1', 'L2', 'L3', 'L4')),
    red_flags_json JSONB NOT NULL,
    anecdotal_note TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Hasil Pembagian Kelas (Smart Balancer)
CREATE TABLE class_placements (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id),
    assigned_class TEXT CHECK(assigned_class IN ('1A', '1B')),
    manual_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 6. LANGKAH EKSEKUSI PROYEK & ALOKASI MODEL AI (*DEVELOPMENT ROADMAP*)

#### 📍 Phase 1: Core Foundation & Database Architecture

* **Fokus Utama**: Setup Next.js App Router, Tailwind CSS (iOS Theme), PWA Service Worker, & Schema Database.
* **🤖 Recommended AI Model**: **Claude Sonnet 4.6** *(Keunggulan: Arsitektur TypeScript & Database Schema)*
* **Task List**:

  1. Initialize Next.js project with App Router, TypeScript, and Tailwind CSS.
  2. Implement iOS Design System tokens in Tailwind config (iOS System Colors, `rounded-2xl`, SF Pro/System Font stack).
  3. Create Cloudflare D1 / Supabase SQL migrations for `students`, `batches`, `evaluations`, `assessment_configs`, and `class_placements`.
  4. Write TypeScript interfaces/types matching the database schema.
  5. Setup PWA Service Worker and IndexedDB helper functions for offline storage.

#### 📍 Phase 2: Admin CMS & Batch Manager

* **Fokus Utama**: Pengaturan Rubrik Dinamis (*No-Code Config*), Template Engine Excel Import/Export, & Cohort Management.
* **🤖 Recommended AI Model**: **Claude Opus 4.6** *(Logika Backend/Excel Validation)* & **Gemini 3.8 Flash** *(Form UI Admin)*
* **Task List**:

  1. Build Dynamic Assessment Builder UI & API (CRUD for Pos, Indicators, and Red Flags JSON).
  2. Create Batch Management system (Create, Activate, and Lock Batch).
  3. Build Excel Parser & Template Downloader for student data (`.xlsx`) with auto-validation & duplicate checking.
  4. Implement RBAC Middleware for Admin, Evaluator, and Teacher roles.

#### 📍 Phase 3: Evaluator Mobile Interface (Offline-First)

* **Fokus Utama**: UI Touch-Friendly iOS Style, LocalStorage Sync, & Form Input Evaluator.
* **🤖 Recommended AI Model**: **Gemini 3.8 Flash** *(Kecepatan Koding UI & Styling Tailwind)* & **GPT-OSS 120B** *(Custom React Hooks Sync)*
* **Task List**:

  1. Build Sticky Header with Student Avatar, Name, Group Badge, and Progress Ring.
  2. Implement iOS Segmented Controls for Skor 1 (BT) s.d. 4 (BSB) with jumbo touch target (`height >= 48px`).
  3. Implement iOS Toggle Switch for Red Flag checklist and Bottom Sheet for Anecdotal Notes.
  4. Connect local state with IndexedDB for instant auto-save and sync status indicator (🟢/🟡).
  5. Build Parent Input Form via QR Code for 5 background questions.

#### 📍 Phase 4: Smart Class Balancer Engine & PDF Generator

* **Fokus Utama**: Algoritma Serpentine 1A/1B, Client-Side PDF Renderer, & Rekomendasi Guru.
* **🤖 Recommended AI Model**: **Claude Opus 4.6** *(Penalaran Logika Algoritma)* & **Claude Sonnet 4.6** *(PDF Renderer & Dashboard)*
* **Task List**:

  1. Write `balanceClasses()` algorithm using Serpentine logic (Gender -> Red Flags -> Reading Level L1-L4 -> Average Score).
  2. Create Class Management UI with Drag-and-Drop Override/Swap and real-time balance warning stats.
  3. Build 1-Page PDF Individual Student Profile Generator with Radar Chart and qualitative descriptions (`@react-pdf/renderer`).
  4. Build Master Summary Dashboard with Differentiated Learning Recommendations (TaRL) for Grade 1 Teachers.

#### 📍 Phase 5: Polishing, Testing & Deployment

* **Fokus Utama**: Dummy Data Generation, UI Responsiveness, & Cloudflare Deployment.
* **🤖 Recommended AI Model**: **Gemini 3.8 Flash** *(Scripting & Testing)* & **GPT-OSS 120B** *(Deployment Config)*
* **Task List**:

  1. Generate 56 realistic dummy students dataset to test end-to-end flow.
  2. Test offline-to-online sync scenarios and conflict resolution.
  3. Deploy Next.js app to Cloudflare Pages and Edge APIs to Cloudflare Workers.
