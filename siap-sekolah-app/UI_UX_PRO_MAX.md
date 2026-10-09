# 🎨 UI_UX_PRO_MAX.md — Design Intelligence & Rulebook

## 🏛️ 1. ARCHITECTURE & HIERARCHY OF RULES
Dokumen ini bekerja sebagai **Engine Tata Letak & UX Pattern**. Seluruh aturan di dalam file ini tunduk pada aturan hierarki berikut:

1. **DESIGN.md (Aetrium System)** ➔ **HAK UTAMA WARNA & BRAND IDENTITY** (*Soft Sage `#5C7C68`*, *Warm White `#FAFAF8`*, *Warm Grey*).
2. **UI_UX_PRO_MAX.md** ➔ **DESAIN TATA LETAK, GRID, & KOMPONEN UX**.
3. **impeccable.md** ➔ **PRESISI TYPOGRAPHY, SPACING, & MIKRO-INTERAKSI**.
4. **antislop.md** ➔ **FILTER KUALITAS & SATPAM MUTLAK** (Membuang elemen generik AI).

---

## 📐 2. LAYOUT & COMPONENT PATTERNS

### A. School Operating System & Educational Dashboard
- **Pattern**: *Morning Brief + Hero Card + Story Timeline + Interactive Class Balancer*.
- **Visual Rhythm**: Gunakan variasi komposisi antar-seksi (*Whitespace lega*, tanpa grid data kaku).
- **Navigation**: Sidebar orientasi minimalis dengan icon *outline* (tanpa icon warna-warni/glow).
- **Cards**: Background putih (`#FFFFFF`), *radius* 24px, *padding* 24px, *shadow* lembut (`0 4px 12px rgba(0,0,0,0.03)`).

### B. Touch Ergonomics (Mobile & Tablet Evaluator)
- **Primary Touch Target**: Minimal `44px × 44px` (Gunakan `48px` untuk tombol opsi skor Pos 1-5).
- **Segmented Control**: *Jumbo Segmented Control* bergaya iOS untuk pilihan skor 1 (BT) s.d. 4 (BSB) agar nyaman ditekan dengan jempol.
- **Form Controls**: Input height 48px, radius 18px, padding 16px.

---

## 🎨 3. COLOR & TYPOGRAPHY SYSTEM

### Color Palette (Aetrium Dominance)
- **Primary Accent**: Soft Sage (`#5C7C68`) — Digunakan pada tombol utama, tab aktif, dan progress bar.
- **Primary Hover**: Deep Sage (`#4E6B59`).
- **Base Background**: Warm White (`#FAFAF8`).
- **Card Background**: Pure White (`#FFFFFF`).
- **Text Primary**: High Contrast Charcoal (`#1C1C1E`).
- **Status Badges (Soft Pastel)**:
  - *Sangat Baik (BSB)*: Soft Green (`#D8F0DD`)
  - *Berkembang (BSH)*: Soft Blue (`#DCECF8`)
  - *Mulai Berkembang (MB)*: Soft Yellow (`#FFF4D6`)
  - *Belum Tampak (BT)*: Soft Red (`#F7D8D8`)

### Typography Hierarchy
- **Primary Font**: `DM Sans` / `SF Pro` / `Inter` (Fallback).
- **Headings**: Kontras jelas, *balanced wrapping*, tanpa efek *gradient text* mencolok.
- **Body Text**: Minimal contrast ratio `4.5:1` (WCAG AA).

---

## ⚡ 4. MOTION & MICRO-INTERACTION RULES

- **Duration**: `160ms` – `220ms`, menggunakan *easing* `ease-out`.
- **Card Hover**: *Lift* lembut `translateY(-2px)` dengan peningkatan *shadow* tipis.
- **Page Transitions**: *Fade In* (`opacity 0 -> 100%`, `translateY 8px -> 0`, `350ms`).
- **Anti-Motion**: Dilarang menggunakan *Bounce*, *Flip*, *Rotate*, *Zoom* berlebihan, atau *loading spinner* raksasa (Gunakan *Skeleton Loading*).

---

## 🚫 5. ANTI-PATTERNS (HAL YANG WAJIB DIHINDARI)

❌ Jangan gunakan *blue/purple gradient* atau background *neon*.  
❌ Jangan gunakan *glassmorphism* berlebihan di semua komponen.  
❌ Jangan buat *data table* kaku sebagai halaman utama (Gunakan *Card View* & *Story Timeline*).  
❌ Jangan gunakan angka/statistik palsu (*10K+ Users*, *99.9% Uptime*).  
❌ Jangan gunakan tombol mati (*dead buttons*) yang tidak bisa diklik.  

---

## ✅ 6. PRE-DELIVERY CHECKLIST

- [ ] Apakah halaman dapat dipahami dalam waktu **kurang dari 5 detik**?
- [ ] Apakah seluruh *clickable element* memiliki `cursor-pointer` dan indikator *focus* keyboard?
- [ ] Apakah layout responsif tanpa *horizontal scrollbar* di layar mobile (`375px`)?
- [ ] Apakah warna dan suasana antarmuka sudah terasa **Calm, Human, & Elegant**?