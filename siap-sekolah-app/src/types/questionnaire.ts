export interface QuestionnaireQuestion {
  id: string;
  category?: string;
  question: string;
  options: string[];
}

export const QUESTIONNAIRE_CATEGORIES = [
  "A. Kemandirian & Perawatan Diri (Self-Care)",
  "B. Kematangan Emosi & Regulasi Diri",
  "C. Keterampilan Sosial & Bahasa Lisan",
  "D. Kematangan Kognitif & Pra-Literasi / Numerasi",
  "E. Pembiasaan Nilai Agama, Rutinitas, & Kesehatan",
] as const;

export const DEFAULT_OPTIONS = ["Selalu", "Kadang-Kadang", "Belum"];

export const DEFAULT_QUESTIONS: QuestionnaireQuestion[] = [
  // ─── A. KEMANDIRIAN & PERAWATAN DIRI (SELF-CARE) ─────────────────────
  {
    id: "q1",
    category: "A. Kemandirian & Perawatan Diri (Self-Care)",
    question: "Mampu melepas dan mengenakan sepatu serta kaos kaki sendiri tanpa bantuan.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q2",
    category: "A. Kemandirian & Perawatan Diri (Self-Care)",
    question: "Mampu menggunakan toilet secara mandiri (toilet training) dan merapikan pakaian kembali.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q3",
    category: "A. Kemandirian & Perawatan Diri (Self-Care)",
    question: "Mampu makan dan minum sendiri secara mandiri dan rapi.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q4",
    category: "A. Kemandirian & Perawatan Diri (Self-Care)",
    question: "Terbiasa merapikan mainan atau peralatan belajar sendiri setelah selesai digunakan.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },

  // ─── B. KEMATANGAN EMOSI & REGULASI DIRI ────────────────────────────
  {
    id: "q5",
    category: "B. Kematangan Emosi & Regulasi Diri",
    question: "Berpisah dengan tenang dan tanpa cemas berlebih saat ditinggal orang tua di lingkungan baru.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q6",
    category: "B. Kematangan Emosi & Regulasi Diri",
    question: "Mampu mengendalikan amarah/kecewa tanpa tantrum berlebihan saat keinginannya ditunda.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q7",
    category: "B. Kematangan Emosi & Regulasi Diri",
    question: "Mampu bersabar menunggu giliran atau mengantre saat bermain bersama.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q8",
    category: "B. Kematangan Emosi & Regulasi Diri",
    question: "Mampu duduk tenang dan fokus menyelesaikan aktivitas yang disukai selama 10-15 menit.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },

  // ─── C. KETERAMPILAN SOSIAL & BAHASA LISAN ──────────────────────────
  {
    id: "q9",
    category: "C. Keterampilan Sosial & Bahasa Lisan",
    question: "Terbiasa menggunakan kata santun (\"tolong\", \"terima kasih\", \"maaf\") dalam interaksi harian.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q10",
    category: "C. Keterampilan Sosial & Bahasa Lisan",
    question: "Mampu menceritakan pengalaman atau menyampaikan perasaan dengan kalimat yang jelas.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q11",
    category: "C. Keterampilan Sosial & Bahasa Lisan",
    question: "Memahami dan mampu menjalankan instruksi lisan 2 langkah sekaligus (misal: \"Ambil tas lalu taruh di meja\").",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q12",
    category: "C. Keterampilan Sosial & Bahasa Lisan",
    question: "Mampu bermain dan berbagi mainan secara sehat dengan teman sebaya atau saudara.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },

  // ─── D. KEMATANGAN KOGNITIF & PRA-LITERASI / NUMERASI ───────────────
  {
    id: "q13",
    category: "D. Kematangan Kognitif & Pra-Literasi / Numerasi",
    question: "Mengenal dan dapat membedakan warna dasar serta bentuk geometri sederhana (lingkaran, segitiga, kotak).",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q14",
    category: "D. Kematangan Kognitif & Pra-Literasi / Numerasi",
    question: "Mengenal angka dan dapat membilang/menghitung jumlah benda konkret (1-10).",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q15",
    category: "D. Kematangan Kognitif & Pra-Literasi / Numerasi",
    question: "Memiliki ketertarikan terhadap buku cerita atau senang saat dibacakan buku oleh keluarga.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q16",
    category: "D. Kematangan Kognitif & Pra-Literasi / Numerasi",
    question: "Mampu memegang pensil/krayon dengan nyaman untuk mencoret, menggambar, atau menjiplak.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },

  // ─── E. PEMBIASAAN NILAI AGAMA, RUTINITAS, & KESEHATAN ──────────────
  {
    id: "q17",
    category: "E. Pembiasaan Nilai Agama, Rutinitas, & Kesehatan",
    question: "Terbiasa berdoa sederhana sebelum dan sesudah melakukan kegiatan harian.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q18",
    category: "E. Pembiasaan Nilai Agama, Rutinitas, & Kesehatan",
    question: "Memiliki jadwal tidur malam yang teratur (tidur sebelum jam 21.00) dan mudah dibangunkan pagi.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q19",
    category: "E. Pembiasaan Nilai Agama, Rutinitas, & Kesehatan",
    question: "Penggunaan screen time (TV/HP) di rumah terbatasi secara sehat (kurang dari 1-2 jam sehari).",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
  {
    id: "q20",
    category: "E. Pembiasaan Nilai Agama, Rutinitas, & Kesehatan",
    question: "Tidak memiliki riwayat kesehatan khusus, alergi berat, atau pemicu kecemasan sensorik yang mengganggu.",
    options: ["Selalu", "Kadang-Kadang", "Belum"],
  },
];
