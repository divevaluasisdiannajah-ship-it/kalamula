"use client";
export const runtime = 'edge';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function CompleteAssessmentGuidePage() {
  const [activePageFilter, setActivePageFilter] = useState<number | "all">("all");
  const [configs, setConfigs] = useState<Record<number, any>>({});
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await fetch("/api/configs");
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          const map: Record<number, any> = {};
          list.forEach((c: any) => {
            if (c.pos_number && c.is_active) {
              map[c.pos_number] = {
                ...c,
                indicators: typeof c.indicators_json === "string" ? JSON.parse(c.indicators_json) : (c.indicators_json || []),
                red_flags: typeof c.red_flags_json === "string" ? JSON.parse(c.red_flags_json) : (c.red_flags_json || []),
              };
            }
          });
          setConfigs(map);
          setIsSynced(true);
        }
      } catch {
        // Fallback to static data
      }
    }
    loadConfigs();
  }, []);

  const getInd = useCallback(
    (pos: number, id: string, fallback: { label: string; desc: string; d1: string; d2: string; d3: string; foundation?: string }) => {
      const posCfg = configs[pos];
      if (!posCfg?.indicators) return fallback;
      const found = posCfg.indicators.find((i: any) => i.id === id);
      if (!found) return fallback;
      return {
        label: found.label || fallback.label,
        desc: found.description || fallback.desc,
        d1: found.score_descriptors?.[1] || found.score_descriptors?.["1"] || fallback.d1,
        d2: found.score_descriptors?.[2] || found.score_descriptors?.["2"] || fallback.d2,
        d3: found.score_descriptors?.[3] || found.score_descriptors?.["3"] || fallback.d3,
        foundation: found.foundation ? `Fondasi ${found.foundation}` : fallback.foundation,
      };
    },
    [configs]
  );

  const getRedFlags = useCallback(
    (pos: number, fallback: string[]): string[] => {
      const posCfg = configs[pos];
      if (!posCfg?.red_flags || posCfg.red_flags.length === 0) return fallback;
      return posCfg.red_flags.map((rf: any) => String(rf.label || rf || ""));
    },
    [configs]
  );

  // ─── Pos 1 Indicators (Pages 2 & 3) ───
  const so01 = getInd(1, "SO-01", {
    label: "Berpisah dari Orang Tua",
    desc: "Berpisah dari orang tua dengan tenang tanpa kecemasan berlebihan saat memasuki gerbang/titik awal observasi.",
    d1: "Menangis histeris / menolak keras ditinggal / harus didampingi orang tua masuk ruangan.",
    d2: "Sempat cemas/menangis sesaat, namun mau berpisah dan masuk setelah dibujuk pengamat.",
    d3: "Berpisah dengan tenang, ceria, mandiri, dan langsung antusias menyapa guru pendamping.",
    foundation: "Fondasi 3 • Kematangan Emosi",
  });
  const so02 = getInd(1, "SO-02", {
    label: "Kemandirian Menaruh Barang Pribadi",
    desc: "Mandiri melepaskan dan merapikan sepatu di rak serta menggantung tas pada loker/tempat yang disediakan.",
    d1: "Barang pribadi ditinggal berserakan di lantai / butuh bantuan fisik penuh dari guru.",
    d2: "Merapikan sepatu di rak dan menggantung tas dengan sedikit arahan verbal/pengingat.",
    d3: "Spontan dan tertib membuka serta meletakkan sepatu di rak dan menaruh tas secara mandiri.",
    foundation: "Fondasi 5 • Motorik & Self-Care",
  });
  const so03 = getInd(1, "SO-03", {
    label: "Kepatuhan Mengikuti Instruksi saat Transisi",
    desc: "Mengikuti instruksi pendamping dengan tertib saat berpindah antar ruang pos observasi.",
    d1: "Mengabaikan instruksi, berlarian keluar barisan, atau menolak berpindah pos.",
    d2: "Mengikuti transisi kelompok, sesekali perlu diingatkan untuk tetap tertib di barisan.",
    d3: "Sangat tertib, fokus, berjalan tenang bersama kelompok, dan tanggap terhadap aba-aba pendamping.",
    foundation: "Fondasi 2 • Sosial & Bahasa",
  });
  const so04 = getInd(1, "SO-04", {
    label: "Kesantunan dan Budaya Antre",
    desc: "Menggunakan kata santun (tolong, maaf, terima kasih) dan memiliki kesabaran menunggu giliran antrean.",
    d1: "Menyerobot antrean teman / tidak sabar menunggu giliran / bersikap agresif saat menunggu.",
    d2: "Mau mengantre tertib dan berucap santun jika diingatkan atau dicontohkan guru.",
    d3: "Konsisten sabar menunggu giliran dan spontan berucap tolong, maaf, serta terima kasih.",
    foundation: "Fondasi 1 • Agama & Budi Pekerti",
  });
  const so05 = getInd(1, "SO-05", {
    label: "Regulasi Diri & Adaptasi Kesulitan",
    desc: "Kemampuan menenangkan diri, mengendalikan emosi, dan bangkit kembali saat menghadapi kesulitan atau tantangan.",
    d1: "Tantrum / menangis keras / melempar benda / mogok saat mengalami kesulitan kecil.",
    d2: "Sempat merasa kesal atau frustrasi, namun mampu tenang kembali setelah ditenangkan guru.",
    d3: "Tenang, sabar, gigih mencoba kembali, dan mampu meregulasi emosi diri secara mandiri.",
    foundation: "Fondasi 3 • Kematangan Emosi",
  });
  const so06 = getInd(1, "SO-06", {
    label: "Bermain Kooperatif & Berbagi",
    desc: "Interaksi saat bermain bersama teman, kesediaan berbagi alat mainan/snack, dan dinamika sosial kelompok.",
    d1: "Menolak interaksi sama sekali / merebut alat main teman secara paksa / memukul/mendorong.",
    d2: "Bermain paralel di samping teman atau mau bergantian mainan jika difasilitasi oleh guru.",
    d3: "Aktif berinteraksi positif, kooperatif, berinisiatif mengajak teman bermain, dan senang berbagi.",
    foundation: "Fondasi 2 • Sosial & Bahasa",
  });
  const so07 = getInd(1, "SO-07", {
    label: "Antusiasme & Refleksi Belajar",
    desc: "Menunjukkan rasa ingin tahu positif, keceriaan belajar, dan mampu merefleksikan pengalaman belajarnya.",
    d1: "Sangat tertekan, pasif total, tidak menunjukkan minat, atau menolak seluruh aktivitas.",
    d2: "Mengikuti alur kegiatan dengan baik jika diberikan dorongan semangat sesekali.",
    d3: "Sangat antusias, ceria, aktif bertanya, dan bangga menceritakan kembali pengalamannya.",
    foundation: "Fondasi 6 • Pemaknaan Belajar",
  });
  const redFlagsPos1 = getRedFlags(1, [
    "Tantrum histeris melantai (>10 menit) tanpa respon bujukan",
    "Agresi fisik membahayakan (memukul, menggigit, atau menendang teman/guru)",
    "Perilaku impulsif berbahaya (berlari mendadak keluar area aman sekolah)",
    "Penolakan sosial ekstrem (menolak disapa sama sekali / kontak mata absen total)",
  ]);

  // ─── Pos 2 Indicators (Page 4) ───
  const mk01 = getInd(2, "MK-01", {
    label: "Keseimbangan & Kontrol Tubuh",
    desc: "Berjalan lurus pada garis, meniti papan titian kayu, dan melompat 2 kaki bersamaan secara seimbang.",
    d1: "Menolak melangkah di titian / hilang keseimbangan total (harus dipegangi erat sepanjang titian).",
    d2: "Mampu meniti titian atau melompat dengan bantuan minimal (sentuhan 1 jari / sesekali goyah).",
    d3: "Lincah, seimbang sempurna di titian, dan melompat 2 kaki mandiri dengan percaya diri dan mendarat stabil.",
    foundation: "Fondasi 5 • Motorik & Self-Care",
  });
  const mk02 = getInd(2, "MK-02", {
    label: "Koordinasi Mata-Tangan & Respons Gerak",
    desc: "Merespons instruksi gerak verbal pemandu dan ketangkasan koordinasi tangkap-lempar bola dari jarak 1,5 meter.",
    d1: "Tidak merespons instruksi gerak / luput total menangkap bola (bola selalu jatuh ke lantai).",
    d2: "Respons gerakan agak lambat, berhasil menangkap/melempar bola setelah 1–2 kali percobaan dibimbing.",
    d3: "Respons tanggap dan gesit, menangkap bola 2 tangan secara akurat dan melempar kembali dengan presisi.",
    foundation: "Fondasi 5 • Motorik & Self-Care",
  });
  const redFlagsPos2 = getRedFlags(2, [
    "Tonus otot kaku ekstrem (hipertonia) atau sangat lemas tanpa daya (hipotonia)",
    "Sering terjatuh tanpa hambatan fisik jelas / kehilangan keseimbangan vestibular berat",
    "Ketidakmampuan melompat 2 kaki lepas dari permukaan lantai pada usia > 6 tahun",
  ]);

  // ─── Pos 3 Indicators (Page 5) ───
  const kg01 = getInd(3, "KG-01", {
    label: "Klasifikasi Objek & Pola Berulang",
    desc: "Mengelompokkan benda berdasarkan atribut tertentu (warna/bentuk/fungsi) dan melengkapi pola deret yang teratur.",
    d1: "Belum mampu memilah benda atau melanjutkan pola deret sederhana walaupun telah dicontohkan.",
    d2: "Mampu mengelompokkan 1 atribut atau melengkapi pola deret sederhana (AB-AB) setelah dipandu contoh.",
    d3: "Mandiri dan tepat memilah multi-atribut serta melanjutkan pola deret kompleks (ABC-ABC / AABB).",
    foundation: "Fondasi 4 • Kognitif & Literasi",
  });
  const kg02 = getInd(3, "KG-02", {
    label: "Konsep Kuantitas & Problem Solving",
    desc: "Memahami perbandingan banyak vs sedikit, membilang benda konkret 1–10, dan menyelesaikan tantangan puzzle/balok.",
    d1: "Belum memahami konsep banyak-sedikit / bingung membilang konkret (1–5) / puzzle dibiarkan acak.",
    d2: "Mampu membandingkan kuantitas & menyelesaikan puzzle dasar dengan sedikit petunjuk arahan.",
    d3: "Pemahaman kuantitas kuat, membilang tepat satu-ke-satu, dan solutif merangkai balok/puzzle secara tuntas.",
    foundation: "Fondasi 4 • Kognitif & Literasi",
  });
  const redFlagsPos3 = getRedFlags(3, [
    "Disorientasi spasial berat / tidak mengenal konsep bentuk dan arah dasar sama sekali",
    "Tidak memahami hubungan kausalitas (sebab-akibat) sederhana dalam percakapan sehari-hari",
    "Ketidakmampuan membedakan ukuran kontras (besar vs kecil sekali) secara visual",
  ]);

  // ─── Pos 4 Indicators (Pages 6 & 7) ───
  const bl01 = getInd(4, "BL-01", {
    label: "Menyimak Cerita Lisan (Read-Aloud)",
    desc: "Menyimak cerita lisan yang dibacakan guru dan memahami pesan moral serta alur kejadian sederhana.",
    d1: "Tidak memperhatikan cerita, mudah terdistraksi total / tidak mampu menjawab pertanyaan tentang isi cerita.",
    d2: "Menyimak cerita sebagian, mampu menjawab pertanyaan jika dibantu dengan pertanyaan pemancing.",
    d3: "Menyimak dengan fokus penuh, memahami alur cerita, dan mampu menceritakan kembali intisarinya dengan runtut.",
    foundation: "Fondasi 2 • Sosial & Bahasa",
  });
  const bl02 = getInd(4, "BL-02", {
    label: "Komunikasi Gagasan Lisan",
    desc: "Mengomunikasikan gagasan lisan tentang ide, gambar, atau karyanya dengan kalimat sederhana yang terstruktur.",
    d1: "Menolak berbicara sama sekali / suara sangat lirih tak terdengar / berbicara dengan kata tanpa makna.",
    d2: "Menjawab hanya dengan frasa pendek 1–2 kata, masih butuh dorongan untuk berbicara lebih lanjut.",
    d3: "Berani, lancar, dan percaya diri mengutarakan gagasan dengan struktur kalimat sederhana yang jelas.",
    foundation: "Fondasi 2 • Sosial & Bahasa",
  });
  const bl03 = getInd(4, "BL-03", {
    label: "Kontrol Motorik Halus & Tripod Grasp",
    desc: "Kontrol jemari tangan dan posisi genggaman pensil fungsional (tripod grasp) saat menulis, menarik garis, atau menggambar.",
    d1: "Genggaman tinju penuh (palmar grasp) kaku tanpa kontrol jemari / tidak dapat memegang alat tulis.",
    d2: "Genggaman peralihan (pincer / 4 jari), goresan garis pada kertas masih agak kaku dan bergetar.",
    d3: "Dynamic tripod grasp fungsional mantap (ibu jari, telunjuk, jari tengah), goresan luwes dan terkontrol.",
    foundation: "Fondasi 5 • Motorik & Self-Care",
  });
  const redFlagsPos4 = getRedFlags(4, [
    "Bicara tidak dapat dipahami sama sekali oleh orang dewasa (speech delay berat)",
    "Ekolalia — hanya mengulang kata yang diucapkan guru tanpa makna kontekstual",
    "Tremor jemari tangan ekstrem / otot tangan sangat lemah sehingga pensil selalu terjatuh",
  ]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] font-sans print:bg-white print:text-black py-4 sm:py-6 px-2 sm:px-4">
      {/* ─── EMBEDDED PRINT STYLESHEET (STRICT 7-PAGE A4 LAYOUT) ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 8.5pt !important;
            color: #22352B !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden-toolbar {
            display: none !important;
          }
          .guide-a4-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 275mm !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
          .guide-a4-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      {/* ─── FLOATING ACTION TOOLBAR (SCREEN ONLY) ─── */}
      <aside
        aria-label="Aksi Panduan Cetak"
        className="print-hidden-toolbar sticky top-2 z-50 max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-[#E8E2D8] rounded-2xl shadow-md p-3 mb-6 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/evaluator"
            className="bg-[#FAF8F5] border border-[#DDD7CE] text-[#22352B] hover:bg-[#EFECE4] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <i className="mdi mdi-arrow-left text-base" />
            <span>Portal Evaluator</span>
          </Link>
          <span className="hidden sm:inline-block w-px h-5 bg-[#E8E2D8]" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E5442]" />
            <span className="text-xs font-extrabold text-[#22352B]">
              Buku Panduan &amp; Rubrik Resmi (7 Halaman)
            </span>
            {isSynced && (
              <span className="hidden md:inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                <i className="mdi mdi-check-decagram text-xs" />
                <span>Sinkron admin/configs</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Halaman untuk View Layar */}
          <div className="flex items-center bg-[#FAF8F5] border border-[#E8E2D8] p-1 rounded-xl text-xs gap-1">
            <button
              type="button"
              onClick={() => setActivePageFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                activePageFilter === "all"
                  ? "bg-[#9B3F18] text-white shadow-2xs"
                  : "text-[#565C58] hover:text-[#22352B]"
              }`}
            >
              Semua
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setActivePageFilter(num)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activePageFilter === num
                    ? "bg-[#9B3F18] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B]"
                }`}
              >
                H.{num}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-[#2E6B4D] hover:bg-[#24543D] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <i className="mdi mdi-printer text-base" />
            <span>Cetak A4 (7 Halaman)</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── HALAMAN 1 DARI 7: KETENTUAN UMUM, SKALA, & TIM EVALUATOR ───── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activePageFilter === "all" || activePageFilter === 1) && (
        <section className="guide-a4-page max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-5 sm:p-7 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug flex flex-col justify-between">
          <div className="space-y-3">
            {/* Kop Surat Yayasan & Sekolah */}
            <div className="flex items-start gap-3.5 pb-2.5 border-b border-[#22352B]/20">
              <div className="w-11 h-11 rounded-xl bg-[#9B3F18] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
                <i className="mdi mdi-sprout" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#787F7A] leading-tight">
                  YAYASAN NURUN NAJAH
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight leading-tight">
                  SD Islam An Najah
                </h1>
                <p className="text-[10.5px] sm:text-xs text-[#565C58] mt-0.5 leading-tight">
                  NPSN: <span className="font-mono font-bold">20109914</span> &bull; Jl. SMA 64 RT 008 RW 02, Cipayung, Jakarta Timur, DKI Jakarta 13840
                </p>
                <p className="text-[10px] sm:text-[10.5px] text-[#787F7A] mt-0.5 font-mono leading-tight">
                  Telp: 085864464420 &bull; Email: sdislamannajah.cpy@gmail.com &bull; Web: observasi.sdiannajah.ai.id
                </p>
              </div>
            </div>

            {/* Dokumen Title */}
            <div className="text-center py-0.5 space-y-0.5">
              <span className="inline-block bg-[#E4EFE9] text-[#284034] text-[9.5px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
                DOKUMEN RESMI SPMB &bull; TAHUN AJARAN 2026/2027
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#22352B] tracking-tight leading-tight">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </h2>
              <p className="text-[10px] sm:text-[10.5px] text-[#565C58] font-normal leading-snug max-w-2xl mx-auto">
                Pedoman Standar Evaluator SPMB SD Islam An Najah Berbasis Transisi PAUD–SD Menyenangkan (6 Fondasi Kemendikbudristek) dengan Skala Capaian 3 Tingkat
              </p>
            </div>

            {/* Section I: Ketentuan Umum & Skala Penilaian */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E8E2D8]">
                <span className="w-4.5 h-4.5 rounded-md bg-[#284034] text-white font-black text-[10px] flex items-center justify-center">
                  I
                </span>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-[#22352B]">
                  KETENTUAN UMUM &amp; SKALA PENILAIAN 3 TINGKAT
                </h3>
              </div>

              {/* 3 Skala Capaian - STRICT 3 COLS */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* Skor 1 */}
                <div className="bg-[#FAF5F0] border border-[#F1D8C9] rounded-xl p-2.5 sm:p-3 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-[#9B3F18] text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                      1
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#9B3F18]">
                      SKOR 1
                    </span>
                  </div>
                  <h4 className="font-black text-[10.5px] text-[#9B3F18] leading-tight">
                    PERLU BIMBINGAN (PB)
                  </h4>
                  <p className="text-[9.5px] text-[#565C58] leading-tight">
                    Anak belum menunjukkan indikator yang diharapkan atau membutuhkan bantuan fisik/arahan penuh dari evaluator untuk melakukan aktivitas.
                  </p>
                </div>

                {/* Skor 2 */}
                <div className="bg-[#FAF8F2] border border-[#EDE3D0] rounded-xl p-2.5 sm:p-3 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-[#8A641A] text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                      2
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#8A641A]">
                      SKOR 2
                    </span>
                  </div>
                  <h4 className="font-black text-[10.5px] text-[#8A641A] leading-tight">
                    BERKEMBANG SESUAI HARAPAN (BSH)
                  </h4>
                  <p className="text-[9.5px] text-[#565C58] leading-tight">
                    Anak mampu menampilkan perilaku/tugas dengan bantuan minimal, petunjuk arahan verbal sesekali, atau pembiasaan bertahap.
                  </p>
                </div>

                {/* Skor 3 */}
                <div className="bg-[#F4F8F5] border border-[#D5E5DB] rounded-xl p-2.5 sm:p-3 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-[#2E6B4D] text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                      3
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#2E6B4D]">
                      SKOR 3
                    </span>
                  </div>
                  <h4 className="font-black text-[10.5px] text-[#2E6B4D] leading-tight">
                    MANDIRI (M)
                  </h4>
                  <p className="text-[9.5px] text-[#565C58] leading-tight">
                    Anak mampu menampilkan perilaku secara konsisten, spontan, percaya diri, dan mandiri tanpa memerlukan bantuan evaluator.
                  </p>
                </div>
              </div>

              {/* Box Red Flag */}
              <div className="border border-[#F2C9B8] bg-[#FAF5F2] rounded-xl p-2 sm:p-2.5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[#9B3F18] font-black text-[10.5px]">
                  <i className="mdi mdi-alert-outline text-sm" />
                  <span>Pedoman Catatan Anekdot &amp; Indikator Peringatan Khusus (Red Flag)</span>
                </div>
                <p className="text-[9.5px] text-[#565C58] leading-tight">
                  Red Flag bukan vonis ketidaklulusan, melainkan tanda peringatan dini perilaku/fisik yang memerlukan penanganan khusus (individual education plan/IEP), konfirmasi orang tua, atau rujukan psikolog/terapis anak. Evaluator wajib mendokumentasikan konteks pemicu pada kolom Catatan Anekdot Lapangan.
                </p>
              </div>
            </div>

            {/* Section II: Tim Evaluator SPMB Resmi */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E8E2D8]">
                <span className="w-4.5 h-4.5 rounded-md bg-[#284034] text-white font-black text-[10px] flex items-center justify-center">
                  II
                </span>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-[#22352B]">
                  TIM EVALUATOR SPMB RESMI &amp; STRUKTUR PENUGASAN
                </h3>
              </div>

              {/* Tabel Tim Evaluator */}
              <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead className="bg-[#2E5442] text-white font-black uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-2.5 w-10 text-center">Pos</th>
                      <th className="py-2 px-2.5 w-1/4">Ruang &amp; Domain Observasi</th>
                      <th className="py-2 px-2.5 w-1/3">Petugas Evaluator</th>
                      <th className="py-2 px-2.5">Karakteristik &amp; Model Penugasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8] text-[9.5px] sm:text-[10px] leading-tight">
                    <tr className="hover:bg-[#FAF8F5]">
                      <td className="py-1.5 px-2.5 font-black text-center text-[#9B3F18]">1</td>
                      <td className="py-1.5 px-2.5 font-bold text-[#22352B]">
                        Kemandirian, Regulasi Emosi &amp; Kepatuhan
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        Ahmad Furqoni, S. Pd (SO 1)<br />
                        Novia Permatasari, S. Pd (SO 2)
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        <strong className="text-[#22352B]">Super Observer Longitudinal:</strong> mengawal kedatangan, transisi 3 pos, hingga snack &amp; bermain bebas.
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF8F5]">
                      <td className="py-1.5 px-2.5 font-black text-center text-[#9B3F18]">2</td>
                      <td className="py-1.5 px-2.5 font-bold text-[#22352B]">
                        Pos A: Motorik Kasar &amp; Koordinasi Fisik
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        Rifky Delsandi Rifai, S. Pd
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        <strong className="text-[#22352B]">Penguji Motorik Ruangan + Escort:</strong> jemput Kel. 1 di awal, serah-terima di pintu Pos A, dan antar Kel. 3 ke titik akhir.
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF8F5]">
                      <td className="py-1.5 px-2.5 font-black text-center text-[#9B3F18]">3</td>
                      <td className="py-1.5 px-2.5 font-bold text-[#22352B]">
                        Pos B: Kematangan Kognitif &amp; Berhitung
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        Shalma Ruhail Maldova, S. Pd
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        <strong className="text-[#22352B]">Stasioner Ruangan (12 menit/kelompok):</strong> pola, klasifikasi objek, kuantitas &amp; balok problem solving.
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF8F5]">
                      <td className="py-1.5 px-2.5 font-black text-center text-[#9B3F18]">4</td>
                      <td className="py-1.5 px-2.5 font-bold text-[#22352B]">
                        Pos C: Bahasa Lisan &amp; Motorik Halus
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        Susmurtiningsih, S. Pd
                      </td>
                      <td className="py-1.5 px-2.5 text-[#565C58]">
                        <strong className="text-[#22352B]">Stasioner Ruangan (12 menit/kelompok):</strong> read-aloud menyimak cerita, ide verbal, tripod grasp, &amp; tingkat literasi L1–L4.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Halaman 1 */}
          <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-[10px] text-[#787F7A] mt-3">
            <span>Dokumen Resmi SPMB &bull; T.A. 2026/2027 &bull; Dicetak 5 November 2026</span>
            <span className="font-bold text-[#22352B]">Halaman 1 dari 7</span>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── HALAMAN 2 DARI 7: POS 1 (SUPER OBSERVER) - BAGIAN 1 ────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activePageFilter === "all" || activePageFilter === 2) && (
        <section className="guide-a4-page max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Header Halaman Berulang */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#9B3F18] text-white flex items-center justify-center text-xs shadow-2xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <span className="font-bold text-xs text-[#22352B]">
                  kalamula <span className="text-[#787F7A] font-normal">&bull; SD Islam An Najah</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#787F7A]">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </span>
            </div>

            {/* Section III Header */}
            <div className="flex items-center gap-2 pb-1 border-b border-[#E8E2D8]">
              <span className="w-5 h-5 rounded-md bg-[#284034] text-white font-black text-xs flex items-center justify-center">
                III
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                MATRIKS RUBRIK DESKRIPTOR LENGKAP PER POS
              </h3>
            </div>

            {/* Subheader Box Pos 1 */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#E8E2D8]">
                <span className="font-black text-xs text-[#9B3F18] uppercase tracking-wide">
                  SO &bull; SUPER OBSERVER
                </span>
                <span className="text-[11px] font-bold text-[#486B5A]">
                  Durasi: Sepanjang Sesi Observasi (08.00 – 09.00)
                </span>
              </div>
              <h4 className="text-base font-black text-[#22352B] leading-tight">
                Pos Kemandirian, Regulasi Emosi &amp; Kepatuhan Instruksi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#565C58]">
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">PETUGAS</span>
                  <span>Ahmad Furqoni, S. Pd (SO 1) &amp; Novia Permatasari, S. Pd (SO 2)</span>
                </div>
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">MODEL TUGAS</span>
                  <span>Pengamat Longitudinal (Mengikuti Rotasi Siswa)</span>
                </div>
              </div>
              <p className="text-[11px] text-[#565C58] pt-1 border-t border-[#E8E2D8]/60 leading-snug">
                <strong>Fokus Domain:</strong> Kemandirian berpisah dari orang tua, adab sepatu/tas, ketertiban transisi antar-pos, regulasi diri saat kesulitan, berbagi alat main, dan interaksi sosial saat snack &amp; bermain bebas.
              </p>
            </div>

            {/* SOP & Alur Teknis */}
            <div className="bg-[#F4F8F5] border border-[#D5E5DB] rounded-xl p-3 space-y-1.5 text-xs text-[#22352B]">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#284034] uppercase tracking-wide">
                <i className="mdi mdi-clipboard-text-outline text-sm" />
                <span>SOP &amp; ALUR TEKNIS EVALUATOR DI LAPANGAN</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#565C58] leading-snug">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p>SO 1 mendampingi Kelompok 2 dari Titik Awal (kedatangan, adab sepatu) menuju Pos Bahasa. Pada pukul 08.24, berpindah ke pintu Pos Motorik Kasar untuk menyambut Kelompok 1 dan mendampingi hingga Pos Kognitif, Bahasa, dan Titik Akhir.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p>SO 2 mendampingi Kelompok 3 dari Titik Awal menuju Pos Kognitif. Pada pukul 08.36, berpindah ke pintu Pos Motorik Kasar untuk menyambut Kelompok 2 dan mendampingi hingga Titik Akhir.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p>Observasi dilakukan secara wajar tanpa mengintervensi berlebihan. Catat kejadian spesifik pada catatan anekdot.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p>Jika anak mengalami kecemasan perpisahan, berikan waktu adaptasi maksimal 5–10 menit sebelum mencatat skor final.</p>
                </div>
              </div>
            </div>

            {/* Rubrik Tabel: SO-01 & SO-02 */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E4EFE9] text-[#284034] font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-[34%]">Kode &amp; Indikator dan Fondasi PAUD-SD</th>
                    <th className="py-2 px-3 w-[22%]">Perlu Bimbingan<br /><span className="text-[#9B3F18]">Skor 1</span></th>
                    <th className="py-2 px-3 w-[22%]">Berkembang Sesuai Harapan<br /><span className="text-[#8A641A]">Skor 2</span></th>
                    <th className="py-2 px-3 w-[22%]">Mandiri<br /><span className="text-[#2E6B4D]">Skor 3</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[11px] leading-snug">
                  {/* SO-01 */}
                  <tr>
                    <td className="py-3 px-3 align-top space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10.5px]">SO-01</span>
                        <span className="text-[9.5px] font-bold text-[#486B5A]">{so01.foundation || "Fondasi 3 • Kematangan Emosi"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{so01.label}</p>
                      <p className="text-[10px] text-[#787F7A] leading-tight">
                        {so01.desc}
                      </p>
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {so01.d1}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {so01.d2}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {so01.d3}
                    </td>
                  </tr>

                  {/* SO-02 */}
                  <tr>
                    <td className="py-3 px-3 align-top space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10.5px]">SO-02</span>
                        <span className="text-[9.5px] font-bold text-[#486B5A]">{so02.foundation || "Fondasi 5 • Motorik & Self-Care"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{so02.label}</p>
                      <p className="text-[10px] text-[#787F7A] leading-tight">
                        {so02.desc}
                      </p>
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {so02.d1}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {so02.d2}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {so02.d3}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Halaman 2 */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A] mt-4">
            <span>Dokumen Resmi SPMB &bull; T.A. 2026/2027 &bull; Dicetak 5 November 2026</span>
            <span className="font-bold text-[#22352B]">Halaman 2 dari 7</span>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── HALAMAN 3 DARI 7: POS 1 (SUPER OBSERVER) - BAGIAN 2 ────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activePageFilter === "all" || activePageFilter === 3) && (
        <section className="guide-a4-page max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug flex flex-col justify-between">
          <div className="space-y-3">
            {/* Header Halaman Berulang */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#9B3F18] text-white flex items-center justify-center text-xs shadow-2xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <span className="font-bold text-xs text-[#22352B]">
                  kalamula <span className="text-[#787F7A] font-normal">&bull; SD Islam An Najah</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#787F7A]">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </span>
            </div>

            {/* Rubrik Tabel: SO-03 s.d. SO-07 */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E4EFE9] text-[#284034] font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-[34%]">Kode &amp; Indikator dan Fondasi PAUD-SD</th>
                    <th className="py-2 px-3 w-[22%]">Perlu Bimbingan<br /><span className="text-[#9B3F18]">Skor 1</span></th>
                    <th className="py-2 px-3 w-[22%]">Berkembang Sesuai Harapan<br /><span className="text-[#8A641A]">Skor 2</span></th>
                    <th className="py-2 px-3 w-[22%]">Mandiri<br /><span className="text-[#2E6B4D]">Skor 3</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[10.5px] leading-snug">
                  {/* SO-03 */}
                  <tr>
                    <td className="py-2 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">SO-03</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{so03.foundation || "Fondasi 2 • Sosial & Bahasa"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{so03.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {so03.desc}
                      </p>
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so03.d1}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so03.d2}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so03.d3}
                    </td>
                  </tr>

                  {/* SO-04 */}
                  <tr>
                    <td className="py-2 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">SO-04</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{so04.foundation || "Fondasi 1 • Agama & Budi Pekerti"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{so04.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {so04.desc}
                      </p>
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so04.d1}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so04.d2}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so04.d3}
                    </td>
                  </tr>

                  {/* SO-05 */}
                  <tr>
                    <td className="py-2 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">SO-05</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{so05.foundation || "Fondasi 3 • Kematangan Emosi"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{so05.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {so05.desc}
                      </p>
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so05.d1}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so05.d2}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so05.d3}
                    </td>
                  </tr>

                  {/* SO-06 */}
                  <tr>
                    <td className="py-2 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">SO-06</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{so06.foundation || "Fondasi 2 • Sosial & Bahasa"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{so06.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {so06.desc}
                      </p>
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so06.d1}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so06.d2}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so06.d3}
                    </td>
                  </tr>

                  {/* SO-07 */}
                  <tr>
                    <td className="py-2 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">SO-07</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{so07.foundation || "Fondasi 6 • Pemaknaan Belajar"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{so07.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {so07.desc}
                      </p>
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so07.d1}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so07.d2}
                    </td>
                    <td className="py-2 px-3 align-top text-[#565C58]">
                      {so07.d3}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Red Flag Pos 1 */}
            <div className="border border-[#F2C9B8] bg-[#FAF5F2] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[#9B3F18] font-black text-xs uppercase tracking-wider">
                <i className="mdi mdi-alert-outline text-base" />
                <span>INDIKATOR PERHATIAN KHUSUS (RED FLAG) POS 1</span>
              </div>
              <ul className="space-y-0.5 text-[11px] text-[#565C58] pl-2">
                {redFlagsPos1.map((rf: string, idx: number) => (
                  <li key={idx}>&bull; {rf}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Halaman 3 */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A] mt-4">
            <span>Dokumen Resmi SPMB &bull; T.A. 2026/2027 &bull; Dicetak 5 November 2026</span>
            <span className="font-bold text-[#22352B]">Halaman 3 dari 7</span>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── HALAMAN 4 DARI 7: POS A (MOTORIK KASAR + ESCORT) ───────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activePageFilter === "all" || activePageFilter === 4) && (
        <section className="guide-a4-page max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Header Halaman Berulang */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#9B3F18] text-white flex items-center justify-center text-xs shadow-2xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <span className="font-bold text-xs text-[#22352B]">
                  kalamula <span className="text-[#787F7A] font-normal">&bull; SD Islam An Najah</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#787F7A]">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </span>
            </div>

            {/* Subheader Box Pos 2 */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#E8E2D8]">
                <span className="font-black text-xs text-[#9B3F18] uppercase tracking-wide">
                  POS A &bull; MOTORIK KASAR + ESCORT
                </span>
                <span className="text-[11px] font-bold text-[#486B5A]">
                  Durasi: 12 Menit per Rotasi Kelompok
                </span>
              </div>
              <h4 className="text-base font-black text-[#22352B] leading-tight">
                Pos Motorik Kasar &amp; Koordinasi Fisik
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#565C58]">
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">PETUGAS</span>
                  <span>Rifky Delsandi Rifai, S. Pd</span>
                </div>
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">MODEL TUGAS</span>
                  <span>Penguji Ruangan + Penjemput Rotasi Kelompok</span>
                </div>
              </div>
              <p className="text-[11px] text-[#565C58] pt-1 border-t border-[#E8E2D8]/60 leading-snug">
                <strong>Fokus Domain:</strong> Keseimbangan statis &amp; dinamis, kontrol tubuh saat meniti papan titian, lompat 2 kaki bersamaan, ketangkasan tangkap-lempar bola, dan mobilitas fisik.
              </p>
            </div>

            {/* SOP & Alur Teknis Pos 2 */}
            <div className="bg-[#F4F8F5] border border-[#D5E5DB] rounded-xl p-3 space-y-1.5 text-xs text-[#22352B]">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#284034] uppercase tracking-wide">
                <i className="mdi mdi-clipboard-text-outline text-sm" />
                <span>SOP &amp; ALUR TEKNIS EVALUATOR DI LAPANGAN</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#565C58] leading-snug">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p><strong>Pukul 08.00:</strong> Hadir di titik awal kedatangan saat pembagian name tag. Jemput Kelompok 1 dan bawa ke Pos Motorik Kasar.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p><strong>Pukul 08.12 – 08.24:</strong> Lakukan pengujian motorik Kelompok 1 di ruang Pos Motorik.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p><strong>Pukul 08.24:</strong> Di pintu Pos A, serahkan Kelompok 1 ke SO 1 (Ahmad Furqoni), lalu sambut &amp; terima Kelompok 2 dari SO 1 untuk diuji di Pos Motorik.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p><strong>Pukul 08.36:</strong> Di pintu Pos A, serahkan Kelompok 2 ke SO 2 (Novia Permatasari). Segera menuju Pos Bahasa untuk menjemput Kelompok 3 dan membawanya ke Pos Motorik.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
                  <p><strong>Pukul 08.48:</strong> Selesai menguji Kelompok 3, antar langsung Kelompok 3 ke Area Bermain &amp; Snack di Titik Akhir.</p>
                </div>
              </div>
            </div>

            {/* Rubrik Tabel: MK-01 & MK-02 */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E4EFE9] text-[#284034] font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-[34%]">Kode &amp; Indikator dan Fondasi PAUD-SD</th>
                    <th className="py-2 px-3 w-[22%]">Perlu Bimbingan<br /><span className="text-[#9B3F18]">Skor 1</span></th>
                    <th className="py-2 px-3 w-[22%]">Berkembang Sesuai Harapan<br /><span className="text-[#8A641A]">Skor 2</span></th>
                    <th className="py-2 px-3 w-[22%]">Mandiri<br /><span className="text-[#2E6B4D]">Skor 3</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[11px] leading-snug">
                  {/* MK-01 */}
                  <tr>
                    <td className="py-3 px-3 align-top space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10.5px]">MK-01</span>
                        <span className="text-[9.5px] font-bold text-[#486B5A]">{mk01.foundation || "Fondasi 5 • Motorik & Self-Care"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{mk01.label}</p>
                      <p className="text-[10px] text-[#787F7A] leading-tight">
                        {mk01.desc}
                      </p>
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {mk01.d1}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {mk01.d2}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {mk01.d3}
                    </td>
                  </tr>

                  {/* MK-02 */}
                  <tr>
                    <td className="py-3 px-3 align-top space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10.5px]">MK-02</span>
                        <span className="text-[9.5px] font-bold text-[#486B5A]">{mk02.foundation || "Fondasi 5 • Motorik & Self-Care"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{mk02.label}</p>
                      <p className="text-[10px] text-[#787F7A] leading-tight">
                        {mk02.desc}
                      </p>
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {mk02.d1}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {mk02.d2}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {mk02.d3}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Red Flag Pos 2 */}
            <div className="border border-[#F2C9B8] bg-[#FAF5F2] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[#9B3F18] font-black text-xs uppercase tracking-wider">
                <i className="mdi mdi-alert-outline text-base" />
                <span>INDIKATOR PERHATIAN KHUSUS (RED FLAG) POS 2</span>
              </div>
              <ul className="space-y-0.5 text-[11px] text-[#565C58] pl-2">
                {redFlagsPos2.map((rf: string, idx: number) => (
                  <li key={idx}>&bull; {rf}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Halaman 4 */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A] mt-4">
            <span>Dokumen Resmi SPMB &bull; T.A. 2026/2027 &bull; Dicetak 5 November 2026</span>
            <span className="font-bold text-[#22352B]">Halaman 4 dari 7</span>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── HALAMAN 5 DARI 7: POS B (KEMATANGAN KOGNITIF) ───────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activePageFilter === "all" || activePageFilter === 5) && (
        <section className="guide-a4-page max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Header Halaman Berulang */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#9B3F18] text-white flex items-center justify-center text-xs shadow-2xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <span className="font-bold text-xs text-[#22352B]">
                  kalamula <span className="text-[#787F7A] font-normal">&bull; SD Islam An Najah</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#787F7A]">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </span>
            </div>

            {/* Subheader Box Pos 3 */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#E8E2D8]">
                <span className="font-black text-xs text-[#9B3F18] uppercase tracking-wide">
                  POS B &bull; KEMATANGAN KOGNITIF
                </span>
                <span className="text-[11px] font-bold text-[#486B5A]">
                  Durasi: 12 Menit per Rotasi Kelompok
                </span>
              </div>
              <h4 className="text-base font-black text-[#22352B] leading-tight">
                Pos Kematangan Kognitif &amp; Berhitung
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#565C58]">
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">PETUGAS</span>
                  <span>Shalma Ruhail Maldova, S. Pd</span>
                </div>
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">MODEL TUGAS</span>
                  <span>Penguji Stasioner (Tetap di Dalam Ruangan)</span>
                </div>
              </div>
              <p className="text-[11px] text-[#565C58] pt-1 border-t border-[#E8E2D8]/60 leading-snug">
                <strong>Fokus Domain:</strong> Kemampuan berpikir logis, klasifikasi objek berdasarkan atribut warna/bentuk/ukuran, kelanjutan pola deret berulang (AB-AB / ABC-ABC), konsep kuantitas konkrit (banyak-sedikit, membilang 1–10), dan pemecahan masalah puzzle/balok.
              </p>
            </div>

            {/* SOP & Alur Teknis Pos 3 */}
            <div className="bg-[#F4F8F5] border border-[#D5E5DB] rounded-xl p-3 space-y-1.5 text-xs text-[#22352B]">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#284034] uppercase tracking-wide">
                <i className="mdi mdi-clipboard-text-outline text-sm" />
                <span>SOP &amp; ALUR TEKNIS EVALUATOR DI LAPANGAN</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#565C58] leading-snug">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p>Evaluator tetap berada di dalam ruangan Pos Kognitif. Siswa akan diantar dan dijemput oleh pemandu rotasi.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p>Siapkan media konkrit: balok warna-warni, kancing/kartu klasifikasi, puzzle 9–12 keping, dan alat peraga pola deret.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p>Mulai dengan apersepsi ramah dan suasana bermain yang santai.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p>Beri waktu 2–3 menit per anak untuk mengeksplorasi alat permainan sebelum meminta menyelesaikan pola/tugas kognitif.</p>
                </div>
              </div>
            </div>

            {/* Rubrik Tabel: KG-01 & KG-02 */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E4EFE9] text-[#284034] font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-[34%]">Kode &amp; Indikator dan Fondasi PAUD-SD</th>
                    <th className="py-2 px-3 w-[22%]">Perlu Bimbingan<br /><span className="text-[#9B3F18]">Skor 1</span></th>
                    <th className="py-2 px-3 w-[22%]">Berkembang Sesuai Harapan<br /><span className="text-[#8A641A]">Skor 2</span></th>
                    <th className="py-2 px-3 w-[22%]">Mandiri<br /><span className="text-[#2E6B4D]">Skor 3</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[11px] leading-snug">
                  {/* KG-01 */}
                  <tr>
                    <td className="py-3 px-3 align-top space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10.5px]">KG-01</span>
                        <span className="text-[9.5px] font-bold text-[#486B5A]">{kg01.foundation || "Fondasi 4 • Kognitif & Literasi"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{kg01.label}</p>
                      <p className="text-[10px] text-[#787F7A] leading-tight">
                        {kg01.desc}
                      </p>
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {kg01.d1}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {kg01.d2}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {kg01.d3}
                    </td>
                  </tr>

                  {/* KG-02 */}
                  <tr>
                    <td className="py-3 px-3 align-top space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10.5px]">KG-02</span>
                        <span className="text-[9.5px] font-bold text-[#486B5A]">{kg02.foundation || "Fondasi 4 • Kognitif & Literasi"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{kg02.label}</p>
                      <p className="text-[10px] text-[#787F7A] leading-tight">
                        {kg02.desc}
                      </p>
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {kg02.d1}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {kg02.d2}
                    </td>
                    <td className="py-3 px-3 align-top text-[#565C58]">
                      {kg02.d3}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Red Flag Pos 3 */}
            <div className="border border-[#F2C9B8] bg-[#FAF5F2] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[#9B3F18] font-black text-xs uppercase tracking-wider">
                <i className="mdi mdi-alert-outline text-base" />
                <span>INDIKATOR PERHATIAN KHUSUS (RED FLAG) POS 3</span>
              </div>
              <ul className="space-y-0.5 text-[11px] text-[#565C58] pl-2">
                {redFlagsPos3.map((rf: string, idx: number) => (
                  <li key={idx}>&bull; {rf}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Halaman 5 */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A] mt-4">
            <span>Dokumen Resmi SPMB &bull; T.A. 2026/2027 &bull; Dicetak 5 November 2026</span>
            <span className="font-bold text-[#22352B]">Halaman 5 dari 7</span>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── HALAMAN 6 DARI 7: POS C (BAHASA & PRA-LITERASI) ─────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activePageFilter === "all" || activePageFilter === 6) && (
        <section className="guide-a4-page max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Header Halaman Berulang */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#9B3F18] text-white flex items-center justify-center text-xs shadow-2xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <span className="font-bold text-xs text-[#22352B]">
                  kalamula <span className="text-[#787F7A] font-normal">&bull; SD Islam An Najah</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#787F7A]">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </span>
            </div>

            {/* Subheader Box Pos 4 */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#E8E2D8]">
                <span className="font-black text-xs text-[#9B3F18] uppercase tracking-wide">
                  POS C &bull; BAHASA &amp; PRA-LITERASI
                </span>
                <span className="text-[11px] font-bold text-[#486B5A]">
                  Durasi: 12 Menit per Rotasi Kelompok
                </span>
              </div>
              <h4 className="text-base font-black text-[#22352B] leading-tight">
                Pos Bahasa Lisan, Pra-Literasi &amp; Motorik Halus
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#565C58]">
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">PETUGAS</span>
                  <span>Susmurtiningsih, S. Pd</span>
                </div>
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">MODEL TUGAS</span>
                  <span>Penguji Stasioner (Tetap di Dalam Ruangan)</span>
                </div>
              </div>
              <p className="text-[11px] text-[#565C58] pt-1 border-t border-[#E8E2D8]/60 leading-snug">
                <strong>Fokus Domain:</strong> Kemampuan menyimak cerita lisan (read-aloud), menjawab pertanyaan pemahaman alur, keberanian komunikasi verbal mengutarakan ide, kontrol pensil dan genggaman jemari (tripod grasp), serta pemetaan 4 tingkat literasi membaca.
              </p>
            </div>

            {/* SOP & Alur Teknis Pos 4 */}
            <div className="bg-[#F4F8F5] border border-[#D5E5DB] rounded-xl p-3 space-y-1.5 text-xs text-[#22352B]">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#284034] uppercase tracking-wide">
                <i className="mdi mdi-clipboard-text-outline text-sm" />
                <span>SOP &amp; ALUR TEKNIS EVALUATOR DI LAPANGAN</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#565C58] leading-snug">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p>Evaluator tetap berada di dalam ruangan Pos Bahasa &amp; Halus. Siswa akan diantar dan dijemput oleh pemandu rotasi.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p>Sesi dimulai dengan membacakan buku cerita bergambar pendek (read-aloud) selama 3–4 menit dengan intonasi menarik.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p>Ajukan 2–3 pertanyaan terbuka mengenai karakter dan alur cerita untuk menguji pemahaman menyimak.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p>Berikan lembar gambar dan pensil segitiga untuk mengamati posisi genggaman pensil (dynamic tripod grasp vs palmar grasp).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
                  <p>Petakan level membaca anak ke salah satu dari 4 Tingkat Literasi (L1, L2, L3, L4).</p>
                </div>
              </div>
            </div>

            {/* Rubrik Tabel: BL-01, BL-02, BL-03 */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#E4EFE9] text-[#284034] font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-[34%]">Kode &amp; Indikator dan Fondasi PAUD-SD</th>
                    <th className="py-2 px-3 w-[22%]">Perlu Bimbingan<br /><span className="text-[#9B3F18]">Skor 1</span></th>
                    <th className="py-2 px-3 w-[22%]">Berkembang Sesuai Harapan<br /><span className="text-[#8A641A]">Skor 2</span></th>
                    <th className="py-2 px-3 w-[22%]">Mandiri<br /><span className="text-[#2E6B4D]">Skor 3</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[10.5px] leading-snug">
                  {/* BL-01 */}
                  <tr>
                    <td className="py-2.5 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">BL-01</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{bl01.foundation || "Fondasi 2 • Sosial & Bahasa"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{bl01.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {bl01.desc}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl01.d1}
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl01.d2}
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl01.d3}
                    </td>
                  </tr>

                  {/* BL-02 */}
                  <tr>
                    <td className="py-2.5 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">BL-02</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{bl02.foundation || "Fondasi 2 • Sosial & Bahasa"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{bl02.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {bl02.desc}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl02.d1}
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl02.d2}
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl02.d3}
                    </td>
                  </tr>

                  {/* BL-03 */}
                  <tr>
                    <td className="py-2.5 px-3 align-top space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#9B3F18] text-[10px]">BL-03</span>
                        <span className="text-[9px] font-bold text-[#486B5A]">{bl03.foundation || "Fondasi 5 • Motorik & Self-Care"}</span>
                      </div>
                      <p className="font-bold text-[#22352B]">{bl03.label}</p>
                      <p className="text-[9.5px] text-[#787F7A] leading-tight">
                        {bl03.desc}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl03.d1}
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl03.d2}
                    </td>
                    <td className="py-2.5 px-3 align-top text-[#565C58]">
                      {bl03.d3}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Halaman 6 */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A] mt-4">
            <span>Dokumen Resmi SPMB &bull; T.A. 2026/2027 &bull; Dicetak 5 November 2026</span>
            <span className="font-bold text-[#22352B]">Halaman 6 dari 7</span>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── HALAMAN 7 DARI 7: 4 TINGKAT LITERASI, RED FLAG, & PENGESAHAN ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activePageFilter === "all" || activePageFilter === 7) && (
        <section className="guide-a4-page max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header Halaman Berulang */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#9B3F18] text-white flex items-center justify-center text-xs shadow-2xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <span className="font-bold text-xs text-[#22352B]">
                  kalamula <span className="text-[#787F7A] font-normal">&bull; SD Islam An Najah</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#787F7A]">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </span>
            </div>

            {/* Rubrik 4 Tingkat Literasi Membaca Awal */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[#E8E2D8]">
                <i className="mdi mdi-book-open-outline text-base text-[#22352B]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                  RUBRIK 4 TINGKAT LITERASI MEMBACA AWAL (READING LEVEL)
                </h3>
              </div>

              {/* Grid 2x2 Literasi */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* L1 */}
                <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    L1
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-[#22352B] leading-tight">
                      Tingkat 1: Gambar &amp; Simbol Visual
                    </h4>
                    <p className="text-[11px] text-[#565C58] leading-snug">
                      Mampu memaknai gambar konkret dan simbol visual benda sehari-hari, belum mengenal bunyi huruf fonik.
                    </p>
                  </div>
                </div>

                {/* L2 */}
                <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    L2
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-[#22352B] leading-tight">
                      Tingkat 2: Huruf &amp; Bunyi Fonik
                    </h4>
                    <p className="text-[11px] text-[#565C58] leading-snug">
                      Mengenal bentuk huruf kapital/kecil serta bunyi vokal dan konsonan dasar (a-i-u-e-o, b, m, p, s).
                    </p>
                  </div>
                </div>

                {/* L3 */}
                <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    L3
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-[#22352B] leading-tight">
                      Tingkat 3: Membaca Suku Kata
                    </h4>
                    <p className="text-[11px] text-[#565C58] leading-snug">
                      Mampu menggabungkan huruf menjadi suku kata terbuka sederhana (ba-ba, bu-ku, bo-la, ma-ma).
                    </p>
                  </div>
                </div>

                {/* L4 */}
                <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    L4
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-[#22352B] leading-tight">
                      Tingkat 4: Membaca Kalimat Lancar
                    </h4>
                    <p className="text-[11px] text-[#565C58] leading-snug">
                      Mampu membaca kalimat pendek secara lancar dan memahami maksud bacaan tanpa mengeja per huruf.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Red Flag Pos 4 */}
            <div className="border border-[#F2C9B8] bg-[#FAF5F2] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[#9B3F18] font-black text-xs uppercase tracking-wider">
                <i className="mdi mdi-alert-outline text-base" />
                <span>INDIKATOR PERHATIAN KHUSUS (RED FLAG) POS 4</span>
              </div>
              <ul className="space-y-0.5 text-[11px] text-[#565C58] pl-2">
                {redFlagsPos4.map((rf: string, idx: number) => (
                  <li key={idx}>&bull; {rf}</li>
                ))}
              </ul>
            </div>

            {/* Pengesahan Tanda Tangan */}
            <div className="pt-2 space-y-2">
              <p className="text-right text-xs text-[#565C58] font-medium pr-4">
                Jakarta Timur, 5 November 2026
              </p>
              <div className="grid grid-cols-2 text-center text-xs pt-2">
                <div>
                  <p className="text-xs font-semibold text-[#565C58]">Koordinator Tim Evaluator SPMB,</p>
                  <div className="h-14" />
                  <div className="w-56 border-b border-[#22352B] mx-auto mb-1.5" />
                  <p className="font-bold text-xs text-[#22352B]">Ahmad Furqoni, S. Pd</p>
                  <p className="text-[11px] text-[#787F7A]">Super Observer 1 &bull; SD Islam An Najah</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#565C58]">
                    Mengetahui,<br />Kepala SD Islam An Najah,
                  </p>
                  <div className="h-10" />
                  <div className="w-56 border-b border-[#22352B] mx-auto mb-1.5" />
                  <p className="font-bold text-xs text-[#22352B]">Wida Mawaddah, S. Pd., Gr.</p>
                  <p className="text-[11px] text-[#787F7A]">NIP: -</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Halaman 7 */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A] mt-4">
            <span>Dokumen Resmi SPMB &bull; T.A. 2026/2027 &bull; Dicetak 5 November 2026</span>
            <span className="font-bold text-[#22352B]">Halaman 7 dari 7</span>
          </div>
        </section>
      )}
    </div>
  );
}