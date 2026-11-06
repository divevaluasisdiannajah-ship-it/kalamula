/**
 * SIAP SEKOLAH — In-Memory Database Store
 * 
 * Development-only mock database. Will be replaced with
 * Supabase (PostgreSQL) or Cloudflare D1 (SQLite) in production.
 * 
 * Provides a unified CRUD interface matching the SQL schema.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  User,
  Batch,
  Student,
  AssessmentConfig,
  Evaluation,
  ClassPlacement,
  ParentResponse,
} from "@/types";

// ─── Store Type ────────────────────────────────────────────────

type CollectionName =
  | "users"
  | "batches"
  | "students"
  | "assessment_configs"
  | "evaluations"
  | "class_placements"
  | "parent_responses";

interface Store {
  users: Map<string, User>;
  batches: Map<string, Batch>;
  students: Map<string, Student>;
  assessment_configs: Map<string, AssessmentConfig>;
  evaluations: Map<string, Evaluation>;
  class_placements: Map<string, ClassPlacement>;
  parent_responses: Map<string, ParentResponse>;
}

// ─── Singleton Store ───────────────────────────────────────────

let store: Store | null = null;

function initStore(): Store {
  const s: Store = {
    users: new Map(),
    batches: new Map(),
    students: new Map(),
    assessment_configs: new Map(),
    evaluations: new Map(),
    class_placements: new Map(),
    parent_responses: new Map(),
  };

  // Seed default admin user
  const adminId = uuidv4();
  s.users.set(adminId, {
    id: adminId,
    name: "Admin PPDB",
    role: "admin",
    pin_hash: "$2b$10$defaulthashforadminpin1234", // PIN: 1234
    pos_number: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed evaluator users (Super Observers & Station Evaluators)
  const evaluatorProfiles = [
    { name: "Super Observer 1", pos: 1, pinSuffix: "1000" },
    { name: "Super Observer 2", pos: 1, pinSuffix: "1001" },
    { name: "Evaluator Motorik Kasar & Koordinasi Fisik", pos: 2, pinSuffix: "2000" },
    { name: "Evaluator Kematangan Kognitif & Berhitung", pos: 3, pinSuffix: "3000" },
    { name: "Evaluator Bahasa Lisan, Pra-Literasi & Motorik Halus", pos: 4, pinSuffix: "4000" },
  ];

  for (const ep of evaluatorProfiles) {
    const evalId = uuidv4();
    s.users.set(evalId, {
      id: evalId,
      name: ep.name,
      role: "evaluator",
      pin_hash: `$2b$10$defaulthashforevalpin${ep.pinSuffix}`,
      pos_number: ep.pos,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Seed teacher user
  const teacherId = uuidv4();
  s.users.set(teacherId, {
    id: teacherId,
    name: "Guru Kelas 1",
    role: "teacher",
    pin_hash: "$2b$10$defaulthashforteacherpin5678", // PIN: 5678
    pos_number: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed assessment configs (4 Pos Fungsional SPMB)
  seedAssessmentConfigs(s);

  // Seed demo batch, students, and evaluations for immediate usability
  seedDemoBatchAndStudents(s);

  return s;
}

function seedAssessmentConfigs(s: Store) {
  const configs: Omit<AssessmentConfig, "created_by">[] = [
    {
      id: "config-so-v1",
      version: "3.0.0",
      pos_number: 1,
      pos_name: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
      pos_description: "Observasi longitudinal Super Observer dari titik awal kedatangan, transisi rotasi 3 pos, hingga snack break dan bermain bebas.",
      indicators_json: JSON.stringify([
        { id: "SO-01", label: "Kemandirian Berpisah dari Orang Tua", description: "Berpisah dari orang tua dengan tenang tanpa kecemasan berlebihan saat memasuki gerbang/titik awal observasi.", foundation: 3, score_descriptors: { "1": "Menangis histeris / menolak keras ditinggal / harus didampingi orang tua masuk ruangan.", "2": "Sempat cemas/menangis sesaat, namun mau berpisah dan masuk setelah dibujuk pengamat.", "3": "Berpisah dengan tenang, ceria, mandiri, dan langsung antusias menyapa guru pendamping." } },
        { id: "SO-02", label: "Kemandirian Menaruh Barang Pribadi", description: "Mandiri melepaskan dan merapikan sepatu di rak serta menggantung tas pada loker/tempat yang disediakan.", foundation: 5, score_descriptors: { "1": "Barang pribadi ditinggal berserakan di lantai / butuh bantuan fisik penuh dari guru.", "2": "Merapikan sepatu di rak dan menggantung tas dengan sedikit arahan verbal/pengingat.", "3": "Spontan dan tertib membuka serta meletakkan sepatu di rak dan menaruh tas secara mandiri." } },
        { id: "SO-03", label: "Kepatuhan Mengikuti Instruksi saat Transisi", description: "Mengikuti instruksi pendamping dengan tertib saat berpindah antar ruang pos observasi.", foundation: 2, score_descriptors: { "1": "Mengabaikan instruksi, berlarian keluar barisan, atau menolak berpindah pos.", "2": "Mengikuti transisi kelompok, sesekali perlu diingatkan untuk tetap tertib di barisan.", "3": "Sangat tertib, fokus, berjalan tenang bersama kelompok, dan tanggap terhadap aba-aba pendamping." } },
        { id: "SO-04", label: "Kesantunan dan Budaya Antre", description: "Menggunakan kata santun (tolong, maaf, terima kasih) dan memiliki kesabaran menunggu giliran antrean.", foundation: 1, score_descriptors: { "1": "Menyerobot antrean teman / tidak sabar menunggu giliran / bersikap agresif saat menunggu.", "2": "Mau mengantre tertib dan berucap santun jika diingatkan atau dicontohkan guru.", "3": "Konsisten sabar menunggu giliran dan spontan berucap tolong, maaf, serta terima kasih." } },
        { id: "SO-05", label: "Regulasi Diri & Adaptasi Kesulitan", description: "Kemampuan menenangkan diri, mengendalikan emosi, dan bangkit kembali saat menghadapi kesulitan atau tantangan.", foundation: 3, score_descriptors: { "1": "Tantrum / menangis keras / melempar benda / mogok saat mengalami kesulitan kecil.", "2": "Sempat merasa kesal atau frustrasi, namun mampu tenang kembali setelah ditenangkan guru.", "3": "Tenang, sabar, gigih mencoba kembali, dan mampu meregulasi emosi diri secara mandiri." } },
        { id: "SO-06", label: "Bermain Kooperatif & Berbagi", description: "Interaksi saat bermain bersama teman, kesediaan berbagi alat mainan/snack, dan dinamika sosial kelompok.", foundation: 2, score_descriptors: { "1": "Menolak interaksi sama sekali / merebut alat main teman secara paksa / memukul/mendorong.", "2": "Bermain paralel di samping teman atau mau bergantian mainan jika difasilitasi oleh guru.", "3": "Aktif berinteraksi positif, kooperatif, berinisiatif mengajak teman bermain, dan senang berbagi." } },
        { id: "SO-07", label: "Antusiasme & Refleksi Belajar", description: "Menunjukkan rasa ingin tahu positif, keceriaan belajar, dan mampu merefleksikan pengalaman belajarnya.", foundation: 6, score_descriptors: { "1": "Sangat tertekan, pasif total, tidak menunjukkan minat, atau menolak seluruh aktivitas.", "2": "Mengikuti alur kegiatan dengan baik jika diberikan dorongan semangat sesekali.", "3": "Sangat antusias, ceria, aktif bertanya, dan bangga menceritakan kembali pengalamannya." } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-so-1", label: "Tantrum histeris melantai (>10 menit) tanpa respon bujukan", severity: "critical" },
        { id: "rf-so-2", label: "Agresi fisik membahayakan (memukul, menggigit, atau menendang teman/guru)", severity: "critical" },
        { id: "rf-so-3", label: "Perilaku impulsif berbahaya (berlari mendadak keluar area aman sekolah)", severity: "critical" },
        { id: "rf-so-4", label: "Penolakan sosial ekstrem (menolak disapa sama sekali / kontak mata absen total)", severity: "critical" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "config-mk-v1",
      version: "3.0.0",
      pos_number: 2,
      pos_name: "Pos Motorik Kasar & Koordinasi Fisik",
      pos_description: "Keseimbangan statis & dinamis, kontrol tubuh saat meniti papan titian, lompat 2 kaki bersamaan, ketangkasan tangkap-lempar bola, dan mobilitas fisik.",
      indicators_json: JSON.stringify([
        { id: "MK-01", label: "Keseimbangan & Kontrol Tubuh", description: "Berjalan lurus pada garis, meniti papan titian kayu, dan melompat 2 kaki bersamaan secara seimbang.", foundation: 5, score_descriptors: { "1": "Menolak melangkah di titian / hilang keseimbangan total (harus dipegangi erat sepanjang titian).", "2": "Mampu meniti titian atau melompat dengan bantuan minimal (sentuhan 1 jari / sesekali goyah).", "3": "Lincah, seimbang sempurna di titian, dan melompat 2 kaki mandiri dengan percaya diri dan mendarat stabil." } },
        { id: "MK-02", label: "Koordinasi Mata-Tangan & Respons Gerak", description: "Merespons instruksi gerak verbal pemandu dan ketangkasan koordinasi tangkap-lempar bola dari jarak 1,5 meter.", foundation: 5, score_descriptors: { "1": "Tidak merespons instruksi gerak / luput total menangkap bola (bola selalu jatuh ke lantai).", "2": "Respons gerakan agak lambat, berhasil menangkap/melempar bola setelah 1–2 kali percobaan dibimbing.", "3": "Respons tanggap dan gesit, menangkap bola 2 tangan secara akurat dan melempar kembali dengan presisi." } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-mk-1", label: "Tonus otot kaku ekstrem (hipertonia) atau sangat lemas tanpa daya (hipotonia)", severity: "critical" },
        { id: "rf-mk-2", label: "Sering terjatuh tanpa hambatan fisik jelas / kehilangan keseimbangan vestibular berat", severity: "moderate" },
        { id: "rf-mk-3", label: "Ketidakmampuan melompat 2 kaki lepas dari permukaan lantai pada usia > 6 tahun", severity: "critical" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "config-kg-v1",
      version: "3.0.0",
      pos_number: 3,
      pos_name: "Pos Kematangan Kognitif & Berhitung",
      pos_description: "Kemampuan berpikir logis, klasifikasi objek berdasarkan atribut warna/bentuk/ukuran, kelanjutan pola deret berulang, konsep kuantitas konkrit, dan pemecahan masalah balok/puzzle.",
      indicators_json: JSON.stringify([
        { id: "KG-01", label: "Klasifikasi Objek & Pola Berulang", description: "Mengelompokkan benda berdasarkan atribut tertentu (warna/bentuk/fungsi) dan melengkapi pola deret yang teratur.", foundation: 4, score_descriptors: { "1": "Belum mampu memilah benda atau melanjutkan pola deret sederhana walaupun telah dicontohkan.", "2": "Mampu mengelompokkan 1 atribut atau melengkapi pola deret sederhana (AB-AB) setelah dipandu contoh.", "3": "Mandiri dan tepat memilah multi-atribut serta melanjutkan pola deret kompleks (ABC-ABC / AABB)." } },
        { id: "KG-02", label: "Konsep Kuantitas & Problem Solving", description: "Memahami perbandingan banyak vs sedikit, membilang benda konkret 1–10, dan menyelesaikan tantangan puzzle/balok.", foundation: 4, score_descriptors: { "1": "Belum memahami konsep banyak-sedikit / bingung membilang konkret (1–5) / puzzle dibiarkan acak.", "2": "Mampu membandingkan kuantitas & menyelesaikan puzzle dasar dengan sedikit petunjuk arahan.", "3": "Pemahaman kuantitas kuat, membilang tepat satu-ke-satu, dan solutif merangkai balok/puzzle secara tuntas." } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-kg-1", label: "Disorientasi spasial berat / tidak mengenal bentuk dan arah dasar sama sekali", severity: "moderate" },
        { id: "rf-kg-2", label: "Tidak memahami hubungan kausalitas (sebab-akibat) sederhana dalam percakapan sehari-hari", severity: "moderate" },
        { id: "rf-kg-3", label: "Ketidakmampuan membedakan ukuran kontras (besar vs kecil sekali) secara visual", severity: "moderate" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "config-bl-v1",
      version: "3.0.0",
      pos_number: 4,
      pos_name: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
      pos_description: "Kemampuan menyimak cerita lisan (read-aloud), menjawab pertanyaan alur, keberanian komunikasi verbal mengutarakan ide, kontrol pensil dan genggaman jemari (tripod grasp), serta pemetaan 4 tingkat literasi membaca.",
      indicators_json: JSON.stringify([
        { id: "BL-01", label: "Menyimak Cerita Lisan (Read-Aloud)", description: "Menyimak cerita lisan yang dibacakan guru dan memahami pesan moral serta alur kejadian sederhana.", foundation: 2, score_descriptors: { "1": "Tidak memperhatikan cerita, mudah terdistraksi total / tidak mampu menjawab pertanyaan tentang isi cerita.", "2": "Menyimak cerita sebagian, mampu menjawab pertanyaan jika dibantu dengan pertanyaan pemancing.", "3": "Menyimak dengan fokus penuh, memahami alur cerita, dan mampu menceritakan kembali intisarinya dengan runtut." } },
        { id: "BL-02", label: "Komunikasi Gagasan Lisan", description: "Mengomunikasikan gagasan lisan tentang ide, gambar, atau karyanya dengan kalimat sederhana yang terstruktur.", foundation: 2, score_descriptors: { "1": "Menolak berbicara sama sekali / suara sangat lirih tak terdengar / berbicara dengan kata tanpa makna.", "2": "Menjawab hanya dengan frasa pendek 1–2 kata, masih butuh dorongan untuk berbicara lebih lanjut.", "3": "Berani, lancar, dan percaya diri mengutarakan gagasan dengan struktur kalimat sederhana yang jelas." } },
        { id: "BL-03", label: "Kontrol Motorik Halus & Tripod Grasp", description: "Kontrol jemari tangan dan posisi genggaman pensil fungsional (tripod grasp) saat menulis, menarik garis, atau menggambar.", foundation: 5, score_descriptors: { "1": "Genggaman tinju penuh (palmar grasp) kaku tanpa kontrol jemari / tidak dapat memegang alat tulis.", "2": "Genggaman peralihan (pincer / 4 jari), goresan garis pada kertas masih agak kaku dan bergetar.", "3": "Dynamic tripod grasp fungsional mantap (ibu jari, telunjuk, jari tengah), goresan luwes dan terkontrol." } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-bl-1", label: "Bicara tidak dapat dipahami sama sekali oleh orang dewasa (speech delay berat)", severity: "critical" },
        { id: "rf-bl-2", label: "Ekolalia — hanya mengulang kata yang diucapkan guru tanpa makna kontekstual", severity: "critical" },
        { id: "rf-bl-3", label: "Tremor jemari tangan ekstrem / otot tangan sangat lemah sehingga pensil selalu terjatuh", severity: "moderate" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const config of configs) {
    s.assessment_configs.set(config.id, config as AssessmentConfig);
  }
}

function seedDemoBatchAndStudents(s: Store) {
  const batchId = "batch-demo-1";
  const now = new Date().toISOString();

  // 1. Batch
  s.batches.set(batchId, {
    id: batchId,
    batch_name: "Gelombang 1 — PPDB 2026/2027",
    batch_date: "2026-10-06",
    status: "active",
    notes: "Observasi Gelombang Pembuka Fase A Kelas 1 SD Islam An Najah",
    created_by: "system",
    created_at: now,
    updated_at: now,
  });

  // 2. Demo Students
  const demoStudents = [
    { id: "std-1", reg: "REG-2026-001", name: "Muhammad Al-Fatih Pratama", nick: "Fatih", gender: "L" as const, birth: "2020-03-15", parent: "dr. Hendra Pratama", phone: "081234567890", level: "L4" as const, redFlag: false, p1: 4.0, p2: 3.5, p3: 4.0, p4: 4.0, p5: 3.8, class: "1A" as const, group: "Kelompok 1", note: "Sangat percaya diri, membaca lancar dan senang memimpin baris antrean." },
    { id: "std-2", reg: "REG-2026-002", name: "Aisyah Putri Rahmadani", nick: "Aisyah", gender: "P" as const, birth: "2020-05-20", parent: "Rahmat Hidayat", phone: "081298765432", level: "L3" as const, redFlag: false, p1: 3.8, p2: 3.6, p3: 3.5, p4: 3.5, p5: 4.0, class: "1A" as const, group: "Kelompok 1", note: "Mampu membaca suku kata dengan mandiri, sangat ramah pada teman sebaya." },
    { id: "std-3", reg: "REG-2026-003", name: "Rayhan Alvaro Zikri", nick: "Rayhan", gender: "L" as const, birth: "2020-02-10", parent: "Budi Santoso", phone: "081311223344", level: "L2" as const, redFlag: false, p1: 3.2, p2: 3.8, p3: 3.0, p4: 2.8, p5: 3.5, class: "1B" as const, group: "Kelompok 2", note: "Mengenal bunyi fonem dasar, fisik sangat lincah dan antusias melompat." },
    { id: "std-4", reg: "REG-2026-004", name: "Khadijah Azzahra Humaira", nick: "Azza", gender: "P" as const, birth: "2020-07-08", parent: "Ahmad Fauzi", phone: "081355667788", level: "L1" as const, redFlag: false, p1: 3.0, p2: 3.0, p3: 2.8, p4: 2.5, p5: 3.2, class: "1B" as const, group: "Kelompok 2", note: "Mengenal simbol gambar visual, perlu stimulasi fonik dan motorik pensil di kelas." },
    { id: "std-5", reg: "REG-2026-005", name: "Kenzo Arshaka Wijaya", nick: "Kenzo", gender: "L" as const, birth: "2020-08-12", parent: "Doni Wijaya", phone: "081277889900", level: "L1" as const, redFlag: true, p1: 1.8, p2: 2.5, p3: 2.2, p4: 2.0, p5: 2.0, class: "1A" as const, group: "Kelompok 3", note: "Sensitif terhadap suara keras dan sempat tantrum saat berpisah. Butuh calm-down corner ramah anak." },
    { id: "std-6", reg: "REG-2026-006", name: "Maryam Salsabila Zahra", nick: "Maryam", gender: "P" as const, birth: "2020-04-02", parent: "Irfan Hakim", phone: "081233445566", level: "L3" as const, redFlag: false, p1: 3.5, p2: 3.2, p3: 3.5, p4: 3.6, p5: 3.7, class: "1B" as const, group: "Kelompok 3", note: "Mandiri merapikan sepatu dan tas, membaca kata bermakna dengan artikulasi jelas." },
    { id: "std-7", reg: "REG-2026-007", name: "Bilal Ramadhan Al-Ghifari", nick: "Bilal", gender: "L" as const, birth: "2020-09-18", parent: "Yusuf Mansur", phone: "081399887766", level: "L2" as const, redFlag: false, p1: 3.0, p2: 3.7, p3: 3.1, p4: 2.7, p5: 3.4, class: "1A" as const, group: "Kelompok 1", note: "Fokus mendengarkan cerita, menyusun balok bersama teman dengan tertib." },
    { id: "std-8", reg: "REG-2026-008", name: "Zhafira Nurul Izzah", nick: "Zhafira", gender: "P" as const, birth: "2020-01-25", parent: "dr. Fitriani", phone: "081222334455", level: "L4" as const, redFlag: false, p1: 4.0, p2: 3.8, p3: 3.9, p4: 4.0, p5: 4.0, class: "1B" as const, group: "Kelompok 2", note: "Kemandirian dan kematangan emosi sangat matang, membaca lancar penuh ekspresi." },
  ];

  for (const item of demoStudents) {
    s.students.set(item.id, {
      id: item.id,
      registration_no: item.reg,
      full_name: item.name,
      nickname: item.nick,
      birth_date: item.birth,
      gender: item.gender,
      parent_name: item.parent,
      phone: item.phone,
      batch_id: batchId,
      observation_group: item.group,
      avatar_seed: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // Class Placement
    s.class_placements.set(`cp-${item.id}`, {
      id: `cp-${item.id}`,
      student_id: item.id,
      batch_id: batchId,
      assigned_class: item.class,
      algorithm_version: "v1.0",
      balance_score: 0.95,
      manual_override: false,
      override_by: null,
      override_reason: null,
      override_at: null,
      assigned_at: now,
      updated_at: now,
    });

    // Evaluations for 4 Domain Pos (Pos 1 Superobserver, Pos 2 Motorik, Pos 3 Kognitif, Pos 4 Bahasa)
    const posScores = [
      Number(((item.p1 + item.p5) / 2).toFixed(2)), // Combined Superobserver score (eks Pos 1 & 5)
      item.p2, // Motorik Kasar
      item.p3, // Kognitif
      item.p4, // Bahasa Lisan & Motorik Halus
    ];

    const configIds = ["config-so-v1", "config-mk-v1", "config-kg-v1", "config-bl-v1"];

    for (let pos = 1; pos <= 4; pos++) {
      const evalId = `eval-${item.id}-pos-${pos}`;
      const scoreVal = posScores[pos - 1];
      const isPos4 = pos === 4;
      const isRedFlagPos = item.redFlag && pos === 1;

      let scoresRecord: Record<string, number> = {};
      if (pos === 1) {
        scoresRecord = {
          "SO-01": Math.round(item.p1),
          "SO-02": Math.round(item.p1),
          "SO-03": Math.round((item.p1 + item.p5) / 2),
          "SO-04": Math.round(item.p1),
          "SO-05": Math.round(item.p5),
          "SO-06": Math.round(item.p5),
          "SO-07": Math.round(item.p5),
        };
      } else if (pos === 2) {
        scoresRecord = { "MK-01": Math.round(scoreVal), "MK-02": Math.round(scoreVal) };
      } else if (pos === 3) {
        scoresRecord = { "KG-01": Math.round(scoreVal), "KG-02": Math.round(scoreVal) };
      } else if (pos === 4) {
        scoresRecord = { "BL-01": Math.round(scoreVal), "BL-02": Math.round(scoreVal), "BL-03": Math.round(scoreVal) };
      }

      s.evaluations.set(evalId, {
        id: evalId,
        student_id: item.id,
        batch_id: batchId,
        pos_number: pos,
        evaluator_id: `evaluator-${pos}`,
        config_id: configIds[pos - 1],
        scores_json: JSON.stringify(scoresRecord),
        reading_level: isPos4 ? item.level : null,
        red_flags_json: isRedFlagPos ? JSON.stringify({ "rf-so-1": true }) : "{}",
        has_red_flag: isRedFlagPos,
        anecdotal_note: pos === 1 ? item.note : `Aktivitas di stasiun observasi berjalan tertib dan mandiri.`,
        total_score: scoreVal,
        is_complete: true,
        client_id: `client-${item.id}-${pos}`,
        synced_at: now,
        created_at: now,
        updated_at: now,
      });
    }
  }
}

// ─── Get Store Instance ────────────────────────────────────────

export function getDB(): Store {
  if (!store) {
    store = initStore();
  }
  return store;
}

// ─── Generic CRUD Functions ────────────────────────────────────

export function generateId(): string {
  return uuidv4();
}

export function findAll<T>(collection: CollectionName): T[] {
  const db = getDB();
  return Array.from((db[collection] as unknown as Map<string, T>).values());
}

export function findById<T>(collection: CollectionName, id: string): T | undefined {
  const db = getDB();
  return (db[collection] as unknown as Map<string, T>).get(id);
}

export function findWhere<T>(collection: CollectionName, predicate: (item: T) => boolean): T[] {
  return findAll<T>(collection).filter(predicate);
}

export function findOne<T>(collection: CollectionName, predicate: (item: T) => boolean): T | undefined {
  return findAll<T>(collection).find(predicate);
}

export function create<T extends { id: string }>(collection: CollectionName, data: T): T {
  const db = getDB();
  (db[collection] as unknown as Map<string, T>).set(data.id, data);
  return data;
}

export function update<T extends { id: string }>(
  collection: CollectionName,
  id: string,
  updates: Partial<T>
): T | undefined {
  const db = getDB();
  const map = db[collection] as unknown as Map<string, T>;
  const existing = map.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() } as T;
  map.set(id, updated);
  return updated;
}

export function remove(collection: CollectionName, id: string): boolean {
  const db = getDB();
  return (db[collection] as Map<string, unknown>).delete(id);
}

export function count(collection: CollectionName): number {
  const db = getDB();
  return (db[collection] as Map<string, unknown>).size;
}
