/**
 * SIAP SEKOLAH — Gemini Generative AI Synthesizer
 *
 * Synthesizes rubrics milestone templates + authentic observer field notes
 * into constructive, parent-friendly narratives and home stimulation advice.
 */

export interface NarrativeSynthesisInput {
  fullName: string;
  nickname: string;
  templates: Record<number, string>;
  notes: Record<number, string | null>;
  readingLevel?: string | null;
  overallScore?: number | null;
}

export interface NarrativeSynthesisResult {
  narratives: Record<number, string>;
  stimulations: string[];
  source: "ai" | "fallback";
}

export function getGeminiApiKey(customEnvKey?: string): string {
  if (customEnvKey && customEnvKey.trim().length > 0) return customEnvKey.trim();
  if (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    if (ctx?.env?.GEMINI_API_KEY) {
      return String(ctx.env.GEMINI_API_KEY).trim();
    }
  } catch {
    // Not in Cloudflare request context
  }
  return "";
}

/**
 * Clean up common observer abbreviations and typos
 */
export function sanitizeObserverNote(note: string): string {
  return note
    .replace(/\bobser\b/gi, "observasi")
    .replace(/\bkarna\b/gi, "karena")
    .replace(/\bdistract\b/gi, "terdistraksi")
    .replace(/\bgk\b/gi, "tidak")
    .replace(/\bgak\b/gi, "tidak")
    .replace(/\bdgn\b/gi, "dengan")
    .replace(/\bkrn\b/gi, "karena")
    .replace(/\btp\b/gi, "tetapi")
    .replace(/\bbisa baca\b/gi, "dapat membaca")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates contextual home stimulations connected to observer notes and lowest indicators
 */
export function generateContextualStimulations(
  notes: Record<number, string | null>,
  posScores: Record<number, number | null> = {}
): string[] {
  const combinedNotes = Object.values(notes)
    .filter((n): n is string => Boolean(n && n.trim().length > 0))
    .join(" ")
    .toLowerCase();

  const stimCandidates: Array<{ priority: number; text: string }> = [];

  // 1. Keseimbangan & Koordinasi Motorik
  if (
    /keseimbangan|motorik|otot|tungkai|lompat|titian|jalan lurus|koordinasi/.test(
      combinedNotes
    ) ||
    (posScores[2] !== null && posScores[2] !== undefined && posScores[2] < 2.5)
  ) {
    stimCandidates.push({
      priority: /keseimbangan/.test(combinedNotes) ? 10 : 6,
      text: "Ajak Ananda melakukan permainan fisik menyenangkan seperti berjalan di atas garis lurus di lantai, melompat dua kaki, atau lempar-tangkap bola untuk memperkuat keseimbangan tubuh dan fokus gerak.",
    });
  }

  // 2. Daya Fokus & Konsentrasi
  if (
    /distraksi|distract|fokus|konsentrasi|perhatian|teralihkan/.test(
      combinedNotes
    )
  ) {
    stimCandidates.push({
      priority: 9,
      text: "Latih daya konsentrasi Ananda melalui aktivitas tenang 10–15 menit tanpa distraksi gawai, seperti menyusun balok bertahap, mewarnai pola teratur, atau bermain puzzle.",
    });
  }

  // 3. Pola Berulang, Numerasi & Urutan Logika
  if (
    /pola|angka|hitung|urutkan|kuantitas|kecil ke besar|besar ke kecil/.test(
      combinedNotes
    ) ||
    (posScores[3] !== null && posScores[3] !== undefined && posScores[3] < 2.5)
  ) {
    stimCandidates.push({
      priority: /pola|urutkan/.test(combinedNotes) ? 9 : 5,
      text: "Gunakan benda nyata di rumah (seperti sendok-garpu, balok mainan, atau kancing warna) untuk mengajak Ananda menyusun pola berulang dan berlatih mengurutkan benda dari ukuran kecil ke besar.",
    });
  }

  // 4. Membaca, Pengenalan Huruf & Pra-Literasi
  if (
    /baca|huruf|simbol|kata|suara|bunyi|kosakata|cerita|bicara/.test(
      combinedNotes
    ) ||
    (posScores[4] !== null && posScores[4] !== undefined && posScores[4] < 2.5)
  ) {
    stimCandidates.push({
      priority: /baca|huruf/.test(combinedNotes) ? 8 : 5,
      text: "Rutin bacakan buku cerita bergambar interaktif 10–15 menit sebelum tidur, ajak Ananda menceritakan kembali tokoh ceritanya dan menebak huruf awal dari nama-nama benda.",
    });
  }

  // 5. Kemandirian, Regulasi Emosi & Budaya Santun
  if (
    /mandiri|emosi|pisah|nangis|antre|sabar|sepatu|tas|loker/.test(
      combinedNotes
    ) ||
    (posScores[1] !== null && posScores[1] !== undefined && posScores[1] < 2.5)
  ) {
    stimCandidates.push({
      priority: /pisah|mandiri/.test(combinedNotes) ? 7 : 4,
      text: "Beri ruang dan kepercayaan kepada Ananda untuk meletakkan sepatu dan tas sekolahnya sendiri di rumah, disertai apresiasi hangat atas kemandiriannya.",
    });
  }

  // Sort by priority descending
  stimCandidates.sort((a, b) => b.priority - a.priority);

  if (stimCandidates.length >= 2) {
    return [stimCandidates[0].text, stimCandidates[1].text];
  } else if (stimCandidates.length === 1) {
    return [
      stimCandidates[0].text,
      "Rutin bacakan buku cerita bergambar 10–15 menit sebelum tidur dan ajak berdialog santai tentang isi cerita.",
    ];
  }

  // Default fallback
  return [
    "Ajak Ananda membaca buku cerita bergambar 10–15 menit sebelum tidur dan tanyakan alur ceritanya.",
    "Latih kemandirian merapikan sepatu dan tas sekolah secara konsisten setiap pulang bepergian.",
  ];
}

/**
 * Synthesizes templates and observer notes using Google Gemini Flash
 */
export async function synthesizeWithGemini(
  input: NarrativeSynthesisInput,
  apiKeyOverride?: string
): Promise<NarrativeSynthesisResult> {
  const apiKey = getGeminiApiKey(apiKeyOverride);

  // If no key or empty notes across all positions, return smart deterministic fallback
  const hasAnyNotes = Object.values(input.notes).some(
    (n) => n && n.trim().length > 0
  );

  if (!apiKey || !hasAnyNotes) {
    return {
      narratives: {
        1: input.notes[1]
          ? `${input.templates[1]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[1]!)}"`
          : input.templates[1],
        2: input.notes[2]
          ? `${input.templates[2]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[2]!)}"`
          : input.templates[2],
        3: input.notes[3]
          ? `${input.templates[3]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[3]!)}"`
          : input.templates[3],
        4: input.notes[4]
          ? `${input.templates[4]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[4]!)}"`
          : input.templates[4],
      },
      stimulations: generateContextualStimulations(input.notes),
      source: "fallback",
    };
  }

  const readingMap = {
    L1: "Tingkat 1 - Mengenal Gambar & Simbol (belum membaca kata/kalimat, baru tahap simbol visual)",
    L2: "Tingkat 2 - Mengenal Huruf & Bunyi (tahap fonemik/abjad, belum membaca suku kata)",
    L3: "Tingkat 3 - Membaca Suku Kata Sederhana (bu-ku, bo-la)",
    L4: "Tingkat 4 - Membaca Kalimat Pendek Lancar",
  };
  const readingDescription = input.readingLevel && readingMap[input.readingLevel as keyof typeof readingMap]
    ? readingMap[input.readingLevel as keyof typeof readingMap]
    : "Tahap awal perkembangan";

  const promptText = `Anda adalah pakar psikologi anak & asesor PPDB SD Islam An-Najah.
Tugas Anda adalah merangkum catatan observasi lapangan ananda menjadi narasi resmi rapor asesmen kesiapan bersekolah.

═══════════════════════════════════════════════════════════════════
PEDOMAN & GUARDRAILS WAJIB (JANGAN DIABAIKAN):
═══════════════════════════════════════════════════════════════════
1. GUARDRAIL KEJELASAN DIAGNOSTIK (ANTI-TOXIC POSITIVITY):
   - DILARANG mengaburkan, menghapus, atau memperhalus berlebihan catatan kesulitan anak.
   - Orang tua dan guru kelas 1 WAJIB mengetahui bagian mana yang masih kurang dan harus dikejar sebelum masuk SD.
   - Formula kalimat tiap pos: [1 Fakta Usaha / Kekuatan yang Muncul] + [1 Fakta Aspek yang Belum Tuntas / Perlu Pendampingan Spesifik].
   - Contoh BENAR: "Ananda menunjukkan usaha yang baik saat menyusun balok, namun masih memerlukan pendampingan intensif dalam mengurutkan angka dan menemukan pola berulang."
   - Contoh SALAH (DILARANG): "Ananda sangat cerdas dan menguasai semua permainan berhitung dengan gembira." (Ini menipu realitas).

2. GUARDRAIL ANTI-OMISI FAKTA LAPANGAN (ANTI-OMISSION RULE):
   - Jika guru observer mencatat kesulitan nyata, fakta tersebut WAJIB tercermin dalam narasi dan stimulasi:
     * Jika guru mencatat "keseimbangan kurang / goyah" -> WAJIB sebutkan bahwa kendali keseimbangan tubuh ananda masih perlu terus dilatih.
     * Jika guru mencatat "mudah terdistraksi / tidak fokus" -> WAJIB sebutkan bahwa daya konsentrasi ananda masih mudah teralihkan oleh lingkungan dan perlu dibiasakan memusatkan fokus.
     * Jika guru mencatat "sulit mengurutkan angka / pola berulang" -> WAJIB sebutkan ananda masih perlu bimbingan konkret dalam memahami urutan pola dan angka.
     * Jika guru mencatat "belum bisa baca / hanya kenal sedikit huruf" -> WAJIB sebutkan ananda masih dalam tahap awal simbol dan perlu latihan mengenal bentuk huruf.

3. GUARDRAIL TINGKAT KEMAMPUAN MEMBACA:
   - Status Membaca Ananda: ${readingDescription}.
   - Jika Tingkat Membaca adalah L1 atau L2, DILARANG menyatakan ananda sudah bisa membaca kata atau kalimat. Nyatakan secara jujur bahwa ananda masih pada tahap pengenalan gambar/simbol atau huruf.

4. NADA BAHASA:
   - Santun, objektif, edukatif, dan menghargai martabat anak tanpa menyalahkan.
   - Sebut nama panggilan ananda ("${input.nickname || input.fullName}") secara wajar dan personal.
   - Panjang narasi tiap pos: 1-2 kalimat padu (ringkas, tepat untuk kartu rapor).

5. PANDUAN LATIHAN DI RUMAH (stimulations):
   - Berikan tepat 2 saran kegiatan stimulasi konkret, praktis, dan menyenangkan bagi orang tua.
   - Saran latihan WAJIB MENARGETKAN ASPEK YANG DINYATAKAN KURANG / PERLU DILATIH dari catatan guru observer di atas, bukan saran umum generik.

Data Ananda:
Nama Lengkap: ${input.fullName}
Nama Panggilan: ${input.nickname || input.fullName}
Tingkat Membaca Asesmen: ${readingDescription}

Data Pos 1 (Kematangan Emosi & Kemandirian):
- Standar Capaian: ${input.templates[1] || "Mampu berpisah dari orang tua dan mulai mandiri."}
- Catatan Asli Guru: ${input.notes[1] ? sanitizeObserverNote(input.notes[1]!) : "Belum ada catatan khusus."}

Data Pos 2 (Motorik Kasar & Koordinasi Fisik):
- Standar Capaian: ${input.templates[2] || "Koordinasi fisik dasar berkembang sesuai usia."}
- Catatan Asli Guru: ${input.notes[2] ? sanitizeObserverNote(input.notes[2]!) : "Belum ada catatan khusus."}

Data Pos 3 (Kematangan Kognitif & Numerasi):
- Standar Capaian: ${input.templates[3] || "Konsep kuantitas dan logika objek konkret."}
- Catatan Asli Guru: ${input.notes[3] ? sanitizeObserverNote(input.notes[3]!) : "Belum ada catatan khusus."}

Data Pos 4 (Bahasa Lisan & Pra-Literasi):
- Standar Capaian: ${input.templates[4] || "Kesiapan menyimak cerita dan komunikasi gagasan."}
- Catatan Asli Guru: ${input.notes[4] ? sanitizeObserverNote(input.notes[4]!) : "Belum ada catatan khusus."}

Instruksi Output:
Kembalikan format JSON murni tanpa markdown wrapper (\`\`\`json):
{
  "narratives": {
    "1": "Narasi 1-2 kalimat untuk Pos 1 (memuat kekuatan + aspek yang perlu dilatih)",
    "2": "Narasi 1-2 kalimat untuk Pos 2 (memuat kekuatan + aspek yang perlu dilatih)",
    "3": "Narasi 1-2 kalimat untuk Pos 3 (memuat kekuatan + aspek yang perlu dilatih)",
    "4": "Narasi 1-2 kalimat untuk Pos 4 (memuat kekuatan + aspek yang perlu dilatih)",
  },
  "stimulations": [
    "Saran latihan konkret 1 di rumah yang menjawab aspek yang masih kurang",
    "Saran latihan konkret 2 di rumah yang menjawab aspek yang masih kurang"
  ]
}`;

  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  // Try gemini-flash-lite-latest, then gemini-flash-latest
  const candidateModels = ["gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-flash-latest"];

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        continue;
      }

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      if (parsed?.narratives && parsed?.stimulations) {
        return {
          narratives: {
            1: parsed.narratives["1"] || input.templates[1],
            2: parsed.narratives["2"] || input.templates[2],
            3: parsed.narratives["3"] || input.templates[3],
            4: parsed.narratives["4"] || input.templates[4],
          },
          stimulations: Array.isArray(parsed.stimulations) && parsed.stimulations.length > 0
            ? parsed.stimulations.slice(0, 2)
            : generateContextualStimulations(input.notes),
          source: "ai",
        };
      }
    } catch {
      // Continue to next model fallback
    }
  }

  // Fallback: Smart deterministic combination of template + sanitized teacher notes
  return {
    narratives: {
      1: input.notes[1]
        ? `${input.templates[1]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[1]!)}"`
        : input.templates[1],
      2: input.notes[2]
        ? `${input.templates[2]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[2]!)}"`
        : input.templates[2],
      3: input.notes[3]
        ? `${input.templates[3]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[3]!)}"`
        : input.templates[3],
      4: input.notes[4]
        ? `${input.templates[4]} Catatan pengamatan: "${sanitizeObserverNote(input.notes[4]!)}"`
        : input.templates[4],
    },
    stimulations: generateContextualStimulations(input.notes),
    source: "fallback",
  };
}
