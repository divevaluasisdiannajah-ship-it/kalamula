# DESIGN.md — Siap Sekolah (Aetrium System)

> *"Fondasi Tepat untuk Langkah Awal yang Kuat."*

## 1. Identity & Personality (Aetrium Philosophy)
- **Product Name**: Siap Sekolah
- **Visual Direction**: **Aetrium System** (Calm, Human, Natural, Crafted).
- **Core Mood**: Tenang, berwibawa, penuh empati bagi guru, evaluator, orang tua, dan anak usia dini.
- **Prinsip Anti-Slop**: Bebas gradien ungu-neon artifisial, tanpa border kaku berbasis generator generic AI, tanpa efek *glow* sintetis. Menghadirkan antarmuka bernafas alami dengan hierarki yang bermakna.

## 2. Aetrium Palette & Semantic Colors
- **Canvas / Background**: Warm Stone Canvas (`#F4F3EE`, Desktop PDF Workspace `#EDECE8`)
- **Card / Surface**: Pure Crisp White (`#FFFFFF`) dengan elevasi bayangan bertingkat tanpa outline kaku (`shadow-ios-card`: `0 4px 20px -2px rgba(30, 35, 32, 0.08)`) kontras jelas terhadap latar canvas.
- **Primary Accent**: **Soft Sage** (`#5C7C68`), Sage Hover (`#4B6755`), Sage Surface (`#F0F4F1`)
- **Secondary Accent**: Warm Sand / Slate Neutral (`#7A827C`)
- **Status Success / Terverifikasi**: Earthy Forest Green (`#3D7A5A`, bg: `#EBF5F0`)
- **Status Warning / Perhatian**: Warm Terracotta Amber (`#C9733B`, bg: `#FAF0E8`)
- **Status Danger / Red Flag**: Muted Crimson (`#B83A35`, bg: `#FCEEEF`)
- **Text Primary**: Deep Forest Charcoal (`#1E2320`), kontras tinggi > 11:1 terhadap Warm White
- **Text Secondary / Muted**: Muted Olive Slate (`#565C58`), kontras > 4.7:1 (WCAG AA Compliant)
- **Text Subtle**: Warm Stone Gray (`#787F7A`)

## 3. Aetrium Signature Components
1. **Morning Brief**: Panel briefing kontekstual di bagian atas Evaluator & Dashboard (menyajikan status gelombang, target observasi rombel, dan progres evaluasi hari ini dengan gaya editorial elegan).
2. **Student Hero Card**: Kartu profil siswa berjiwa manusiawi (avatar hangat, nama panggilan menonjol, usia presisi tahun & bulan, badge kelompok, dan progress ring terintegrasi).
3. **Story Timeline**: Garis kronologis anekdot observasi pos yang merangkum catatan lapangan evaluator dalam bentuk cerita kualitatif berkesinambungan.
4. **iOS Jumbo Segmented Control**: Tombol pilihan skor 1 (BT) s.d. 4 (BSB) berukuran jumbo (`height >= 48px`, `min-width: 48px`) dengan feedback taktil, deskripsi capaian kontekstual, dan warna alami.

## 4. Typography & Spacing
- **Font Stack**: **DM Sans** (`next/font/google`, self-hosted offline) dengan fallback System Font (`-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `SF Pro Display`, `Inter`, `sans-serif`)
- **Rhythm & Radius**:
  - Kontainer / Kartu: `rounded-2xl` (16px) dengan bayangan lembut `0 2px 10px rgba(40, 50, 45, 0.05)`
  - Tombol & Kontrol: `rounded-xl` (12px)
  - Lencana: `rounded-full`

## 5. Dials
- **ENERGY**: 1 (Tenang, hangat, bersahabat untuk institusi pendidikan dan ramah anak)
- **RHYTHM**: 2 (Struktur ritmis antara Morning Brief, Hero Cards, dan Timeline)
- **MOTION**: 1 (Transisi halus, tanpa animasi floating atau bounce yang mengalihkan perhatian)
