export interface QuestionnaireQuestion {
  id: string;
  question: string;
  options: string[];
}

export const DEFAULT_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: "q1",
    question: "Apakah putra/putri Anda pernah mengikuti pendidikan PAUD/TK?",
    options: ["Belum pernah", "TK 1 tahun", "TK 2 tahun (A dan B)", "PAUD dan TK lengkap"],
  },
  {
    id: "q2",
    question: "Bagaimana kebiasaan anak saat berpisah dari orang tua di pagi hari?",
    options: ["Sering menangis lama", "Kadang cemas", "Tenang setelah dibujuk", "Mandiri dan antusias"],
  },
  {
    id: "q3",
    question: "Apakah anak sudah dapat makan, minum, dan ke toilet secara mandiri?",
    options: ["Belum mandiri", "Bisa makan sendiri saja", "Bisa makan dan ke toilet", "Mandiri sepenuhnya"],
  },
  {
    id: "q4",
    question: "Apakah anak memiliki riwayat keterlambatan bicara atau terapi tumbuh kembang?",
    options: ["Tidak ada", "Pernah speech therapy", "Sedang menjalani terapi", "Ada kondisi khusus lain"],
  },
  {
    id: "q5",
    question: "Berapa lama rata-rata anak dapat fokus pada satu aktivitas bermain atau mewarnai?",
    options: ["Kurang dari 5 menit", "5-10 menit", "10-20 menit", "Lebih dari 20 menit"],
  },
];
