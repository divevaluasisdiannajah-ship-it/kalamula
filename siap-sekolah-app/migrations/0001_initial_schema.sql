-- ============================================================
-- SIAP SEKOLAH — Database Migration v1.0.0
-- Compatible with: Supabase (PostgreSQL) / Cloudflare D1 (SQLite)
-- Note: JSONB is PostgreSQL-specific. For D1/SQLite, use TEXT.
-- ============================================================

-- ─── Extensions (Supabase/PostgreSQL only) ───────────────────
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ─── Helper: Auto-updated timestamp ──────────────────────────
-- (PostgreSQL only, skip for D1/SQLite)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';


-- ============================================================
-- TABLE: users
-- Pengguna sistem (Admin, Evaluator, Guru Kelas)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name        TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('admin', 'evaluator', 'teacher')),
    pin_hash    TEXT,                          -- bcrypt hash of 4-digit PIN
    pos_number  INTEGER CHECK(pos_number BETWEEN 1 AND 5),  -- NULL for admin/teacher
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Constraint: evaluator harus punya pos_number
-- CHECK (role != 'evaluator' OR pos_number IS NOT NULL)

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_pos  ON users(pos_number);


-- ============================================================
-- TABLE: batches
-- Gelombang / Sesi Observasi Berkala
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    batch_name  TEXT NOT NULL,                 -- e.g. "Batch 1 - Oktober 2026"
    batch_date  DATE NOT NULL,
    status      TEXT NOT NULL CHECK(status IN ('draft', 'active', 'locked')) DEFAULT 'draft',
    notes       TEXT,
    created_by  TEXT REFERENCES users(id),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_date   ON batches(batch_date);


-- ============================================================
-- TABLE: students
-- Data Calon Siswa
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    registration_no   TEXT UNIQUE NOT NULL,    -- Nomor Pendaftaran (baku)
    full_name         TEXT NOT NULL,
    nickname          TEXT NOT NULL,           -- Nama Panggilan (untuk UI evaluator)
    birth_date        DATE NOT NULL,
    gender            TEXT NOT NULL CHECK(gender IN ('L', 'P')),
    parent_name       TEXT,
    phone             TEXT,                    -- Nomor WhatsApp Orang Tua
    batch_id          TEXT REFERENCES batches(id) ON DELETE SET NULL,
    avatar_seed       TEXT,                    -- Seed untuk DiceBear avatar generatif
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_batch       ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_gender      ON students(gender);
CREATE INDEX IF NOT EXISTS idx_students_reg_no      ON students(registration_no);


-- ============================================================
-- TABLE: assessment_configs
-- Rubrik & Indikator Dinamis per Pos (Config-Driven)
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_configs (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    version         TEXT NOT NULL DEFAULT '1.0.0',
    pos_number      INTEGER NOT NULL CHECK(pos_number BETWEEN 1 AND 5),
    pos_name        TEXT NOT NULL,
    pos_description TEXT,
    -- JSON Structure: [{ id, label, description, score_descriptors: {1,2,3,4} }]
    indicators_json TEXT NOT NULL DEFAULT '[]',
    -- JSON Structure: [{ id, label, severity: 'critical'|'moderate' }]
    red_flags_json  TEXT NOT NULL DEFAULT '[]',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      TEXT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pos_number, version)
);

CREATE INDEX IF NOT EXISTS idx_configs_pos    ON assessment_configs(pos_number);
CREATE INDEX IF NOT EXISTS idx_configs_active ON assessment_configs(is_active);


-- ============================================================
-- TABLE: evaluations
-- Hasil Input Evaluator per Siswa per Pos
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    student_id      TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id        TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    pos_number      INTEGER NOT NULL CHECK(pos_number BETWEEN 1 AND 5),
    evaluator_id    TEXT NOT NULL REFERENCES users(id),
    config_id       TEXT REFERENCES assessment_configs(id),  -- snapshot rubrik yg dipakai

    -- JSON Structure: { "indicator_id": score (1-4), ... }
    scores_json     TEXT NOT NULL DEFAULT '{}',

    -- Pos 4 khusus: Reading Level
    reading_level   TEXT CHECK(reading_level IN ('L1', 'L2', 'L3', 'L4')),

    -- JSON Structure: { "red_flag_id": boolean, ... }
    red_flags_json  TEXT NOT NULL DEFAULT '{}',
    has_red_flag    BOOLEAN NOT NULL DEFAULT FALSE, -- computed/denormalized for fast query

    anecdotal_note  TEXT,
    total_score     REAL,                           -- computed average score (denormalized)
    is_complete     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Sync tracking (Offline-First PWA)
    client_id       TEXT,                           -- client-generated temp ID
    synced_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, batch_id, pos_number)        -- satu evaluasi per siswa per pos per batch
);

CREATE INDEX IF NOT EXISTS idx_eval_student   ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_eval_batch     ON evaluations(batch_id);
CREATE INDEX IF NOT EXISTS idx_eval_pos       ON evaluations(pos_number);
CREATE INDEX IF NOT EXISTS idx_eval_red_flag  ON evaluations(has_red_flag);
CREATE INDEX IF NOT EXISTS idx_eval_complete  ON evaluations(is_complete);


-- ============================================================
-- TABLE: parent_responses
-- Respon Kuesioner Orang Tua via QR Code
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_responses (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id    TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    -- JSON Structure: { "q1": "answer", "q2": "answer", ... }
    responses_json TEXT NOT NULL DEFAULT '{}',
    submitted_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student ON parent_responses(student_id);


-- ============================================================
-- TABLE: class_placements
-- Hasil Pembagian Kelas 1A & 1B (Smart Class Balancer)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_placements (
    id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    student_id        TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id          TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    assigned_class    TEXT NOT NULL CHECK(assigned_class IN ('1A', '1B')),
    algorithm_version TEXT NOT NULL DEFAULT '1.0',  -- versi algoritma yg dipakai
    balance_score     REAL,                          -- skor keseimbangan saat penempatan

    -- Manual Override
    manual_override   BOOLEAN NOT NULL DEFAULT FALSE,
    override_by       TEXT REFERENCES users(id),
    override_reason   TEXT,
    override_at       TIMESTAMP,

    assigned_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(student_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_placement_class   ON class_placements(assigned_class);
CREATE INDEX IF NOT EXISTS idx_placement_student ON class_placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_batch   ON class_placements(batch_id);


-- ============================================================
-- SEED: Default Assessment Config (Rubrik 5 Pos)
-- ============================================================
INSERT INTO assessment_configs (id, version, pos_number, pos_name, pos_description, indicators_json, red_flags_json) VALUES

-- POS 1: Kedatangan, Self-Care & Kematangan Emosi
('config-pos-1-v1', '1.0.0', 1, 'Kedatangan, Self-Care & Kematangan Emosi',
'Observasi saat anak tiba, berpisah dari orang tua, dan berinteraksi awal',
'[
  {"id":"1.1","label":"Berpisah dari orang tua","description":"Berpisah dari orang tua dengan tenang tanpa kecemasan ekstrem","score_descriptors":{"1":"Menangis histeris tidak mau ditinggal","2":"Menangis tapi mau ditinggal setelah dibujuk lama","3":"Sedikit cemas tapi mandiri masuk kelas","4":"Berpisah dengan tenang dan antusias"}},
  {"id":"1.2","label":"Kemandirian Self-Care","description":"Mandiri melepaskan dan merapikan sepatu di rak serta menggantungkan tas","score_descriptors":{"1":"Tidak bisa, sepenuhnya butuh bantuan","2":"Bisa dengan banyak bantuan verbal","3":"Bisa dengan sedikit pengingat","4":"Mandiri sempurna dan rapi"}},
  {"id":"1.3","label":"Kesantunan dan Antrean","description":"Menggunakan kata santun (tolong, terima kasih, maaf) dan budaya mengantre","score_descriptors":{"1":"Tidak menggunakan kata santun dan tidak mau mengantre","2":"Kadang menggunakan kata santun dengan pengingat","3":"Sering menggunakan kata santun secara spontan","4":"Konsisten santun dan sabar mengantre tanpa pengingat"}}
]',
'[
  {"id":"rf-1-1","label":"Tantrum histeris melantai (>10 menit)","severity":"critical"},
  {"id":"rf-1-2","label":"Panik berlebihan atau serangan panik","severity":"critical"},
  {"id":"rf-1-3","label":"Perilaku agresif membahayakan (memukul/menggigit)","severity":"critical"}
]'),

-- POS 2: Motorik Kasar & Koordinasi Fisik
('config-pos-2-v1', '1.0.0', 2, 'Motorik Kasar & Koordinasi Fisik',
'Observasi kemampuan gerak tubuh, keseimbangan, dan koordinasi mata-tangan',
'[
  {"id":"2.1","label":"Keseimbangan & Koordinasi Tubuh","description":"Berjalan lurus, meniti papan titian, melompat 2 kaki","score_descriptors":{"1":"Tidak bisa melakukan salah satu aktivitas","2":"Bisa dengan pegangan/bantuan fisik","3":"Bisa mandiri meski sedikit tidak stabil","4":"Lincah dan koordinasi sangat baik"}},
  {"id":"2.2","label":"Respons Instruksi & Koordinasi Mata-Tangan","description":"Merespons instruksi gerak verbal dan koordinasi mata-tangan (tangkap bola)","score_descriptors":{"1":"Tidak merespons instruksi, gagal tangkap bola","2":"Merespons lambat, sering gagal tangkap","3":"Merespons baik, kadang berhasil tangkap","4":"Merespons cepat dan tepat, tangkap bola konsisten"}}
]',
'[
  {"id":"rf-2-1","label":"Tonus otot kaku (hipertonia) atau sangat lemas (hipotonia)","severity":"critical"},
  {"id":"rf-2-2","label":"Sering jatuh tanpa sebab yang jelas","severity":"moderate"},
  {"id":"rf-2-3","label":"Tidak bisa melompat dengan 2 kaki","severity":"moderate"}
]'),

-- POS 3: Kematangan Kognitif & Numerasi Dasar
('config-pos-3-v1', '1.0.0', 3, 'Kematangan Kognitif & Numerasi Dasar',
'Observasi kemampuan berpikir logis, pola, perbandingan, dan pemecahan masalah',
'[
  {"id":"3.1","label":"Klasifikasi & Pola","description":"Memilah benda berdasarkan atribut dan melengkapi pola berulang","score_descriptors":{"1":"Tidak bisa memilah atau mengenali pola","2":"Bisa memilah 1 atribut dengan bantuan","3":"Bisa memilah dan lanjutkan pola sederhana","4":"Mandiri klasifikasi multi-atribut dan pola kompleks"}},
  {"id":"3.2","label":"Konsep Kuantitas & Problem Solving","description":"Memahami banyak/sedikit dan pemecahan masalah (puzzle/balok)","score_descriptors":{"1":"Belum paham konsep kuantitas","2":"Paham dengan bimbingan konkret","3":"Paham mandiri dan bisa puzzle sederhana","4":"Pemahaman kuat dan selesaikan tantangan kompleks"}}
]',
'[
  {"id":"rf-3-1","label":"Disorientasi spasial berat","severity":"moderate"},
  {"id":"rf-3-2","label":"Tidak memahami hubungan sebab-akibat sederhana","severity":"moderate"},
  {"id":"rf-3-3","label":"Frustrasi ekstrem saat tantangan gagal (meltdown)","severity":"critical"}
]'),

-- POS 4: Bahasa Lisan, Pra-Literasi & Motorik Halus
('config-pos-4-v1', '1.0.0', 4, 'Bahasa Lisan, Pra-Literasi & Motorik Halus',
'Observasi kemampuan berbahasa, pra-membaca, dan kontrol motorik halus tangan',
'[
  {"id":"4.1","label":"Menyimak Cerita Lisan","description":"Menyimak dan memahami pesan cerita lisan yang dibacakan (read-aloud)","score_descriptors":{"1":"Tidak memperhatikan dan tidak bisa jawab pertanyaan","2":"Memperhatikan tapi jawaban tidak relevan","3":"Menyimak baik dan menjawab sebagian besar","4":"Menyimak aktif dan jawab dengan detail"}},
  {"id":"4.2","label":"Komunikasi Gagasan Lisan","description":"Mengomunikasikan gagasan lisan tentang hasil gambarnya","score_descriptors":{"1":"Tidak bisa menjelaskan gambarnya","2":"Menjelaskan dengan 1-2 kata","3":"Menjelaskan dengan kalimat sederhana","4":"Menjelaskan dengan kalimat lengkap dan rinci"}},
  {"id":"4.3","label":"Kontrol Motorik Halus","description":"Kontrol motorik halus dan genggaman alat tulis fungsional (pincer/tripod grasp)","score_descriptors":{"1":"Genggaman palmar, tidak bisa kontrol","2":"Peralihan ke pincer, kontrol lemah","3":"Pincer/tripod grasp, bisa menulis/mewarnai","4":"Tripod sempurna, presisi dan kontrol tinggi"}}
]',
'[
  {"id":"rf-4-1","label":"Bicara tidak dapat dipahami (speech delay berat)","severity":"critical"},
  {"id":"rf-4-2","label":"Ekolalia — menirukan kata tanpa makna kontekstual","severity":"critical"},
  {"id":"rf-4-3","label":"No joint attention — kontak mata absen total","severity":"critical"},
  {"id":"rf-4-4","label":"Otot tangan sangat lemas, tidak bisa pegang alat tulis","severity":"moderate"}
]'),

-- POS 5: Bermain Bebas, Interaksi Sosial & Koordinator Tim
('config-pos-5-v1', '1.0.0', 5, 'Bermain Bebas, Interaksi Sosial & Koordinator Tim',
'Observasi kemampuan bermain bersama, berbagi, dan regulasi emosi dalam kelompok',
'[
  {"id":"5.1","label":"Bermain Kooperatif","description":"Bermain kooperatif, berbagi mainan, dan berinteraksi sehat dalam kelompok","score_descriptors":{"1":"Menolak bermain bersama, menyendiri total","2":"Bermain paralel (di dekat teman tapi tidak interaksi)","3":"Bermain kooperatif dengan sedikit konflik","4":"Pemimpin alami, mendorong kerjasama tim"}},
  {"id":"5.2","label":"Regulasi Emosi & Konflik","description":"Regulasi emosi saat terjadi perbedaan pendapat/konflik kecil","score_descriptors":{"1":"Breakdown total saat ada konflik kecil","2":"Perlu banyak bantuan dewasa untuk regulasi","3":"Bisa regulasi dengan sedikit bantuan","4":"Resolusi konflik mandiri dan dewasa"}}
]',
'[
  {"id":"rf-5-1","label":"Extreme social withdrawal — menolak disapa sama sekali","severity":"critical"},
  {"id":"rf-5-2","label":"Impulsif ekstrem — tidak bisa menunggu giliran","severity":"moderate"},
  {"id":"rf-5-3","label":"Hiperaktif — tidak bisa diam lebih dari 30 detik","severity":"moderate"}
]');
