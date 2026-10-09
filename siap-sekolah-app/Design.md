# Design System & Pedoman Filosofi UI/UX: Kalamula

> *"Bukan menguji, melainkan mengerti. Menilik waktu, menyambut langkah mula."*

---

## 1. Fondasi Filosofi Produk

### 1.1 Ontologi: Menentang Ujian, Merayakan Waktu

**Kalamula** berakar dari dua kata:

* **Kala (Ruang & Waktu):** Pengakuan bahwa setiap anak tumbuh dalam ritme biologis, neurologis, dan emosional yang khas. Kesiapan belajar (*school readiness*) tidak dapat dipaksa matang secara seragam.
* **Mula (Titik Awal & Pijakan Fondasi):** Merujuk pada titik keberangkatan anak menuju fase baru dalam hidupnya.

Aplikasi ini menolak paradigma asesmen kaku berbasis angka biner (lulus vs tidak lulus) atau tes calistung mekanistik. Kalamula dirancang sebagai instrumen **asesmen otentik-naturalistik** yang menangkap dinamika tumbuh kembang anak di lingkungan belajar nyata.

### 1.2 Integrasi Tiga Pilar Keilmuan

* **Pedagogis (Fase Fondasi & Kontinum Belajar):**
Mengamati 6 Kemampuan Fondasi (regulasi diri, sosio-emosional, komunikasi bertutur, koordinasi motorik, nalar kritis, dan kemandirian) sebagai garis kontinum yang utuh dari PAUD menuju SD.
* **Psikologis (Regulasi Diri & Kelekatan Aman):**
Menyediakan wadah untuk memetakan fungsi eksekutif (*executive function*), bahasa tubuh, ketahanan frustrasi, dan gaya kelekatan (*attachment*) calon siswa baru.
* **Afektif & "Anak Senja" (Ruang Tenang):**
Menghadirkan antarmuka digital yang teduh, hening, dan kontemplatif. Menjauhkan guru dan orang tua dari stres data, serta membawa nuansa sore hari yang santai dan mengayomi.

---

## 2. Prinsip Desain UI/UX (Design Tenets)

1. **Psychological Safety (Rasa Aman Psikologis):**
Hindari warna merah alarm atau hijau checklist kaku. Indikator kematangan disajikan dalam kontinum pertumbuhan (*Belum Muncul*, *Muncul dengan Bimbingan*, *Mandiri & Konsisten*).
2. **Keterbacaan Rendah Beban Kognitif (*Low Cognitive Load*):**
Guru di kelas memegang tablet sembari mengamati anak bermain. Antarmuka harus lapang, minim distraksi, dengan hierarki tipografi yang lugas.
3. **Sentuhan Organik & Memanusiakan (*Human-Centered Tactility*):**
Komponen visual mengadopsi sudut membulat lebar (*soft rounded*), analogi kertas gambar, dan bahasa tutur yang empatik.

---

## 3. Sistem Warna (The Warm Earth & Twilight Palette)

Palet ini mengabstraksikan tanah tempat benih berakar, daun tunas muda, dan langit senja yang meneduhkan.

| Token Desain | Nama Warna | Kode Hex | Peran & Makna Filosofis |
| --- | --- | --- | --- |
| `color-primary` | **Terracotta / Warm Clay** | `#C86D51` | Warna tanah liat; melambangkan kehangatan asal mula, rasa aman, dan pijakan awal yang kukuh. Digunakan untuk tombol utama dan status capaian mandiri. |
| `color-secondary` | **Muted Sage Green** | `#7E9A86` | Warna tunas pertama; melambangkan pertumbuhan alami tanpa paksaan, ketenangan, dan kesiapan adaptif. Digunakan untuk aksen status dan kategori aktif. |
| `color-balance` | **Dusk Slate** | `#4A5D6E` | Warna langit senja; merepresentasikan ketelitian observasi, stabilitas psikologis, dan kedalaman telaah guru. Digunakan untuk header kartu dan navigasi sekunder. |
| `color-surface` | **Warm Oat / Soft Cream** | `#FAF7F2` | Warna dasar kertas buku gambar; menggantikan warna putih steril rumah sakit agar layar ramah di mata dan terasa hangat. |
| `color-card` | **Pure Milk Surface** | `#FFFFFF` | Permukaan kartu dengan sudut lengkung lembut untuk membedakan layer interaktif. |
| `color-text-main` | **Deep Espresso** | `#2C2725` | Hitam arang bernuansa cokelat hangat; menghilangkan ketajaman *pure black* agar teks panjang tetap empuk dibaca. |
| `color-text-muted` | **Earth Umber Muted** | `#7A726D` | Keterangan tambahan, metadata usia, dan label instruksi non-kritis. |
| `color-neutral-soft` | **Pebble Grey** | `#EBE6DF` | Warna pembatas lembut (*divider*) dan latar tombol status awal. |

---

## 4. Tipografi (Typography Hierarchy)

Kombinasi font mengawinkan kehangatan ramah anak dengan keterbacaan data instrumen psikopedagogis.

### 4.1 Font Display / Header: **Outfit** atau **Nunito**

* **Karakter:** *Geometric Sans-Serif with Soft Terminals*.
* **Tujuan:** Menghadirkan kesan santai, bersahabat, seperti judul buku dongeng modern.
* **Aturan Penggunaan:**
* `Display 1 (Logo)`: 28px / Weight: 600 (Semua huruf kecil: `kalamula`)
* `Heading 1 (Sapaan)`: 22px / Weight: 700 (`Halo, Ibu Rina.`)
* `Heading 2 (Nama Bagian)`: 14px–16px / Weight: 600 / Tracking: 0.02em / Uppercase lembut (`6 PILAR KEMAMPUAN FONDASI`)



### 4.2 Font Body & Konten Data: **Plus Jakarta Sans** atau **Inter**

* **Karakter:** *Modern Humanist / Geometric Sans-Serif* dengan *x-height* lapang.
* **Tujuan:** Ketajaman tinggi saat membaca catatan anekdot cepat dan indikator perilaku di layar tablet.
* **Aturan Penggunaan:**
* `Body Regular`: 14px / Line-height: 1.5 / Weight: 400
* `Body Strong / Label`: 14px / Weight: 600
* `Anekdot / Refleksi`: 13px–14px / Style: *Italic* / Line-height: 1.6 (`"Arka sempat terdiam 5 detik saat balok jatuh..."`)
* `Caption & Meta`: 11px–12px / Weight: 500



---

## 5. Komponen UI & Layout

### 5.1 Radius Sudut (Border Radius)

* `radius-pill` (9999px): Digunakan untuk tombol seleksi status, tag kemampuan, dan CTA utama.
* `radius-card` (20px – 24px): Digunakan untuk kartu profil siswa dan panel catatan observasi.
* `radius-inner` (12px – 16px): Digunakan untuk bingkai foto candid, textarea anekdot, dan input mikro.

### 5.2 Skala Status Observasi (The Continuity Toggle)

Menggantikan sistem centang lulus/gagal menjadi tombol pil bertahap:

1. **Belum Muncul:** Background `#EBE6DF`, Teks `#7A726D`
2. **Muncul dengan Bimbingan:** Background `#E4EDE7`, Teks `#4E6B56` (Sage muda)
3. **Mandiri & Konsisten:** Background `#C86D51`, Teks `#FFFFFF` (Terra cotta hangat)

### 5.3 Kartu Profil Siswa (Natural Portrait Card)

* Metadata minimalis: Nama lengkap, nama panggilan, usia terperinci (misal: *6 Tahun 2 Bulan*), dan nama orang tua.
* Tanpa label ranking, skor angka, atau barcode besar yang mengesankan nomor registrasi kaku.

### 5.4 Area Catatan Anekdot & Reflektif

* Ruang input lapang menyerupai buku jurnal harian.
* Menyediakan pintasan cepat satu sentuhan: `[+ Ambil Foto Momen]` untuk mendukung dokumentasi pedagogis visual (Reggio Emilia).
* Tombol akhir: `[Simpan Jurnal]` menggunakan gaya *Dusk Slate* (`#4A5D6E`) atau *Terracotta* (`#C86D51`).

---

## 6. Tone of Voice & Mikro-Kopi

* **Hindari Terminologi Pengujian:**
* *Bukan:* "Tes Diagnostik", "Lulus Ambang Batas", "Nilai Akhir", "Gagal Asesmen".
* *Gunakan:* "Kalamula", "Peta Tumbuh", "Langkah Mula", "Catatan Reflektif", "Ruang Observasi".


* **Sapaan Lembut:**
*"Hari ini kita mengamati ritme belajar Ananda tanpa tergesa."*
* **Laporan Orang Tua:**
Format laporan berbentuk narasi berkala beraksen surat kabar hangat, bukan lembar rapor angka, menekankan kekuatan unik anak dan area yang siap dieksplorasi bersama di rumah.