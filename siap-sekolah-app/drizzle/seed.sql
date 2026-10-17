-- ============================================================
-- SIAP SEKOLAH — Assessment Configs Seed Data
-- Run after migrations to populate the 5 Pos rubrics
-- ============================================================

INSERT OR IGNORE INTO assessment_configs (id, version, pos_number, pos_name, pos_description, indicators_json, red_flags_json, is_active, created_by, created_at, updated_at) VALUES
(
  'config-pos-1-v1', '1.0.0', 1,
  'Kedatangan, Kemandirian & Kematangan Emosi',
  'Observasi saat anak tiba, berpisah dari orang tua, dan berinteraksi awal',
  '[{"id":"1.1","label":"Berpisah dari orang tua","description":"Berpisah dari orang tua dengan tenang tanpa kecemasan ekstrem","score_descriptors":{"1":"Menangis histeris tidak mau ditinggal","2":"Menangis tapi mau ditinggal setelah dibujuk lama","3":"Sedikit cemas tapi mandiri masuk kelas","4":"Berpisah dengan tenang dan antusias"}},{"id":"1.2","label":"Kemandirian Menaruh Barang","description":"Mandiri melepaskan dan merapikan sepatu di rak serta menggantungkan tas","score_descriptors":{"1":"Tidak bisa, sepenuhnya butuh bantuan","2":"Bisa dengan banyak bantuan verbal","3":"Bisa dengan sedikit pengingat","4":"Mandiri sempurna dan rapi"}},{"id":"1.3","label":"Kesantunan dan Antrean","description":"Menggunakan kata santun (tolong, terima kasih, maaf) dan budaya mengantre","score_descriptors":{"1":"Tidak menggunakan kata santun dan tidak mau mengantre","2":"Kadang menggunakan kata santun dengan pengingat","3":"Sering menggunakan kata santun secara spontan","4":"Konsisten santun dan sabar mengantre tanpa pengingat"}}]',
  '[{"id":"rf-1-1","label":"Tantrum histeris melantai (>10 menit)","severity":"critical"},{"id":"rf-1-2","label":"Panik berlebihan atau serangan panik","severity":"critical"},{"id":"rf-1-3","label":"Perilaku agresif membahayakan (memukul/menggigit)","severity":"critical"}]',
  1, 'system', datetime('now'), datetime('now')
),
(
  'config-pos-2-v1', '1.0.0', 2,
  'Motorik Kasar & Koordinasi Fisik',
  'Observasi kemampuan gerak tubuh, keseimbangan, dan koordinasi mata-tangan',
  '[{"id":"2.1","label":"Keseimbangan & Koordinasi Tubuh","description":"Berjalan lurus, meniti papan titian, melompat 2 kaki","score_descriptors":{"1":"Tidak bisa melakukan salah satu aktivitas","2":"Bisa dengan pegangan/bantuan fisik","3":"Bisa mandiri meski sedikit tidak stabil","4":"Lincah dan koordinasi sangat baik"}},{"id":"2.2","label":"Respons Instruksi & Koordinasi Mata-Tangan","description":"Merespons instruksi gerak verbal dan koordinasi mata-tangan (tangkap bola)","score_descriptors":{"1":"Tidak merespons instruksi, gagal tangkap bola","2":"Merespons lambat, sering gagal tangkap","3":"Merespons baik, kadang berhasil tangkap","4":"Merespons cepat dan tepat, tangkap bola konsisten"}}]',
  '[{"id":"rf-2-1","label":"Tonus otot kaku (hipertonia) atau sangat lemas (hipotonia)","severity":"critical"},{"id":"rf-2-2","label":"Sering jatuh tanpa sebab yang jelas","severity":"moderate"},{"id":"rf-2-3","label":"Tidak bisa melompat dengan 2 kaki","severity":"moderate"}]',
  1, 'system', datetime('now'), datetime('now')
),
(
  'config-pos-3-v1', '1.0.0', 3,
  'Kematangan Kognitif & Numerasi Dasar',
  'Observasi kemampuan berpikir logis, pola, perbandingan, dan pemecahan masalah',
  '[{"id":"3.1","label":"Klasifikasi & Pola","description":"Memilah benda berdasarkan atribut dan melengkapi pola berulang","score_descriptors":{"1":"Tidak bisa memilah atau mengenali pola","2":"Bisa memilah 1 atribut dengan bantuan","3":"Bisa memilah dan lanjutkan pola sederhana","4":"Mandiri klasifikasi multi-atribut dan pola kompleks"}},{"id":"3.2","label":"Konsep Kuantitas & Problem Solving","description":"Memahami banyak/sedikit dan pemecahan masalah (puzzle/balok)","score_descriptors":{"1":"Belum paham konsep kuantitas","2":"Paham dengan bimbingan konkret","3":"Paham mandiri dan bisa puzzle sederhana","4":"Pemahaman kuat dan selesaikan tantangan kompleks"}}]',
  '[{"id":"rf-3-1","label":"Disorientasi spasial berat","severity":"moderate"},{"id":"rf-3-2","label":"Tidak memahami hubungan sebab-akibat sederhana","severity":"moderate"},{"id":"rf-3-3","label":"Frustrasi ekstrem saat tantangan gagal (meltdown)","severity":"critical"}]',
  1, 'system', datetime('now'), datetime('now')
),
(
  'config-pos-4-v1', '1.0.0', 4,
  'Bahasa Lisan, Pra-Literasi & Motorik Halus',
  'Observasi kemampuan berbahasa, pra-membaca, dan kontrol motorik halus tangan',
  '[{"id":"4.1","label":"Menyimak Cerita Lisan","description":"Menyimak dan memahami pesan cerita lisan yang dibacakan (read-aloud)","score_descriptors":{"1":"Tidak memperhatikan dan tidak bisa jawab pertanyaan","2":"Memperhatikan tapi jawaban tidak relevan","3":"Menyimak baik dan menjawab sebagian besar","4":"Menyimak aktif dan jawab dengan detail"}},{"id":"4.2","label":"Komunikasi Gagasan Lisan","description":"Mengomunikasikan gagasan lisan tentang hasil gambarnya","score_descriptors":{"1":"Tidak bisa menjelaskan gambarnya","2":"Menjelaskan dengan 1-2 kata","3":"Menjelaskan dengan kalimat sederhana","4":"Menjelaskan dengan kalimat lengkap dan rinci"}},{"id":"4.3","label":"Kontrol Motorik Halus","description":"Kontrol motorik halus dan genggaman alat tulis fungsional (pincer/tripod grasp)","score_descriptors":{"1":"Genggaman palmar, tidak bisa kontrol","2":"Peralihan ke pincer, kontrol lemah","3":"Pincer/tripod grasp, bisa menulis/mewarnai","4":"Tripod sempurna, presisi dan kontrol tinggi"}}]',
  '[{"id":"rf-4-1","label":"Bicara tidak dapat dipahami (speech delay berat)","severity":"critical"},{"id":"rf-4-2","label":"Ekolalia — menirukan kata tanpa makna kontekstual","severity":"critical"},{"id":"rf-4-3","label":"No joint attention — kontak mata absen total","severity":"critical"},{"id":"rf-4-4","label":"Otot tangan sangat lemas, tidak bisa pegang alat tulis","severity":"moderate"}]',
  1, 'system', datetime('now'), datetime('now')
),
(
  'config-pos-5-v1', '1.0.0', 5,
  'Bermain Bebas, Interaksi Sosial & Koordinator Tim',
  'Observasi kemampuan bermain bersama, berbagi, dan regulasi emosi dalam kelompok',
  '[{"id":"5.1","label":"Bermain Kooperatif","description":"Bermain kooperatif, berbagi mainan, dan berinteraksi sehat dalam kelompok","score_descriptors":{"1":"Menolak bermain bersama, menyendiri total","2":"Bermain paralel (di dekat teman tapi tidak interaksi)","3":"Bermain kooperatif dengan sedikit konflik","4":"Pemimpin alami, mendorong kerjasama tim"}},{"id":"5.2","label":"Regulasi Emosi & Konflik","description":"Regulasi emosi saat terjadi perbedaan pendapat/konflik kecil","score_descriptors":{"1":"Breakdown total saat ada konflik kecil","2":"Perlu banyak bantuan dewasa untuk regulasi","3":"Bisa regulasi dengan sedikit bantuan","4":"Resolusi konflik mandiri dan dewasa"}}]',
  '[{"id":"rf-5-1","label":"Extreme social withdrawal — menolak disapa sama sekali","severity":"critical"},{"id":"rf-5-2","label":"Impulsif ekstrem — tidak bisa menunggu giliran","severity":"moderate"},{"id":"rf-5-3","label":"Hiperaktif — tidak bisa diam lebih dari 30 detik","severity":"moderate"}]',
  1, 'system', datetime('now'), datetime('now')
);

-- Seed default users (PIN: admin=1234, teacher=5678, evaluator pos-N = N000)
INSERT OR IGNORE INTO users (id, name, role, pin_hash, pos_number, is_active, created_at, updated_at) VALUES
  ('user-admin-1', 'Admin PPDB', 'admin', '$2b$10$defaulthashforadminpin1234', NULL, 1, datetime('now'), datetime('now')),
  ('user-teacher-1', 'Guru Kelas 1', 'teacher', '$2b$10$defaulthashforteacherpin5678', NULL, 1, datetime('now'), datetime('now')),
  ('user-eval-1', 'Evaluator Pos 1', 'evaluator', '$2b$10$defaulthashforevalpin1000', 1, 1, datetime('now'), datetime('now')),
  ('user-eval-2', 'Evaluator Pos 2', 'evaluator', '$2b$10$defaulthashforevalpin2000', 2, 1, datetime('now'), datetime('now')),
  ('user-eval-3', 'Evaluator Pos 3', 'evaluator', '$2b$10$defaulthashforevalpin3000', 3, 1, datetime('now'), datetime('now')),
  ('user-eval-4', 'Evaluator Pos 4', 'evaluator', '$2b$10$defaulthashforevalpin4000', 4, 1, datetime('now'), datetime('now')),
  ('user-eval-5', 'Evaluator Pos 5', 'evaluator', '$2b$10$defaulthashforevalpin5000', 5, 1, datetime('now'), datetime('now'));
