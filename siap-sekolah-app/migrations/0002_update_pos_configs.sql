-- Migration 0002: Restrukturisasi 4 Pos Fungsional SPMB
-- Menggabungkan Pos 1 & 5 menjadi Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi (Super Observer)
-- Menonaktifkan Pos 5 terpisah (is_active = 0)

-- 1. Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi (Super Observer 1 & 2)
UPDATE assessment_configs
SET
  pos_name = 'Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi',
  pos_description = 'Observasi longitudinal 2 Superobserver dari kedatangan, transisi rotasi 3 pos, hingga bermain bebas dan snack',
  version = '2.0.0',
  is_active = 1,
  indicators_json = '[{"id":"SO-01","label":"Berpisah dari Orang Tua","description":"Berpisah dari orang tua dengan tenang tanpa kecemasan berlebihan","foundation":3,"score_descriptors":{"1":"Menangis histeris tidak mau ditinggal","2":"Menangis tapi mau ditinggal setelah dibujuk lama","3":"Sedikit cemas tapi mandiri masuk kelas","4":"Berpisah dengan tenang, ceria, dan antusias"}},{"id":"SO-02","label":"Kemandirian Menaruh Barang","description":"Mandiri melepaskan dan merapikan sepatu di rak serta menggantung tas","foundation":5,"score_descriptors":{"1":"Tidak bisa, sepenuhnya butuh bantuan","2":"Bisa dengan banyak bantuan verbal","3":"Bisa dengan sedikit pengingat","4":"Mandiri sempurna dan rapi tanpa bantuan"}},{"id":"SO-03","label":"Kepatuhan Mengikuti Instruksi saat Transisi","description":"Mengikuti instruksi pendamping dengan tertib saat berpindah antar ruang pos","foundation":2,"score_descriptors":{"1":"Mengabaikan instruksi dan berlarian keluar barisan","2":"Perlu pengingat berulang untuk tetap tertib","3":"Mengikuti instruksi transisi dengan baik","4":"Sangat tertib, fokus, dan tanggap instruksi pemandu"}},{"id":"SO-04","label":"Kesantunan dan Budaya Antre","description":"Menggunakan kata santun (tolong, terima kasih, maaf) dan budaya sabar mengantre","foundation":1,"score_descriptors":{"1":"Menyerobot dan tidak mau mengantre","2":"Kadang santun jika diingatkan pemandu","3":"Sering berucap santun dan mau mengantre","4":"Konsisten santun dan sabar mengantre tanpa diingatkan"}},{"id":"SO-05","label":"Regulasi Diri & Adaptasi Kesulitan","description":"Kemampuan menenangkan diri dan beradaptasi saat menghadapi tantangan","foundation":3,"score_descriptors":{"1":"Breakdown/meltdown saat ada kesulitan","2":"Perlu banyak bantuan pendamping untuk tenang","3":"Mampu regulasi diri dengan sedikit arahan","4":"Kematangan emosi mandiri dan tenang menghadapi tantangan"}},{"id":"SO-06","label":"Bermain Kooperatif & Berbagi","description":"Interaksi saat bermain bersama, berbagi alat main/snack, dan dinamika kelompok","foundation":2,"score_descriptors":{"1":"Menolak berinteraksi atau merebut alat main","2":"Bermain paralel tanpa komunikasi aktif","3":"Bermain kooperatif dan mau bergantian mainan","4":"Inisiatif kolaboratif dan senang berbagi dalam kelompok"}},{"id":"SO-07","label":"Antusiasme & Refleksi Belajar","description":"Menunjukkan rasa ingin tahu positif, keceriaan, dan antusiasme belajar","foundation":6,"score_descriptors":{"1":"Tampak sangat tertekan atau pasif menolak","2":"Kurang bersemangat, perlu dorongan konstan","3":"Menikmati rangkaian kegiatan dengan wajar","4":"Sangat antusias, ceria, dan bangga menceritakan pengalamannya"}}]',
  red_flags_json = '[{"id":"rf-so-1","label":"Tantrum histeris melantai (>10 menit)","severity":"critical"},{"id":"rf-so-2","label":"Agresi fisik membahayakan (memukul/menggigit teman)","severity":"critical"},{"id":"rf-so-3","label":"Perilaku impulsif membahayakan diri (lari keluar area)","severity":"critical"},{"id":"rf-so-4","label":"Penolakan sosial ekstrem (menolak disapa/kontak mata absen total)","severity":"critical"}]',
  updated_at = datetime('now')
WHERE pos_number = 1;

-- 2. Pos Motorik Kasar & Koordinasi Fisik
UPDATE assessment_configs
SET
  pos_name = 'Pos Motorik Kasar & Koordinasi Fisik',
  pos_description = 'Observasi kemampuan gerak tubuh, keseimbangan, dan koordinasi mata-tangan',
  version = '2.0.0',
  is_active = 1,
  indicators_json = '[{"id":"MK-01","label":"Keseimbangan & Kontrol Tubuh","description":"Berjalan lurus pada garis, meniti papan titian, dan melompat 2 kaki bersamaan","foundation":5,"score_descriptors":{"1":"Tidak bisa menjaga keseimbangan, menolak titian","2":"Bisa dengan bantuan pegangan fisik erat","3":"Bisa mandiri meski sesekali goyah","4":"Lincah, seimbang sempurna, dan percaya diri"}},{"id":"MK-02","label":"Koordinasi Mata-Tangan & Respons Gerak","description":"Merespons instruksi gerak verbal dan koordinasi tangkap-lempar bola","foundation":5,"score_descriptors":{"1":"Tidak merespons instruksi, gagal tangkap bola","2":"Respons lambat, sering luput tangkap bola","3":"Respons baik, konsisten tangkap bola wajar","4":"Respons cepat, tangkap bola akurat dan gesit"}}]',
  red_flags_json = '[{"id":"rf-mk-1","label":"Tonus otot kaku (hipertonia) atau sangat lemas (hipotonia)","severity":"critical"},{"id":"rf-mk-2","label":"Sering jatuh tanpa hambatan fisik jelas / hilang keseimbangan berat","severity":"moderate"}]',
  updated_at = datetime('now')
WHERE pos_number = 2;

-- 3. Pos Kematangan Kognitif & Berhitung
UPDATE assessment_configs
SET
  pos_name = 'Pos Kematangan Kognitif & Berhitung',
  pos_description = 'Observasi kemampuan berpikir logis, pola, konsep kuantitas, dan pemecahan masalah',
  version = '2.0.0',
  is_active = 1,
  indicators_json = '[{"id":"KG-01","label":"Klasifikasi Objek & Pola Berulang","description":"Mengelompokkan benda berdasarkan atribut dan melengkapi pola deret teratur","foundation":4,"score_descriptors":{"1":"Belum bisa memilah atau melanjutkan pola","2":"Bisa memilah 1 atribut dengan bimbingan","3":"Bisa klasifikasi mandiri dan lanjutkan pola sederhana","4":"Mandiri klasifikasi multi-atribut dan pola kompleks"}},{"id":"KG-02","label":"Konsep Kuantitas & Problem Solving","description":"Memahami perbandingan banyak/sedikit, membilang konkret, dan menyusun balok/puzzle","foundation":4,"score_descriptors":{"1":"Belum memahami konsep kuantitas dasar","2":"Paham kuantitas dengan bimbingan benda konkret","3":"Paham mandiri dan menyelesaikan puzzle dasar","4":"Pemahaman kuat dan solutif pada tantangan logika kompleks"}}]',
  red_flags_json = '[{"id":"rf-kg-1","label":"Disorientasi spasial berat / tidak mengenal bentuk dan arah dasar","severity":"moderate"},{"id":"rf-kg-2","label":"Tidak memahami hubungan kausalitas (sebab-akibat) sederhana","severity":"moderate"}]',
  updated_at = datetime('now')
WHERE pos_number = 3;

-- 4. Pos Bahasa Lisan, Pra-Literasi & Motorik Halus
UPDATE assessment_configs
SET
  pos_name = 'Pos Bahasa Lisan, Pra-Literasi & Motorik Halus',
  pos_description = 'Observasi kemampuan menyimak cerita lisan, komunikasi verbal, dan kontrol motorik halus alat tulis',
  version = '2.0.0',
  is_active = 1,
  indicators_json = '[{"id":"BL-01","label":"Menyimak Cerita Lisan (Read-Aloud)","description":"Menyimak cerita lisan dan memahami pesan serta alur sederhana yang diceritakan","foundation":2,"score_descriptors":{"1":"Tidak memperhatikan dan tidak bisa menjawab","2":"Memperhatikan tapi jawaban belum relevan","3":"Menyimak baik dan menjawab dengan tepat","4":"Menyimak aktif dan menceritakan kembali secara rinci"}},{"id":"BL-02","label":"Komunikasi Gagasan Lisan","description":"Mengomunikasikan gagasan lisan tentang ide/karya dengan kalimat terstruktur","foundation":2,"score_descriptors":{"1":"Tidak mau berbicara atau kata tidak jelas","2":"Menjelaskan dengan 1-2 kata terputus","3":"Menjelaskan dengan kalimat sederhana","4":"Menjelaskan dengan kalimat lengkap, percaya diri dan runtut"}},{"id":"BL-03","label":"Kontrol Motorik Halus & Tripod Grasp","description":"Kontrol jemari tangan dan genggaman pensil fungsional (tripod grasp) saat menulis/menggambar","foundation":5,"score_descriptors":{"1":"Genggaman palmar/tinju, tanpa kontrol gerak","2":"Peralihan ke pincer, kontrol masih goyah","3":"Tripod grasp fungsional, goresan mantap","4":"Dynamic tripod grasp sempurna, presisi dan luwes"}}]',
  red_flags_json = '[{"id":"rf-bl-1","label":"Bicara tidak dapat dipahami (speech delay berat)","severity":"critical"},{"id":"rf-bl-2","label":"Ekolalia — menirukan kata tanpa makna kontekstual","severity":"critical"},{"id":"rf-bl-3","label":"Otot jemari tangan sangat lemah / tremor, tidak bisa pegang alat tulis","severity":"moderate"}]',
  updated_at = datetime('now')
WHERE pos_number = 4;

-- 5. Nonaktifkan Pos 5 (Dilebur ke Pos 1 Superobserver)
UPDATE assessment_configs
SET
  is_active = 0,
  updated_at = datetime('now')
WHERE pos_number = 5;
