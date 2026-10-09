export const runtime = 'edge';
import { NextResponse } from "next/server";
import { create, generateId, remove, findWhere, findAll } from "@/lib/db";
import type {
  Batch,
  Student,
  Evaluation,
  ParentResponse,
  ReadingLevel,
  ScoreValue,
} from "@/types";

// 56 Realistic Indonesian Names (28 L, 28 P)
const DUMMY_STUDENTS_DATA = [
  // 28 LAKI-LAKI
  { full: "Ahmad Rayyan Al-Fatih", nick: "Rayyan", gender: "L", parent: "Budi Santoso", phone: "08121111001", reading: "L3", redFlag: false },
  { full: "Muhammad Bilal Pratama", nick: "Bilal", gender: "L", parent: "Hendra Pratama", phone: "08121111002", reading: "L4", redFlag: false },
  { full: "Kenzo Arsha Wijaya", nick: "Kenzo", gender: "L", parent: "Aditya Wijaya", phone: "08121111003", reading: "L2", redFlag: false },
  { full: "Rizky Dwi Kurniawan", nick: "Rizky", gender: "L", parent: "Agus Kurniawan", phone: "08121111004", reading: "L1", redFlag: true }, // RF: Speech delay
  { full: "Fatih Zhafran Maulana", nick: "Fatih", gender: "L", parent: "Maulana Malik", phone: "08121111005", reading: "L3", redFlag: false },
  { full: "Arkananta Bagas Saputra", nick: "Bagas", gender: "L", parent: "Bambang Saputra", phone: "08121111006", reading: "L4", redFlag: false },
  { full: "Alvaro Keenan Syarif", nick: "Alvaro", gender: "L", parent: "Doni Syarif", phone: "08121111007", reading: "L2", redFlag: false },
  { full: "Raffasya Evan Danendra", nick: "Evan", gender: "L", parent: "Eko Danendra", phone: "08121111008", reading: "L3", redFlag: false },
  { full: "Zayn Malik Nurhadi", nick: "Zayn", gender: "L", parent: "Farhan Nurhadi", phone: "08121111009", reading: "L1", redFlag: false },
  { full: "Gibran Rakha Al-Ghifari", nick: "Gibran", gender: "L", parent: "Gunawan Ghifari", phone: "08121111010", reading: "L4", redFlag: false },
  { full: "Haikal Mirza Ramadhan", nick: "Haikal", gender: "L", parent: "Hadi Ramadhan", phone: "08121111011", reading: "L2", redFlag: false },
  { full: "Ibrahim Altair Nugroho", nick: "Ibrahim", gender: "L", parent: "Indra Nugroho", phone: "08121111012", reading: "L3", redFlag: false },
  { full: "Kenzie Raditya Hidayat", nick: "Kenzie", gender: "L", parent: "Joko Hidayat", phone: "08121111013", reading: "L1", redFlag: true }, // RF: Tantrum
  { full: "Lutfi Danish Setiawan", nick: "Lutfi", gender: "L", parent: "Kusuma Setiawan", phone: "08121111014", reading: "L4", redFlag: false },
  { full: "Malik Akbar Firmansyah", nick: "Malik", gender: "L", parent: "Lukman Firmansyah", phone: "08121111015", reading: "L2", redFlag: false },
  { full: "Naufal Faris Zayyan", nick: "Naufal", gender: "L", parent: "Mansur Zayyan", phone: "08121111016", reading: "L3", redFlag: false },
  { full: "Omar Bachtiar Santoso", nick: "Omar", gender: "L", parent: "Nasir Santoso", phone: "08121111017", reading: "L4", redFlag: false },
  { full: "Pandu Satria Wibowo", nick: "Pandu", gender: "L", parent: "Oki Wibowo", phone: "08121111018", reading: "L2", redFlag: false },
  { full: "Qaisar Barra Al-Ayyubi", nick: "Barra", gender: "L", parent: "Prasetyo Ayyubi", phone: "08121111019", reading: "L3", redFlag: false },
  { full: "Reyhan Ghani Kusuma", nick: "Reyhan", gender: "L", parent: "Rizal Kusuma", phone: "08121111020", reading: "L1", redFlag: false },
  { full: "Sulthan Raziq Ardhani", nick: "Sulthan", gender: "L", parent: "Surya Ardhani", phone: "08121111021", reading: "L4", redFlag: false },
  { full: "Tegar Bintang Perkasa", nick: "Tegar", gender: "L", parent: "Taufik Perkasa", phone: "08121111022", reading: "L2", redFlag: false },
  { full: "Umar Hamzah Al-Khattab", nick: "Umar", gender: "L", parent: "Usman Khattab", phone: "08121111023", reading: "L3", redFlag: false },
  { full: "Vino Aryasuta Wardhana", nick: "Vino", gender: "L", parent: "Wahyu Wardhana", phone: "08121111024", reading: "L1", redFlag: true }, // RF: Hipotonia
  { full: "Wisnu Cakra Buana", nick: "Wisnu", gender: "L", parent: "Yanto Buana", phone: "08121111025", reading: "L3", redFlag: false },
  { full: "Yusuf Daniswara Putra", nick: "Yusuf", gender: "L", parent: "Zainal Putra", phone: "08121111026", reading: "L2", redFlag: false },
  { full: "Zhafran Rayhan Al-Faris", nick: "Zhafran", gender: "L", parent: "Arif Al-Faris", phone: "08121111027", reading: "L4", redFlag: false },
  { full: "Athar Rizwan Mahendra", nick: "Athar", gender: "L", parent: "Bagus Mahendra", phone: "08121111028", reading: "L3", redFlag: false },

  // 28 PEREMPUAN
  { full: "Aisyah Humaira Zahra", nick: "Aisyah", gender: "P", parent: "Chandra Wijaya", phone: "08121111029", reading: "L4", redFlag: false },
  { full: "Bilqis Anindya Putri", nick: "Bilqis", gender: "P", parent: "Dedi Supriyadi", phone: "08121111030", reading: "L3", redFlag: false },
  { full: "Clarissa Naura Salsabila", nick: "Naura", gender: "P", parent: "Eka Darmawan", phone: "08121111031", reading: "L2", redFlag: false },
  { full: "Dania Khansa Az-Zahra", nick: "Khansa", gender: "P", parent: "Fajar Sidik", phone: "08121111032", reading: "L1", redFlag: false },
  { full: "Elvina Zahra Mahardika", nick: "Elvina", gender: "P", parent: "Gatot Mahardika", phone: "08121111033", reading: "L4", redFlag: false },
  { full: "Fadhilah Nur Azizah", nick: "Azizah", gender: "P", parent: "Haris Fadli", phone: "08121111034", reading: "L3", redFlag: false },
  { full: "Ghaida Safira Kirana", nick: "Safira", gender: "P", parent: "Irfan Hakim", phone: "08121111035", reading: "L2", redFlag: false },
  { full: "Hafizhah Syifa Al-Husna", nick: "Syifa", gender: "P", parent: "Jamaluddin", phone: "08121111036", reading: "L1", redFlag: true }, // RF: Meltdown
  { full: "Inara Qalesya Maharani", nick: "Inara", gender: "P", parent: "Kurnia Sandi", phone: "08121111037", reading: "L4", redFlag: false },
  { full: "Jihan Talita Ulfa", nick: "Jihan", gender: "P", parent: "Lukman Hakim", phone: "08121111038", reading: "L3", redFlag: false },
  { full: "Kayla Nadira Hasyim", nick: "Kayla", gender: "P", parent: "Mansyur Hasyim", phone: "08121111039", reading: "L2", redFlag: false },
  { full: "Latisha Amira Shakila", nick: "Amira", gender: "P", parent: "Novan Susilo", phone: "08121111040", reading: "L3", redFlag: false },
  { full: "Medina Zivanna Putri", nick: "Zivanna", gender: "P", parent: "Oki Saputra", phone: "08121111041", reading: "L4", redFlag: false },
  { full: "Nabila Raisya Pramudita", nick: "Nabila", gender: "P", parent: "Panji Pramudita", phone: "08121111042", reading: "L2", redFlag: false },
  { full: "Olivia Syakira Azzahra", nick: "Syakira", gender: "P", parent: "Qomarudin", phone: "08121111043", reading: "L1", redFlag: false },
  { full: "Putri Amanda Kirana", nick: "Amanda", gender: "P", parent: "Rudi Hartono", phone: "08121111044", reading: "L3", redFlag: false },
  { full: "Queenara Alesha Fathina", nick: "Alesha", gender: "P", parent: "Satrio Utomo", phone: "08121111045", reading: "L4", redFlag: false },
  { full: "Rania Dania Khairunnisa", nick: "Rania", gender: "P", parent: "Taufiq Hidayat", phone: "08121111046", reading: "L2", redFlag: false },
  { full: "Salma Alifah Nuraini", nick: "Salma", gender: "P", parent: "Untung Subagyo", phone: "08121111047", reading: "L3", redFlag: false },
  { full: "Tazkia Aulia Rahma", nick: "Tazkia", gender: "P", parent: "Vicky Prasetyo", phone: "08121111048", reading: "L1", redFlag: true }, // RF: Extreme withdrawal
  { full: "Ulyana Jasmine Kinanti", nick: "Jasmine", gender: "P", parent: "Wawan Hermawan", phone: "08121111049", reading: "L4", redFlag: false },
  { full: "Vanya Felicia Anindita", nick: "Vanya", gender: "P", parent: "Yoga Pratama", phone: "08121111050", reading: "L2", redFlag: false },
  { full: "Wafiqah Zulaikha Hasan", nick: "Wafiqah", gender: "P", parent: "Zulham Hasan", phone: "08121111051", reading: "L3", redFlag: false },
  { full: "Yasmin Alena Syahira", nick: "Yasmin", gender: "P", parent: "Agung Gunawan", phone: "08121111052", reading: "L2", redFlag: false },
  { full: "Zahira Maryam Fadhila", nick: "Maryam", gender: "P", parent: "Bima Arya", phone: "08121111053", reading: "L4", redFlag: false },
  { full: "Adreena Shakila Utami", nick: "Adreena", gender: "P", parent: "Cecep Supriatna", phone: "08121111054", reading: "L3", redFlag: false },
  { full: "Belvania Calista Putri", nick: "Calista", gender: "P", parent: "Dody Kurniawan", phone: "08121111055", reading: "L2", redFlag: false },
  { full: "Cynthia Dara Puspita", nick: "Dara", gender: "P", parent: "Erwin Santoso", phone: "08121111056", reading: "L3", redFlag: false },
];

export async function POST() {
  try {
    // 1. Create or Find Active Batch
    const batchName = "Batch 1 (TP 2026/2027, 56 Siswa)";
    let batch = findWhere<Batch>("batches", (b) => b.batch_name === batchName)[0];

    const now = new Date().toISOString();

    if (!batch) {
      batch = create<Batch>("batches", {
        id: generateId(),
        batch_name: batchName,
        batch_date: "2026-10-20",
        status: "active",
        notes: "Target 56 Calon Siswa (Kelas 1A @ 28 & Kelas 1B @ 28)",
        created_by: "system-seed",
        created_at: now,
        updated_at: now,
      });
    }

    // 2. Clear old students in this batch if re-seeding
    const oldStudents = findWhere<Student>("students", (s) => s.batch_id === batch.id);
    for (const old of oldStudents) {
      remove("students", old.id);
      // clean evaluations
      const evs = findWhere<Evaluation>("evaluations", (e) => e.student_id === old.id);
      evs.forEach((e) => remove("evaluations", e.id));
      // clean parent responses
      const prs = findWhere<ParentResponse>("parent_responses", (p) => p.student_id === old.id);
      prs.forEach((p) => remove("parent_responses", p.id));
    }

    const createdStudents: Student[] = [];

    // 3. Populate 56 Students with Complete 5 Pos Evaluations
    for (let i = 0; i < DUMMY_STUDENTS_DATA.length; i++) {
      const item = DUMMY_STUDENTS_DATA[i];
      const regNo = `PPDB-2026-${String(i + 1).padStart(3, "0")}`;

      // Birth date: staggered between Jan 2019 and Dec 2020
      const month = String((i % 12) + 1).padStart(2, "0");
      const day = String((i % 28) + 1).padStart(2, "0");
      const year = i % 2 === 0 ? "2019" : "2020";
      const birthDate = `${year}-${month}-${day}`;

      const student = create<Student>("students", {
        id: generateId(),
        registration_no: regNo,
        full_name: item.full,
        nickname: item.nick,
        birth_date: birthDate,
        gender: item.gender as "L" | "P",
        parent_name: item.parent,
        phone: item.phone,
        batch_id: batch.id,
        avatar_seed: item.nick.toLowerCase(),
        is_active: true,
        created_at: now,
        updated_at: now,
      });

      createdStudents.push(student);

      // Score profile based on reading level (higher reading tends to correlate with slightly higher overall maturity)
      const baseScore =
        item.reading === "L4" ? 3.7 : item.reading === "L3" ? 3.2 : item.reading === "L2" ? 2.8 : 2.2;

      // 4. Generate Evaluations for Pos 1 to Pos 5
      for (let pos = 1; pos <= 5; pos++) {
        // Vary scores slightly around base score
        const variance = ((i + pos) % 3) * 0.2 - 0.1;
        const targetPosAvg = Math.max(1.5, Math.min(4.0, baseScore + variance));
        const roundScore = (targetPosAvg > 3.4 ? 4 : targetPosAvg > 2.6 ? 3 : targetPosAvg > 1.8 ? 2 : 1) as ScoreValue;

        const scoresMap: Record<string, ScoreValue> = {};
        if (pos === 1) {
          scoresMap["1.1"] = roundScore;
          scoresMap["1.2"] = roundScore;
          scoresMap["1.3"] = roundScore;
        } else if (pos === 2) {
          scoresMap["2.1"] = roundScore;
          scoresMap["2.2"] = roundScore;
        } else if (pos === 3) {
          scoresMap["3.1"] = roundScore;
          scoresMap["3.2"] = roundScore;
        } else if (pos === 4) {
          scoresMap["4.1"] = roundScore;
          scoresMap["4.2"] = roundScore;
          scoresMap["4.3"] = roundScore;
        } else if (pos === 5) {
          scoresMap["5.1"] = roundScore;
          scoresMap["5.2"] = roundScore;
        }

        const isRfPos = (pos === 4 && item.redFlag && i % 3 === 0) ||
                        (pos === 1 && item.redFlag && i % 3 === 1) ||
                        (pos === 5 && item.redFlag && i % 3 === 2);

        const redFlagsMap: Record<string, boolean> = {};
        if (isRfPos) {
          redFlagsMap[`rf-${pos}-1`] = true;
        }

        const anecdotalMap: Record<number, string> = {
          1: "Anak berpisah dengan tenang dan langsung meletakkan sepatu di rak.",
          2: "Koordinasi motorik lincah, tangkapan bola dua tangan tepat sasaran.",
          3: "Cepat mengenali pola warna balok dan menyelesaikan puzzle 9 keping.",
          4: `Observasi literasi: pengenalan level ${item.reading}. Menyimak cerita dengan baik.`,
          5: "Bermain lego bersama teman kelompok tanpa berebut mainan.",
        };

        const totalScore = Number(targetPosAvg.toFixed(2));

        create<Evaluation>("evaluations", {
          id: generateId(),
          student_id: student.id,
          batch_id: batch.id,
          pos_number: pos,
          evaluator_id: "evaluator-seed",
          config_id: `config-pos-${pos}-v1`,
          scores_json: JSON.stringify(scoresMap),
          reading_level: pos === 4 ? (item.reading as ReadingLevel) : null,
          red_flags_json: JSON.stringify(redFlagsMap),
          has_red_flag: isRfPos,
          anecdotal_note: anecdotalMap[pos] || null,
          total_score: totalScore,
          is_complete: true,
          client_id: generateId(),
          synced_at: now,
          created_at: now,
          updated_at: now,
        });
      }

      // 5. Parent Questionnaire Response
      create<ParentResponse>("parent_responses", {
        id: generateId(),
        student_id: student.id,
        batch_id: batch.id,
        responses_json: JSON.stringify({
          q1: i % 2 === 0 ? "TK 2 tahun (A & B)" : "PAUD + TK lengkap",
          q2: item.redFlag ? "Kadang menangis" : "Mandiri dan antusias",
          q3: "Mandiri sepenuhnya",
          q4: item.redFlag ? "Pernah speech therapy" : "Tidak ada",
          q5: item.reading === "L4" ? "> 20 menit" : "10–20 menit",
        }),
        submitted_at: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil membuat 56 dataset calon siswa realistis dengan evaluasi lengkap 5 Pos.",
      data: {
        batchId: batch.id,
        batchName: batch.batch_name,
        totalStudents: createdStudents.length,
        males: createdStudents.filter((s) => s.gender === "L").length,
        females: createdStudents.filter((s) => s.gender === "P").length,
        redFlagsCount: DUMMY_STUDENTS_DATA.filter((s) => s.redFlag).length,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Gagal memproses seeding dataset" },
      { status: 500 }
    );
  }
}

