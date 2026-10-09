# 🏫 Siap Sekolah

> *"Fondasi Tepat untuk Langkah Awal yang Kuat."*

Aplikasi Web Asesmen Diagnostik Kesiapan Belajar Calon Siswa SD berbasis **6 Kemampuan Fondasi (Transisi PAUD ke SD yang Menyenangkan)**. Didesain khusus untuk evaluator pos di lapangan, admin PPDB, dan guru kelas 1 SD (Fase A) dengan antarmuka Apple iOS Minimalist (*Anti-AI Slop*).

---

## 🚀 Tech Stack & Arsitektur

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS (iOS System Colors & Cupertino Human Interface Tokens)
- **State & Offline**: Progressive Web App (PWA), Service Worker (`sw.js`), IndexedDB Auto-save (`idb`), Sync Indicator (🟢/🟡)
- **Smart Class Balancer**: Algoritma Serpentine 4-Tier Balancing (Gender 50:50, Sinyal Red Flag, Reading Level TaRL L1–L4, Rata-rata Skor)
- **Pelaporan & PDF**: Pure SVG Radar Chart (5 Pos Observasi), Laporan Profil Individual Siswa (PDF 1 Halaman Siap Cetak), Paket Rekomendasi Guru Kelas 1 Fase A
- **Deployment**: Siap Cloudflare Pages & Workers (`wrangler.jsonc`)

---

## 🔑 Hak Akses & Kredensial Login

| Peran | URL Akses | Metode Autentikasi | PIN Akses |
|---|---|---|---|
| **Admin / Koordinator PPDB** | `/admin` | Akses Penuh Manajemen & Balancer | `1234` |
| **Evaluator Pos 1** | `/evaluator` $\rightarrow$ P1 | Keypad PIN 4-Digit | `1000` atau `1234` |
| **Evaluator Pos 2** | `/evaluator` $\rightarrow$ P2 | Keypad PIN 4-Digit | `2000` atau `1234` |
| **Evaluator Pos 3** | `/evaluator` $\rightarrow$ P3 | Keypad PIN 4-Digit | `3000` atau `1234` |
| **Evaluator Pos 4** | `/evaluator` $\rightarrow$ P4 | Keypad PIN 4-Digit | `4000` atau `1234` |
| **Evaluator Pos 5** | `/evaluator` $\rightarrow$ P5 | Keypad PIN 4-Digit | `5000` atau `1234` |
| **Guru Kelas 1 (Fase A)** | `/teacher` | Read-Only Dashboard & TaRL | `5678` atau `1234` |
| **Orang Tua Calon Siswa** | `/parent/[studentId]` | Scan QR Code di Ruang Tunggu | Bebas Akses (Publik) |

---

## ⚡ Fitur Utama per Fase

### 1. Admin Panel (`/admin`)
- **Dashboard Overview**: Statistik real-time, sebaran gender, jumlah batch, status evaluasi, dan red flag.
- **Batch Manager (`/admin/batches`)**: Buka, aktifkan, dan kunci gelombang asesmen (*draft* $\rightarrow$ *active* $\rightarrow$ *locked*).
- **Data Siswa (`/admin/students`)**: Download template Excel `.xlsx`, upload data dengan auto-validasi & deteksi duplikat, serta tambah siswa manual.
- **Rubrik Dinamis (`/admin/configs`)**: *No-Code CMS* untuk mengubah deskripsi skor 1–4 dan checklist *Red Flag* tanpa deploy ulang kode.
- **Smart Class Balancer (`/admin/classes`)**: Algoritma Serpentine pemilah 56 siswa ke Kelas 1A (28 anak) & 1B (28 anak) dengan opsi *manual swap* & pencatatan alasan.
- **Laporan & PDF (`/admin/reports`)**: Direktori seluruh profil siswa individual dengan link cetak PDF instan.

### 2. Evaluator Pos Mobile Interface (`/evaluator`)
- **Sticky Header**: Avatar, nama panggilan, nomor pendaftaran, dan *progress ring* pengisian indikator.
- **Tombol Skor Jumbo**: Skor 1 (BT), 2 (MB), 3 (BSH), 4 (BSB) dengan tinggi $\ge 48\text{px}$ dan deskripsi indikator.
- **Red Flag Switch**: iOS toggle switch dengan tingkat keparahan (🔴 Critical / 🟡 Moderate).
- **Pemetaan Kesiapan Membaca (Pos 4)**: Level 1 (Logografis), Level 2 (Fonemik), Level 3 (Suku Kata), Level 4 (Membaca Lancar).
- **Catatan Anekdot**: iOS Bottom Sheet untuk mencatat perilaku unik dan respons spontan anak.
- **Offline-First Auto-Save**: Auto-save ke IndexedDB setiap 500ms dan antrean sinkronisasi background saat koneksi Wi-Fi pulih.

### 3. Portal Guru Kelas 1 SD (`/teacher`)
- **Stasiun Literasi (TaRL)**: Pengelompokan Kelompok A (Intervensi Pra-Literasi L1–L2) vs Kelompok B (Penguatan Membaca L3–L4) lengkap dengan strategi pembelajaran.
- **Panduan Transisi MPLS (2 Minggu Pertama)**: Alur aktivitas ramah anak tanpa tes calistung formal.
- **Penyesuaian ATP Kurikulum Merdeka**: Panduan diferensiasi proses dan asesmen formatif non-tes.
- **Protokol Siswa Red Flag**: Panduan pendampingan ramah anak tanpa label negatif.

### 4. Laporan Profil Individual Siswa (`/reports/student/[id]`)
- Layout A4 1 Halaman Siap Cetak (`window.print()`).
- Pure SVG Radar Chart (Peta Kesiapan 5 Pos Observasi).
- Narasi kualitatif otentik dan saran stimulasi orang tua di rumah.
- Kolom tanda tangan asesor & orang tua.

---

## 🛠️ Menjalankan Proyek Lokal

```bash
# Pindah ke direktori aplikasi
cd siap-sekolah-app

# Jalankan development server
npm run dev

# Buka aplikasi di browser
# http://localhost:3000
```

### Build Produksi

```bash
npm run build
```

---

*Hak Cipta © 2026 Tim Pengembang Siap Sekolah.*
