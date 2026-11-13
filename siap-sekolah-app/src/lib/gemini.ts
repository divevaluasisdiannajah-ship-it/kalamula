/**
 * SIAP SEKOLAH — Gemini Generative AI Synthesizer
 *
 * Synthesizes rubrics milestone templates + authentic observer field notes
 * into constructive, parent-friendly narratives and home stimulation advice.
 */

import { getRequestContext } from "@cloudflare/next-on-pages";

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
    const ctx = getRequestContext();
    if ((ctx?.env as any)?.GEMINI_API_KEY) {
      return String((ctx.env as any).GEMINI_API_KEY).trim();
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
    .replace(/\bterdistrek\b/gi, "terdistraksi")
    .replace(/\bdistrek\b/gi, "terdistraksi")
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
 * Cleans and isolates observer field notes by their authentic domain.
 * Evaluators frequently copy-pasted general notes from Pos 1 or Pos 2 across all pos.
 * This helper strips out identical or cross-station text prefixes to ensure
 * each pos contains only its genuine observations.
 */
function cleanTextFromCrossStationPrefix(current: string, otherNote: string | null): string | null {
  if (!current || !otherNote) return current;
  const norm = (s: string) => (s || "").toLowerCase().replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  const stripPunct = (s: string) => norm(s).replace(/^[\d\)\.\-\s]+/, "").replace(/[\.?!,;:\-\s]+$/, "").trim();

  const otherClean = otherNote.trim();
  const otherNorm = stripPunct(otherClean);

  if (stripPunct(current) === otherNorm) {
    return null;
  }

  const otherPrefix = otherNorm.slice(0, 30);
  if (otherPrefix.length < 15) return current;

  // Case 1: Multiple paragraphs separated by newlines
  const paragraphs = current.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    const kept = paragraphs.filter((p) => !stripPunct(p).includes(otherPrefix));
    if (kept.length > 0) {
      return kept.join("\n\n");
    }
  }

  // Case 2: Check if current contains otherPrefix
  if (stripPunct(current).includes(otherPrefix)) {
    const sentences = current.split(/(?<=[.?!])\s+/);
    const keptSentences = sentences.filter((s) => {
      const sNorm = stripPunct(s);
      if (sNorm.length > 10 && otherNorm.includes(sNorm)) return false;
      return true;
    });
    if (keptSentences.length > 0) {
      return keptSentences.join(" ");
    }
    return null;
  }

  return current;
}

export function cleanObserverNotesByDomain(
  rawNotes: Record<number, string | null>
): Record<number, string | null> {
  const cleaned: Record<number, string | null> = {
    1: rawNotes[1]?.trim() || null,
    2: rawNotes[2]?.trim() || null,
    3: rawNotes[3]?.trim() || null,
    4: rawNotes[4]?.trim() || null,
  };

  // 1. Clean Pos 1 against Pos 2 (e.g. motor note accidentally pasted into Pos 1)
  if (cleaned[1] && cleaned[2]) {
    cleaned[1] = cleanTextFromCrossStationPrefix(cleaned[1], cleaned[2]);
    if (cleaned[1]) {
      cleaned[1] = cleaned[1].replace(/^\s*\d+[\)\.\-]\s*/, "").replace(/^[\s.,:;\-\n]+/, "").trim();
    }
  }

  // 2. Clean Pos 3 against Pos 2 and Pos 1
  if (cleaned[3]) {
    if (cleaned[2]) cleaned[3] = cleanTextFromCrossStationPrefix(cleaned[3], cleaned[2]);
    if (cleaned[3] && cleaned[1]) cleaned[3] = cleanTextFromCrossStationPrefix(cleaned[3], cleaned[1]);
  }

  // 3. Clean Pos 4 against Pos 2 and Pos 1
  if (cleaned[4]) {
    if (cleaned[2]) cleaned[4] = cleanTextFromCrossStationPrefix(cleaned[4], cleaned[2]);
    if (cleaned[4] && cleaned[1]) cleaned[4] = cleanTextFromCrossStationPrefix(cleaned[4], cleaned[1]);
  }

  // Trim and normalize remaining notes
  [1, 2, 3, 4].forEach((pos) => {
    let text = cleaned[pos];
    if (text) {
      text = text.replace(/^\s*\d+[\)\.\-]\s*/, "").replace(/^[\s.,:;\-\n]+/, "").trim();
      text = text.replace(/^(namun|tetapi|serta|dan)\s+/i, "");
      cleaned[pos] = text.trim().length > 0 ? text.trim() : null;
    }
  });

  return cleaned;
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

  // Clean and isolate notes by domain first to prevent cross-pos contamination
  const cleanedNotes = cleanObserverNotesByDomain(input.notes);

  // If no key or empty notes across all positions, return smart deterministic fallback
  const hasAnyNotes = Object.values(cleanedNotes).some(
    (n) => n && n.trim().length > 0
  );

  if (!apiKey || !hasAnyNotes) {
    return {
      narratives: {
        1: cleanedNotes[1]
          ? `${input.templates[1]} Catatan pengamatan: "${sanitizeObserverNote(cleanedNotes[1]!)}"`
          : input.templates[1],
        2: cleanedNotes[2]
          ? `${input.templates[2]} Catatan pengamatan: "${sanitizeObserverNote(cleanedNotes[2]!)}"`
          : input.templates[2],
        3: cleanedNotes[3]
          ? `${input.templates[3]} Catatan pengamatan: "${sanitizeObserverNote(cleanedNotes[3]!)}"`
          : input.templates[3],
        4: cleanedNotes[4]
          ? `${input.templates[4]} Catatan pengamatan: "${sanitizeObserverNote(cleanedNotes[4]!)}"`
          : input.templates[4],
      },
      stimulations: generateContextualStimulations(cleanedNotes),
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
ATURAN UTAMA: BATASAN DOMAIN POS KETAT (STRICT DOMAIN SEPARATION)
═══════════════════════════════════════════════════════════════════
Setiap pos adalah domain perkembangan yang BERBEDA dan MANDIRI. DILARANG KERAS mencampuradukkan aspek pos yang satu ke pos yang lain, meskipun terdapat catatan lapangan yang salah kamar:

1. POS 1 [Kemandirian & Regulasi Emosi]:
   - FOKUS HANYA: Kemandirian mengelola barang pribadi (tas/sepatu/alat tulis), toilet training, adaptasi di lingkungan baru, regulasi emosi saat berpisah dari orang tua, adab/kesantunan, budaya antre, dan interaksi kooperatif dengan teman.
   - DILARANG MEMUAT: Aspek fisik/motorik (keseimbangan badan, lari, melompat, kelincahan fisik), atau kemampuan akademik kognitif (berhitung, pola) dan membaca/hafalan surat.

2. POS 2 [Motorik Kasar & Koordinasi]:
   - FOKUS HANYA: Koordinasi fisik, keseimbangan tubuh (meniti garis/balok), kekuatan otot gerak (power), kelincahan (agility), ketangkasan menangkap bola, stabilitas tubuh, dan kontrol gerak motorik kasar.
   - DILARANG MEMUAT: Kemampuan membaca, berhitung, hafalan surat, atau pola berulang.

3. POS 3 [Kematangan Kognitif & Numerasi]:
   - FOKUS HANYA: Penalaran logika, pemecahan masalah (puzzle/balok), pola berulang (patterning), konsep kuantitas & numerasi (penjumlahan/pengurangan/banyak-sedikit), klasifikasi benda, hafalan surat Al-Quran/doa harian, serta daya konsentrasi saat menyelesaikan tugas berpikir.
   - DILARANG MEMUAT: Tes fisik/motorik (keseimbangan badan, jatuh, kelincahan gerak fisik, power otot tungkai). JIKA ADA CATATAN FISIK DI POS 3, ABAIKAN karena itu catatan motorik yang salah tempat.

4. POS 4 [Bahasa Lisan & Pra-Literasi]:
   - FOKUS HANYA: Tingkat membaca (L1-L4), pengenalan simbol huruf/suku kata/kalimat pendek, pemahaman instruksi lisan, kelancaran komunikasi dua arah, dan menceritakan kembali kejadian.
   - DILARANG MEMUAT: Aspek fisik motorik atau hafalan surat.

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
   - Jika guru observer mencatat kesulitan nyata PADA DOMAIN TERSEBUT, fakta tersebut WAJIB tercermin dalam narasi:
     * Pada Pos 2: jika dicatat "keseimbangan kurang / goyah / sering jatuh / power kurang" -> WAJIB sebutkan kendali keseimbangan tubuh ananda masih perlu terus dilatih.
     * Pada Pos 3: jika dicatat "sulit mengurutkan angka / pola berulang / ragu penjumlahan" -> WAJIB sebutkan ananda masih perlu bimbingan konkret dalam memahami urutan pola dan angka.
     * Pada Pos 4: jika dicatat "belum bisa baca / hanya kenal sedikit huruf" -> WAJIB sebutkan ananda masih dalam tahap awal simbol dan perlu latihan mengenal bentuk huruf.
     * Pada Pos 1/3: jika dicatat "mudah terdistraksi / tidak fokus saat kegiatan" -> WAJIB sebutkan daya konsentrasi ananda masih mudah teralihkan dan perlu dibiasakan memusatkan fokus.

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

Data Pos 1 (Kemandirian & Regulasi Emosi):
- Standar Capaian: ${input.templates[1] || "Mampu berpisah dari orang tua dan mulai mandiri."}
- Catatan Asli Guru: ${cleanedNotes[1] ? sanitizeObserverNote(cleanedNotes[1]!) : "Belum ada catatan khusus."}

Data Pos 2 (Motorik Kasar & Koordinasi Fisik):
- Standar Capaian: ${input.templates[2] || "Koordinasi fisik dasar berkembang sesuai usia."}
- Catatan Asli Guru: ${cleanedNotes[2] ? sanitizeObserverNote(cleanedNotes[2]!) : "Belum ada catatan khusus."}

Data Pos 3 (Kematangan Kognitif & Numerasi):
- Standar Capaian: ${input.templates[3] || "Konsep kuantitas dan logika objek konkret."}
- Catatan Asli Guru: ${cleanedNotes[3] ? sanitizeObserverNote(cleanedNotes[3]!) : "Belum ada catatan khusus."}

Data Pos 4 (Bahasa Lisan & Pra-Literasi):
- Standar Capaian: ${input.templates[4] || "Kesiapan menyimak cerita dan komunikasi gagasan."}
- Catatan Asli Guru: ${cleanedNotes[4] ? sanitizeObserverNote(cleanedNotes[4]!) : "Belum ada catatan khusus."}

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
      maxOutputTokens: 600,
    },
  };

  // Try fastest lightweight models first
  const candidateModels = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash"];

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
