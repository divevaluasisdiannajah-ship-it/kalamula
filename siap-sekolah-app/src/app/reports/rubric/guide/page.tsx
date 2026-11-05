"use client";
export const runtime = 'edge';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { DEFAULT_SCHOOL_PROFILE, DEFAULT_TEACHERS } from "@/lib/school-store";
import type { SchoolProfile, TeacherStaff, FoundationNumber } from "@/types";
import { FOUNDATION_LABELS } from "@/types";

interface RubricIndicator {
  id: string;
  label: string;
  description: string;
  foundation?: FoundationNumber;
  score_descriptors: Record<string, string>;
}

interface PosGuideData {
  pos_number: number;
  pos_name: string;
  pos_code: string;
  evaluators: string;
  role_type: string;
  duration: string;
  focus: string;
  instructions: string[];
  indicators: RubricIndicator[];
  red_flags: { id: string; label: string; severity?: string }[];
  reading_levels?: { level: string; name: string; desc: string }[];
}

const COMPLETE_POS_GUIDE: Record<number, PosGuideData> = {
  1: {
    pos_number: 1,
    pos_name: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
    pos_code: "SO (SUPER OBSERVER)",
    evaluators: "Ahmad Furqoni, S. Pd (SO 1) & Novia Permatasari, S. Pd (SO 2)",
    role_type: "Pengamat Longitudinal (Mengikuti Rotasi Siswa)",
    duration: "Sepanjang Sesi Observasi (08.00 - 09.00)",
    focus: "Kemandirian berpisah dari orang tua, adab sepatu/tas, ketertiban transisi antar-pos, regulasi diri saat kesulitan, berbagi alat main, dan interaksi sosial saat snack & bermain bebas.",
    instructions: [
      "SO 1 mendampingi Kelompok 2 dari Titik Awal (kedatangan, adab sepatu) menuju Pos Bahasa. Pada pukul 08.24, berpindah ke pintu Pos Motorik Kasar untuk menyambut Kelompok 1 dan mendampingi hingga Pos Kognitif, Bahasa, dan Titik Akhir.",
      "SO 2 mendampingi Kelompok 3 dari Titik Awal menuju Pos Kognitif. Pada pukul 08.36, berpindah ke pintu Pos Motorik Kasar untuk menyambut Kelompok 2 dan mendampingi hingga Titik Akhir.",
      "Observasi dilakukan secara wajar tanpa mengintervensi berlebihan. Catat kejadian spesifik pada catatan anekdot.",
      "Jika anak mengalami kecemasan perpisahan, berikan waktu adaptasi maksimal 5-10 menit sebelum mencatat skor final."
    ],
    indicators: [
      {
        id: "SO-01",
        label: "Berpisah dari Orang Tua",
        description: "Berpisah dari orang tua dengan tenang tanpa kecemasan berlebihan saat memasuki gerbang/titik awal observasi.",
        foundation: 3,
        score_descriptors: {
          "1": "Menangis histeris / menolak keras ditinggal / harus didampingi orang tua masuk ruangan.",
          "2": "Sempat cemas/menangis sesaat, namun mau berpisah dan masuk setelah dibujuk pengamat.",
          "3": "Berpisah dengan tenang, ceria, mandiri, dan langsung antusias menyapa guru pendamping.",
        },
      },
      {
        id: "SO-02",
        label: "Kemandirian Menaruh Barang Pribadi",
        description: "Mandiri melepaskan dan merapikan sepatu di rak serta menggantung tas pada loker/tempat yang disediakan.",
        foundation: 5,
        score_descriptors: {
          "1": "Barang pribadi ditinggal berserakan di lantai / butuh bantuan fisik penuh dari guru.",
          "2": "Merapikan sepatu di rak dan menggantung tas dengan sedikit arahan verbal/pengingat.",
          "3": "Spontan dan tertib membuka serta meletakkan sepatu di rak dan menaruh tas secara mandiri.",
        },
      },
      {
        id: "SO-03",
        label: "Kepatuhan Mengikuti Instruksi saat Transisi",
        description: "Mengikuti instruksi pendamping dengan tertib saat berpindah antar ruang pos observasi.",
        foundation: 2,
        score_descriptors: {
          "1": "Mengabaikan instruksi, berlarian keluar barisan, atau menolak berpindah pos.",
          "2": "Mengikuti transisi kelompok, sesekali perlu diingatkan untuk tetap tertib di barisan.",
          "3": "Sangat tertib, fokus, berjalan tenang bersama kelompok, dan tanggap terhadap aba-aba pendamping.",
        },
      },
      {
        id: "SO-04",
        label: "Kesantunan dan Budaya Antre",
        description: "Menggunakan kata santun (tolong, maaf, terima kasih) dan memiliki kesabaran menunggu giliran antrean.",
        foundation: 1,
        score_descriptors: {
          "1": "Menyerobot antrean teman / tidak sabar menunggu giliran / bersikap agresif saat menunggu.",
          "2": "Mau mengantre tertib dan berucap santun jika diingatkan atau dicontohkan guru.",
          "3": "Konsisten sabar menunggu giliran dan spontan berucap tolong, maaf, serta terima kasih.",
        },
      },
      {
        id: "SO-05",
        label: "Regulasi Diri & Adaptasi Kesulitan",
        description: "Kemampuan menenangkan diri, mengendalikan emosi, dan bangkit kembali saat menghadapi kesulitan atau tantangan.",
        foundation: 3,
        score_descriptors: {
          "1": "Tantrum / menangis keras / melempar benda / mogok saat mengalami kesulitan kecil.",
          "2": "Sempat merasa kesal atau frustrasi, namun mampu tenang kembali setelah ditenangkan guru.",
          "3": "Tenang, sabar, gigih mencoba kembali, dan mampu meregulasi emosi diri secara mandiri.",
        },
      },
      {
        id: "SO-06",
        label: "Bermain Kooperatif & Berbagi",
        description: "Interaksi saat bermain bersama teman, kesediaan berbagi alat mainan/snack, dan dinamika sosial kelompok.",
        foundation: 2,
        score_descriptors: {
          "1": "Menolak interaksi sama sekali / merebut alat main teman secara paksa / memukul/mendorong.",
          "2": "Bermain paralel di samping teman atau mau bergantian mainan jika difasilitasi oleh guru.",
          "3": "Aktif berinteraksi positif, kooperatif, berinisiatif mengajak teman bermain, dan senang berbagi.",
        },
      },
      {
        id: "SO-07",
        label: "Antusiasme & Refleksi Belajar",
        description: "Menunjukkan rasa ingin tahu positif, keceriaan belajar, dan mampu merefleksikan pengalaman belajarnya.",
        foundation: 6,
        score_descriptors: {
          "1": "Sangat tertekan, pasif total, tidak menunjukkan minat, atau menolak seluruh aktivitas.",
          "2": "Mengikuti alur kegiatan dengan baik jika diberikan dorongan semangat sesekali.",
          "3": "Sangat antusias, ceria, aktif bertanya, dan bangga menceritakan kembali pengalamannya.",
        },
      },
    ],
    red_flags: [
      { id: "rf-so-1", label: "Tantrum histeris melantai (>10 menit) tanpa respon bujukan" },
      { id: "rf-so-2", label: "Agresi fisik membahayakan (memukul, menggigit, atau menendang teman/guru)" },
      { id: "rf-so-3", label: "Perilaku impulsif berbahaya (berlari mendadak keluar area aman sekolah)" },
      { id: "rf-so-4", label: "Penolakan sosial ekstrem (menolak disapa sama sekali / kontak mata absen total)" },
    ],
  },
  2: {
    pos_number: 2,
    pos_name: "Pos Motorik Kasar & Koordinasi Fisik",
    pos_code: "POS A (MOTORIK KASAR + ESCORT)",
    evaluators: "Rifky Delsandi Rifai, S. Pd",
    role_type: "Penguji Ruangan + Penjemput Rotasi Kelompok",
    duration: "12 Menit per Rotasi Kelompok",
    focus: "Keseimbangan statis & dinamis, kontrol tubuh saat meniti papan titian, lompat 2 kaki bersamaan, ketangkasan tangkap-lempar bola, dan mobilitas fisik.",
    instructions: [
      "Pukul 08.00: Hadir di titik awal kedatangan saat pembagian name tag. Jemput Kelompok 1 dan bawa ke Pos Motorik Kasar.",
      "Pukul 08.12 - 08.24: Lakukan pengujian motorik Kelompok 1 di ruang Pos Motorik.",
      "Pukul 08.24: Di pintu Pos A, serahkan Kelompok 1 ke SO 1 (Ahmad Furqoni), lalu sambut & terima Kelompok 2 dari SO 1 untuk diuji di Pos Motorik.",
      "Pukul 08.36: Di pintu Pos A, serahkan Kelompok 2 ke SO 2 (Novia Permatasari). Segera menuju Pos Bahasa untuk menjemput Kelompok 3 dan membawanya ke Pos Motorik.",
      "Pukul 08.48: Selesai menguji Kelompok 3, antar langsung Kelompok 3 ke Area Bermain & Snack di Titik Akhir."
    ],
    indicators: [
      {
        id: "MK-01",
        label: "Keseimbangan & Kontrol Tubuh",
        description: "Berjalan lurus pada garis, meniti papan titian kayu, dan melompat 2 kaki bersamaan secara seimbang.",
        foundation: 5,
        score_descriptors: {
          "1": "Menolak melangkah di titian / hilang keseimbangan total (harus dipegangi erat sepanjang titian).",
          "2": "Mampu meniti titian atau melompat dengan bantuan minimal (sentuhan 1 jari / sesekali goyah).",
          "3": "Lincah, seimbang sempurna di titian, dan melompat 2 kaki mandiri dengan percaya diri dan mendarat stabil.",
        },
      },
      {
        id: "MK-02",
        label: "Koordinasi Mata-Tangan & Respons Gerak",
        description: "Merespons instruksi gerak verbal pemandu dan ketangkasan koordinasi tangkap-lempar bola dari jarak 1,5 meter.",
        foundation: 5,
        score_descriptors: {
          "1": "Tidak merespons instruksi gerak / luput total menangkap bola (bola selalu jatuh ke lantai).",
          "2": "Respons gerakan agak lambat, berhasil menangkap/melempar bola setelah 1–2 kali percobaan dibimbing.",
          "3": "Respons tanggap dan gesit, menangkap bola 2 tangan secara akurat dan melempar kembali dengan presisi.",
        },
      },
    ],
    red_flags: [
      { id: "rf-mk-1", label: "Tonus otot kaku ekstrem (hipertonia) atau sangat lemas tanpa daya (hipotonia)" },
      { id: "rf-mk-2", label: "Sering terjatuh tanpa hambatan fisik jelas / kehilangan keseimbangan vestibular berat" },
      { id: "rf-mk-3", label: "Ketidakmampuan melompat 2 kaki lepas dari permukaan lantai pada usia > 6 tahun" },
    ],
  },
  3: {
    pos_number: 3,
    pos_name: "Pos Kematangan Kognitif & Berhitung",
    pos_code: "POS B (KEMATANGAN KOGNITIF)",
    evaluators: "Shalma Ruhail Maldova, S. Pd",
    role_type: "Penguji Stasioner (Tetap di Dalam Ruangan)",
    duration: "12 Menit per Rotasi Kelompok",
    focus: "Kemampuan berpikir logis, klasifikasi objek berdasarkan atribut warna/bentuk/ukuran, kelanjutan pola deret berulang (AB-AB / ABC-ABC), konsep kuantitas konkrit (banyak-sedikit, membilang 1-10), dan pemecahan masalah puzzle/balok.",
    instructions: [
      "Evaluator tetap berada di dalam ruangan Pos Kognitif. Siswa akan diantar dan dijemput oleh pemandu rotasi.",
      "Siapkan media konkrit: balok warna-warni, kancing/kartu klasifikasi, puzzle 9-12 keping, dan alat peraga pola deret.",
      "Mulai dengan apersepsi ramah dan suasana bermain yang santai.",
      "Beri waktu 2-3 menit per anak untuk mengeksplorasi alat permainan sebelum meminta menyelesaikan pola/tugas kognitif."
    ],
    indicators: [
      {
        id: "KG-01",
        label: "Klasifikasi Objek & Pola Berulang",
        description: "Mengelompokkan benda berdasarkan atribut tertentu (warna/bentuk/fungsi) dan melengkapi pola deret yang teratur.",
        foundation: 4,
        score_descriptors: {
          "1": "Belum mampu memilah benda atau melanjutkan pola deret sederhana walaupun telah dicontohkan.",
          "2": "Mampu mengelompokkan 1 atribut atau melengkapi pola deret sederhana (AB-AB) setelah dipandu contoh.",
          "3": "Mandiri dan tepat memilah multi-atribut serta melanjutkan pola deret kompleks (ABC-ABC / AABB).",
        },
      },
      {
        id: "KG-02",
        label: "Konsep Kuantitas & Problem Solving",
        description: "Memahami perbandingan banyak vs sedikit, membilang benda konkret 1-10, dan menyelesaikan tantangan puzzle/balok.",
        foundation: 4,
        score_descriptors: {
          "1": "Belum memahami konsep banyak-sedikit / bingung membilang konkret (1–5) / puzzle dibiarkan acak.",
          "2": "Mampu membandingkan kuantitas & menyelesaikan puzzle dasar dengan sedikit petunjuk arahan.",
          "3": "Pemahaman kuantitas kuat, membilang tepat satu-ke-satu, dan solutif merangkai balok/puzzle secara tuntas.",
        },
      },
    ],
    red_flags: [
      { id: "rf-kg-1", label: "Disorientasi spasial berat / tidak mengenal konsep bentuk dan arah dasar sama sekali" },
      { id: "rf-kg-2", label: "Tidak memahami hubungan kausalitas (sebab-akibat) sederhana dalam percakapan sehari-hari" },
      { id: "rf-kg-3", label: "Ketidakmampuan membedakan ukuran kontras (besar vs kecil sekali) secara visual" },
    ],
  },
  4: {
    pos_number: 4,
    pos_name: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
    pos_code: "POS C (BAHASA & PRA-LITERASI)",
    evaluators: "Susmurtiningsih, S. Pd",
    role_type: "Penguji Stasioner (Tetap di Dalam Ruangan)",
    duration: "12 Menit per Rotasi Kelompok",
    focus: "Kemampuan menyimak cerita lisan (read-aloud), menjawab pertanyaan pemahaman alur, keberanian komunikasi verbal mengutarakan ide, kontrol pensil dan genggaman jemari (tripod grasp), serta pemetaan 4 tingkat literasi membaca.",
    instructions: [
      "Evaluator tetap berada di dalam ruangan Pos Bahasa & Halus. Siswa akan diantar dan dijemput oleh pemandu rotasi.",
      "Sesi dimulai dengan membacakan buku cerita bergambar pendek (read-aloud) selama 3-4 menit dengan intonasi menarik.",
      "Ajukan 2-3 pertanyaan terbuka mengenai karakter dan alur cerita untuk menguji pemahaman menyimak.",
      "Berikan lembar gambar dan pensil segitiga untuk mengamati posisi genggaman pensil (dynamic tripod grasp vs palmar grasp).",
      "Petakan level membaca anak ke salah satu dari 4 Tingkat Literasi (L1, L2, L3, L4)."
    ],
    indicators: [
      {
        id: "BL-01",
        label: "Menyimak Cerita Lisan (Read-Aloud)",
        description: "Menyimak cerita lisan yang dibacakan guru dan memahami pesan moral serta alur kejadian sederhana.",
        foundation: 2,
        score_descriptors: {
          "1": "Tidak memperhatikan cerita, mudah terdistraksi total / tidak mampu menjawab pertanyaan tentang isi cerita.",
          "2": "Menyimak cerita sebagian, mampu menjawab pertanyaan jika dibantu dengan pertanyaan pemancing.",
          "3": "Menyimak dengan fokus penuh, memahami alur cerita, dan mampu menceritakan kembali intisarinya dengan runtut.",
        },
      },
      {
        id: "BL-02",
        label: "Komunikasi Gagasan Lisan",
        description: "Mengomunikasikan gagasan lisan tentang ide, gambar, atau karyanya dengan kalimat sederhana yang terstruktur.",
        foundation: 2,
        score_descriptors: {
          "1": "Menolak berbicara sama sekali / suara sangat lirih tak terdengar / berbicara dengan kata tanpa makna.",
          "2": "Menjawab hanya dengan frasa pendek 1–2 kata, masih butuh dorongan untuk berbicara lebih lanjut.",
          "3": "Berani, lancar, dan percaya diri mengutarakan gagasan dengan struktur kalimat sederhana yang jelas.",
        },
      },
      {
        id: "BL-03",
        label: "Kontrol Motorik Halus & Tripod Grasp",
        description: "Kontrol jemari tangan dan posisi genggaman pensil fungsional (tripod grasp) saat menulis, menarik garis, atau menggambar.",
        foundation: 5,
        score_descriptors: {
          "1": "Genggaman tinju penuh (palmar grasp) kaku tanpa kontrol jemari / tidak dapat memegang alat tulis.",
          "2": "Genggaman peralihan (pincer / 4 jari), goresan garis pada kertas masih agak kaku dan bergetar.",
          "3": "Dynamic tripod grasp fungsional mantap (ibu jari, telunjuk, jari tengah), goresan luwes dan terkontrol.",
        },
      },
    ],
    reading_levels: [
      { level: "L1", name: "Tingkat 1: Gambar & Simbol Visual", desc: "Mampu memaknai gambar konkret dan simbol visual benda sehari-hari, belum mengenal bunyi huruf fonik." },
      { level: "L2", name: "Tingkat 2: Huruf & Bunyi Fonik", desc: "Mengenal bentuk huruf kapital/kecil serta bunyi vokal dan konsonan dasar (a-i-u-e-o, b, m, p, s)." },
      { level: "L3", name: "Tingkat 3: Membaca Suku Kata", desc: "Mampu menggabungkan huruf menjadi suku kata terbuka sederhana (ba-ba, bu-ku, bo-la, ma-ma)." },
      { level: "L4", name: "Tingkat 4: Membaca Kalimat Lancar", desc: "Mampu membaca kalimat pendek secara lancar dan memahami maksud bacaan tanpa mengeja per huruf." },
    ],
    red_flags: [
      { id: "rf-bl-1", label: "Bicara tidak dapat dipahami sama sekali oleh orang dewasa (speech delay berat)" },
      { id: "rf-bl-2", label: "Ekolalia — hanya mengulang kata yang diucapkan guru tanpa makna kontekstual" },
      { id: "rf-bl-3", label: "Tremor jemari tangan ekstrem / otot tangan sangat lemah sehingga pensil selalu terjatuh" },
    ],
  },
};

export default function CompleteAssessmentGuidePage() {
  const [activePosTab, setActivePosTab] = useState<number | "all">("all");
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(DEFAULT_SCHOOL_PROFILE);
  const [teachers, setTeachers] = useState<TeacherStaff[]>(DEFAULT_TEACHERS);
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    // Format Indonesian date for print footer
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    setCurrentDateStr(now.toLocaleDateString("id-ID", options));

    async function fetchMeta() {
      try {
        const [sRes, tRes] = await Promise.all([
          fetch("/api/school"),
          fetch("/api/teachers"),
        ]);
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (sJson.data) setSchoolProfile(sJson.data);
        }
        if (tRes.ok) {
          const tJson = await tRes.json();
          if (tJson.data && tJson.data.length > 0) setTeachers(tJson.data);
        }
      } catch {
        // Safe fallback to constants
      }
    }
    fetchMeta();
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const displayedPosList = useMemo(() => {
    if (activePosTab === "all") return [1, 2, 3, 4];
    return [activePosTab];
  }, [activePosTab]);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] font-sans print:bg-white print:text-black">
      {/* ─── FLOATING ACTION TOOLBAR (SCREEN ONLY) ─── */}
      <aside aria-label="Aksi Panduan Cetak" className="print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E8E2D8] shadow-xs px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/evaluator"
              className="bg-[#FAF8F5] border border-[#DDD7CE] text-[#22352B] hover:bg-[#EFECE4] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
            >
              <i className="mdi mdi-arrow-left text-base" />
              <span>Kembali ke Portal</span>
            </Link>

            <span className="hidden sm:inline-block w-px h-5 bg-[#E8E2D8]" />

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#385642]" />
              <span className="text-xs font-extrabold text-[#385642] uppercase tracking-wide">
                Buku Panduan &amp; Rubrik Evaluator
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pos Tampilan */}
            <div className="flex items-center bg-[#FAF8F5] border border-[#DDD0B8] p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActivePosTab("all")}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activePosTab === "all"
                    ? "bg-[#9C4322] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B]"
                }`}
              >
                Semua Pos (Lengkap)
              </button>
              <button
                type="button"
                onClick={() => setActivePosTab(1)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activePosTab === 1
                    ? "bg-[#9C4322] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B]"
                }`}
              >
                Pos 1 (SO)
              </button>
              <button
                type="button"
                onClick={() => setActivePosTab(2)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activePosTab === 2
                    ? "bg-[#9C4322] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B]"
                }`}
              >
                Pos 2 (Motorik)
              </button>
              <button
                type="button"
                onClick={() => setActivePosTab(3)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activePosTab === 3
                    ? "bg-[#9C4322] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B]"
                }`}
              >
                Pos 3 (Kognitif)
              </button>
              <button
                type="button"
                onClick={() => setActivePosTab(4)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activePosTab === 4
                    ? "bg-[#9C4322] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B]"
                }`}
              >
                Pos 4 (Bahasa)
              </button>
            </div>

            {/* Tombol Cetak / Simpan PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#2E6B4D] hover:bg-[#24543D] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <i className="mdi mdi-printer text-base" />
              <span>Cetak Dokumen (A4)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── PRINTABLE DOCUMENT SHEET CONTAINER ─── */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8 my-4 sm:my-8 bg-white border border-[#E8E2D8] rounded-3xl shadow-md print:shadow-none print:border-none print:m-0 print:p-0 print:rounded-none print:max-w-none">
        
        {/* ─── KOP SURAT RESMI LEMBAGA ─── */}
        <header className="pb-4 border-b-2 border-[#22352B] space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#385642] text-white flex items-center justify-center text-3xl font-black flex-shrink-0 shadow-sm print:border print:border-black">
              <i className="mdi mdi-school" />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#787F7A] print:text-black">
                {schoolProfile.foundation_name || "YAYASAN NURUN NAJAH"}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-[#22352B] print:text-black tracking-tight leading-tight">
                {schoolProfile.school_name || "SD ISLAM AN NAJAH"}
              </h1>
              <p className="text-[11px] sm:text-xs text-[#565C58] print:text-black mt-0.5 leading-snug">
                NPSN: <strong className="font-mono">{schoolProfile.npsn || "20109914"}</strong> &bull; {schoolProfile.address}, {schoolProfile.subdistrict}, {schoolProfile.city}, {schoolProfile.province} {schoolProfile.postal_code}
              </p>
              <p className="text-[10.5px] text-[#787F7A] print:text-black mt-0.5 font-mono">
                Telp: {schoolProfile.phone} &bull; Email: {schoolProfile.email} &bull; Web: {schoolProfile.website}
              </p>
            </div>
          </div>
          {/* Garis Ganda Standar Dokumen Dinas */}
          <div className="pt-2">
            <div className="w-full border-t-2 border-[#22352B]" />
            <div className="w-full border-t border-[#22352B] mt-0.5" />
          </div>
        </header>

        {/* ─── JUDUL UTAMA PANDUAN ─── */}
        <section className="text-center py-6 space-y-2 border-b border-[#E8E2D8] print:border-black">
          <span className="bg-[#FAF0E8] text-[#9C4322] border border-[#F2D8C7] px-3.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider inline-block print:border-black print:text-black print:bg-transparent">
            DOKUMEN RESMI SPMB • TAHUN AJARAN {schoolProfile.academic_year || "2026/2027"}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#22352B] print:text-black uppercase tracking-tight">
            PANDUAN OPERASIONAL &amp; MATRIKS RUBRIK OBSERVASI
          </h2>
          <p className="text-xs sm:text-sm text-[#565C58] print:text-black max-w-2xl mx-auto leading-relaxed">
            Pedoman Standar Evaluator SPMB SD Islam An Najah Berbasis Transisi PAUD-SD Menyenangkan (6 Fondasi Kemendikbudristek) dengan Skala Capaian 3 Tingkat
          </p>
        </section>

        {/* ─── BAGIAN I: KETENTUAN UMUM & SISTEM SKALA NILAI ─── */}
        <section className="py-6 space-y-4 border-b border-[#E8E2D8] print:border-black">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#385642] text-white flex items-center justify-center font-bold text-xs print:border print:border-black print:text-black print:bg-transparent">
              I
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#22352B] print:text-black uppercase tracking-wide">
              KETENTUAN UMUM &amp; SKALA PENILAIAN 3 TINGKAT
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D8] print:border-black space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#B83A35] font-mono text-sm">SKOR 1</span>
                <span className="bg-[#FCEEEF] text-[#B83A35] font-black px-2 py-0.5 rounded text-[10px] border border-[#F2D8C7] print:border-black print:text-black">
                  PERLU BIMBINGAN (PB)
                </span>
              </div>
              <p className="text-[#565C58] print:text-black leading-snug text-[11px]">
                Anak belum menunjukkan indikator yang diharapkan atau membutuhkan bantuan fisik/arahan penuh dari evaluator untuk melakukan aktivitas.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D8] print:border-black space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#7D5327] font-mono text-sm">SKOR 2</span>
                <span className="bg-[#FAF0E8] text-[#7D5327] font-black px-2 py-0.5 rounded text-[10px] border border-[#DDD0B8] print:border-black print:text-black">
                  BERKEMBANG SESUAI HARAPAN (BSH)
                </span>
              </div>
              <p className="text-[#565C58] print:text-black leading-snug text-[11px]">
                Anak mampu menampilkan perilaku/tugas dengan bantuan minimal, petunjuk arahan verbal sesekali, atau pembiasaan bertahap.
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D8] print:border-black space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#2E6B4D] font-mono text-sm">SKOR 3</span>
                <span className="bg-[#E4EFE9] text-[#2E6B4D] font-black px-2 py-0.5 rounded text-[10px] border border-[#CBE0D4] print:border-black print:text-black">
                  MANDIRI (M)
                </span>
              </div>
              <p className="text-[#565C58] print:text-black leading-snug text-[11px]">
                Anak mampu menampilkan perilaku secara konsisten, spontan, percaya diri, dan mandiri tanpa memerlukan bantuan evaluator.
              </p>
            </div>
          </div>

          {/* Penjelasan Red Flag & Waktu Observasi */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] print:border-black text-xs space-y-2">
            <h4 className="font-extrabold text-[#22352B] print:text-black flex items-center gap-2">
              <i className="mdi mdi-alert-circle text-sm text-[#B83A35]" />
              <span>Pedoman Catatan Anekdot &amp; Indikator Peringatan Khusus (Red Flag)</span>
            </h4>
            <p className="text-[#565C58] print:text-black leading-relaxed text-[11px]">
              <strong>Red Flag</strong> bukan vonis ketidaklulusan, melainkan tanda peringatan dini perilaku/fisik yang memerlukan penanganan khusus (individual education plan/IEP), konfirmasi orang tua, atau rujukan psikolog/terapis anak. Evaluator wajib mendokumentasikan konteks pemicu pada kolom Catatan Anekdot Lapangan.
            </p>
          </div>
        </section>

        {/* ─── BAGIAN II: TIM EVALUATOR RESMI & DISTRIBUSI PERAN ─── */}
        <section className="py-6 space-y-4 border-b border-[#E8E2D8] print:border-black">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#385642] text-white flex items-center justify-center font-bold text-xs print:border print:border-black print:text-black print:bg-transparent">
              II
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#22352B] print:text-black uppercase tracking-wide">
              TIM EVALUATOR SPMB RESMI &amp; STRUKTUR PENUGASAN
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#E8E2D8] print:border-black border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] print:bg-gray-100 text-[#22352B] print:text-black font-extrabold border-b border-[#E8E2D8] print:border-black">
                  <th className="p-2.5 border-r border-[#E8E2D8] print:border-black w-12 text-center">Pos</th>
                  <th className="p-2.5 border-r border-[#E8E2D8] print:border-black w-48">Ruang &amp; Domain Observasi</th>
                  <th className="p-2.5 border-r border-[#E8E2D8] print:border-black w-56">Petugas Evaluator</th>
                  <th className="p-2.5">Karakteristik &amp; Model Penugasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] print:divide-black">
                <tr>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-mono font-bold text-center">1</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-bold">Kemandirian, Regulasi Emosi &amp; Kepatuhan</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black">
                    <strong>Ahmad Furqoni, S. Pd</strong> (SO 1)<br />
                    <strong>Novia Permatasari, S. Pd</strong> (SO 2)
                  </td>
                  <td className="p-2.5 text-[#565C58] print:text-black">
                    Super Observer Longitudinal: mengawal kedatangan, transisi 3 pos, hingga snack &amp; bermain bebas.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-mono font-bold text-center">2</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-bold">Pos A: Motorik Kasar &amp; Koordinasi Fisik</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black">
                    <strong>Rifky Delsandi Rifai, S. Pd</strong>
                  </td>
                  <td className="p-2.5 text-[#565C58] print:text-black">
                    Penguji Motorik Ruangan + Escort: jemput Kel. 1 di awal, serah-terima di pintu Pos A, dan antar Kel. 3 ke titik akhir.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-mono font-bold text-center">3</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-bold">Pos B: Kematangan Kognitif &amp; Berhitung</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black">
                    <strong>Shalma Ruhail Maldova, S. Pd</strong>
                  </td>
                  <td className="p-2.5 text-[#565C58] print:text-black">
                    Stasioner Ruangan (12 menit/kelompok): pola, klasifikasi objek, kuantitas &amp; balok problem solving.
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-mono font-bold text-center">4</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black font-bold">Pos C: Bahasa Lisan &amp; Motorik Halus</td>
                  <td className="p-2.5 border-r border-[#E8E2D8] print:border-black">
                    <strong>Susmurtiningsih, S. Pd</strong>
                  </td>
                  <td className="p-2.5 text-[#565C58] print:text-black">
                    Stasioner Ruangan (12 menit/kelompok): read-aloud menyimak cerita, ide verbal, tripod grasp, &amp; tingkat literasi L1–L4.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── BAGIAN III: MATRIKS RUBRIK RINCI PER POS (DESKRIPTOR LENGKAP) ─── */}
        <div className="py-6 space-y-8">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#385642] text-white flex items-center justify-center font-bold text-xs print:border print:border-black print:text-black print:bg-transparent">
              III
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#22352B] print:text-black uppercase tracking-wide">
              MATRIKS RUBRIK DESKRIPTOR LENGKAP PER POS
            </h3>
          </div>

          {displayedPosList.map((posNum) => {
            const posData = COMPLETE_POS_GUIDE[posNum];
            if (!posData) return null;

            return (
              <section
                key={posNum}
                className="space-y-4 pt-4 border-t border-[#E8E2D8] print:border-black print:break-inside-avoid print:page-break-after"
              >
                {/* Header Pos */}
                <div className="bg-[#FAF8F5] print:bg-transparent p-4 rounded-2xl border border-[#E8E2D8] print:border-black space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-full bg-[#9C4322] text-white print:bg-transparent print:text-black print:border print:border-black w-fit">
                      {posData.pos_code}
                    </span>
                    <span className="text-xs text-[#787F7A] print:text-black font-semibold">
                      Durasi: {posData.duration}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-[#22352B] print:text-black">
                    {posData.pos_name}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <p className="text-[#565C58] print:text-black">
                      <strong>Petugas:</strong> {posData.evaluators}
                    </p>
                    <p className="text-[#565C58] print:text-black">
                      <strong>Model Tugas:</strong> {posData.role_type}
                    </p>
                  </div>

                  <p className="text-xs text-[#565C58] print:text-black italic leading-relaxed pt-1">
                    <strong>Fokus Domain:</strong> {posData.focus}
                  </p>
                </div>

                {/* Petunjuk Teknis Alur Lapangan */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D8] print:border-black text-xs space-y-1.5">
                  <h5 className="font-extrabold text-[#22352B] print:text-black uppercase tracking-wider text-[11px]">
                    SOP &amp; Alur Teknis Evaluator di Lapangan:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-[#565C58] print:text-black text-[11.5px] leading-relaxed">
                    {posData.instructions.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>
                </div>

                {/* Tabel Matriks Rubrik Indikator */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-[#E8E2D8] print:border-black border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F5] print:bg-gray-100 text-[#22352B] print:text-black font-extrabold border-b border-[#E8E2D8] print:border-black">
                        <th className="p-2 border-r border-[#E8E2D8] print:border-black w-24">Kode &amp; Indikator</th>
                        <th className="p-2 border-r border-[#E8E2D8] print:border-black w-32">Fondasi PAUD-SD</th>
                        <th className="p-2 border-r border-[#E8E2D8] print:border-black w-1/4">Perlu Bimbingan (Skor 1)</th>
                        <th className="p-2 border-r border-[#E8E2D8] print:border-black w-1/4">Berkembang Sesuai Harapan (Skor 2)</th>
                        <th className="p-2 w-1/4">Mandiri (Skor 3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D8] print:divide-black">
                      {posData.indicators.map((ind) => (
                        <tr key={ind.id} className="align-top">
                          <td className="p-2 border-r border-[#E8E2D8] print:border-black">
                            <span className="font-mono font-bold text-[#9C4322] print:text-black block text-[11px]">
                              {ind.id}
                            </span>
                            <span className="font-bold text-[#22352B] print:text-black block mt-0.5 leading-snug">
                              {ind.label}
                            </span>
                            <span className="text-[10px] text-[#787F7A] print:text-black block mt-1 leading-tight">
                              {ind.description}
                            </span>
                          </td>
                          <td className="p-2 border-r border-[#E8E2D8] print:border-black">
                            {ind.foundation ? (
                              <span className="inline-block bg-[#E4EFE9] text-[#2E6B4D] print:bg-transparent print:text-black print:border print:border-black px-2 py-0.5 rounded text-[10px] font-bold">
                                Fondasi {ind.foundation}: {FOUNDATION_LABELS[ind.foundation]?.short || FOUNDATION_LABELS[ind.foundation]?.name}
                              </span>
                            ) : (
                              <span className="text-[#787F7A] text-[10px]">-</span>
                            )}
                          </td>
                          <td className="p-2 border-r border-[#E8E2D8] print:border-black text-[11px] text-[#565C58] print:text-black leading-snug bg-red-50/20 print:bg-transparent">
                            {ind.score_descriptors["1"]}
                          </td>
                          <td className="p-2 border-r border-[#E8E2D8] print:border-black text-[11px] text-[#565C58] print:text-black leading-snug bg-amber-50/20 print:bg-transparent">
                            {ind.score_descriptors["2"]}
                          </td>
                          <td className="p-2 text-[11px] text-[#565C58] print:text-black leading-snug bg-emerald-50/20 print:bg-transparent font-medium">
                            {ind.score_descriptors["3"]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Khusus Pos 4: Rubrik Tingkat Literasi Membaca */}
                {posData.reading_levels && (
                  <div className="bg-[#FAF8F5] print:bg-transparent p-3.5 rounded-2xl border border-[#E8E2D8] print:border-black space-y-2 text-xs">
                    <h5 className="font-black text-[#22352B] print:text-black flex items-center gap-1.5 uppercase tracking-wide">
                      <i className="mdi mdi-book-open-variant text-sm text-[#385642]" />
                      <span>Rubrik 4 Tingkat Literasi Membaca Awal (Reading Level)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {posData.reading_levels.map((lvl) => (
                        <div key={lvl.level} className="bg-white p-2.5 rounded-xl border border-[#E8E2D8] print:border-black space-y-0.5">
                          <span className="font-mono font-bold text-[#385642] print:text-black text-[11px]">
                            [{lvl.level}] {lvl.name}
                          </span>
                          <p className="text-[10.5px] text-[#565C58] print:text-black leading-snug">
                            {lvl.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Indikator Red Flag Khusus Pos */}
                <div className="bg-red-50/40 print:bg-transparent p-3 rounded-2xl border border-red-200 print:border-black text-xs space-y-1">
                  <span className="font-bold text-[#B83A35] print:text-black block text-[11px]">
                    Indikator Perhatian Khusus (Red Flag) Pos {posNum}:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[#565C58] print:text-black text-[11px]">
                    {posData.red_flags.map((rf) => (
                      <li key={rf.id}>{rf.label}</li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        {/* ─── LEMBAR PENGESAHAN DOKUMEN ─── */}
        <section className="pt-8 mt-8 border-t-2 border-[#22352B] print:break-inside-avoid text-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[#787F7A] print:text-black font-mono text-[11px]">
              Dicetak pada: {currentDateStr || "Hari Kegiatan SPMB"} &bull; Sistem Observasi Kalamula
            </span>
            <span className="text-[#22352B] print:text-black font-bold">
              Jakarta Timur, {currentDateStr || "Maret 2026"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center pt-2">
            <div className="space-y-16">
              <p className="font-bold text-[#22352B] print:text-black">
                Koordinator Tim Evaluator SPMB,
              </p>
              <div>
                <p className="font-bold underline text-[#22352B] print:text-black text-sm">
                  Ahmad Furqoni, S. Pd
                </p>
                <p className="text-[#787F7A] print:text-black text-[11px]">
                  Super Observer 1 &bull; SD Islam An Najah
                </p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="font-bold text-[#22352B] print:text-black">
                Mengetahui,<br />Kepala SD Islam An Najah,
              </p>
              <div>
                <p className="font-bold underline text-[#22352B] print:text-black text-sm">
                  {schoolProfile.principal_name || "Wida Mawaddah, S. Pd., Gr."}
                </p>
                <p className="text-[#787F7A] print:text-black text-[11px]">
                  NIP: {schoolProfile.principal_nip || "-"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
