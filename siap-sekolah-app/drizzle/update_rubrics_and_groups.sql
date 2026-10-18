-- Update Pos 1
UPDATE assessment_configs SET
  pos_name = 'Kedatangan, Kemandirian & Kematangan Emosi',
  pos_description = 'Observasi saat anak tiba, berpisah dari orang tua, dan berinteraksi awal',
  indicators_json = '[{"id":"1.1","label":"Berpisah dari orang tua","description":"Berpisah dari orang tua dengan tenang tanpa kecemasan ekstrem","foundation":3,"score_descriptors":{"1":"Menangis histeris tidak mau ditinggal","2":"Menangis tapi mau ditinggal setelah dibujuk lama","3":"Sedikit cemas tapi mandiri masuk kelas","4":"Berpisah dengan tenang dan antusias"}},{"id":"1.2","label":"Kemandirian Menaruh Barang","description":"Mandiri melepaskan dan merapikan sepatu di rak serta menggantungkan tas","foundation":5,"score_descriptors":{"1":"Tidak bisa, sepenuhnya butuh bantuan","2":"Bisa dengan banyak bantuan verbal","3":"Bisa dengan sedikit pengingat","4":"Mandiri sempurna dan rapi"}},{"id":"1.3","label":"Kesantunan dan Antrean","description":"Menggunakan kata santun (tolong, terima kasih, maaf) dan budaya mengantre","foundation":1,"score_descriptors":{"1":"Tidak menggunakan kata santun dan tidak mau mengantre","2":"Kadang menggunakan kata santun dengan pengingat","3":"Sering menggunakan kata santun secara spontan","4":"Konsisten santun dan sabar mengantre tanpa pengingat"}}]',
  red_flags_json = '[{"id":"rf-1-1","label":"Tantrum histeris melantai (>10 menit)","severity":"critical"},{"id":"rf-1-2","label":"Panik berlebihan atau serangan panik","severity":"critical"},{"id":"rf-1-3","label":"Perilaku agresif membahayakan (memukul/menggigit)","severity":"critical"}]',
  updated_at = datetime('now')
WHERE pos_number = 1;

-- Update Pos 2
UPDATE assessment_configs SET
  pos_name = 'Motorik Kasar & Koordinasi Fisik',
  pos_description = 'Observasi kemampuan gerak tubuh, keseimbangan, dan koordinasi mata-tangan',
  indicators_json = '[{"id":"2.1","label":"Keseimbangan & Koordinasi Tubuh","description":"Berjalan lurus, meniti papan titian, melompat 2 kaki","foundation":5,"score_descriptors":{"1":"Tidak bisa melakukan salah satu aktivitas","2":"Bisa dengan pegangan/bantuan fisik","3":"Bisa mandiri meski sedikit tidak stabil","4":"Lincah dan koordinasi sangat baik"}},{"id":"2.2","label":"Respons Instruksi & Koordinasi Mata-Tangan","description":"Merespons instruksi gerak verbal dan koordinasi mata-tangan (tangkap bola)","foundation":5,"score_descriptors":{"1":"Tidak merespons instruksi, gagal tangkap bola","2":"Merespons lambat, sering gagal tangkap","3":"Merespons baik, kadang berhasil tangkap","4":"Merespons cepat dan tepat, tangkap bola konsisten"}}]',
  red_flags_json = '[{"id":"rf-2-1","label":"Tonus otot kaku (hipertonia) atau sangat lemas (hipotonia)","severity":"critical"},{"id":"rf-2-2","label":"Sering jatuh tanpa sebab yang jelas","severity":"moderate"},{"id":"rf-2-3","label":"Tidak bisa melompat dengan 2 kaki","severity":"moderate"}]',
  updated_at = datetime('now')
WHERE pos_number = 2;

-- Update Pos 3
UPDATE assessment_configs SET
  pos_name = 'Kematangan Kognitif & Numerasi Dasar',
  pos_description = 'Observasi kemampuan berpikir logis, pola, perbandingan, dan pemecahan masalah',
  indicators_json = '[{"id":"3.1","label":"Klasifikasi & Pola","description":"Memilah benda berdasarkan atribut dan melengkapi pola berulang","foundation":4,"score_descriptors":{"1":"Tidak bisa memilah atau mengenali pola","2":"Bisa memilah 1 atribut dengan bantuan","3":"Bisa memilah dan lanjutkan pola sederhana","4":"Mandiri klasifikasi multi-atribut dan pola kompleks"}},{"id":"3.2","label":"Konsep Kuantitas & Problem Solving","description":"Memahami banyak/sedikit dan pemecahan masalah (puzzle/balok)","foundation":4,"score_descriptors":{"1":"Belum paham konsep kuantitas","2":"Paham dengan bimbingan konkret","3":"Paham mandiri dan bisa puzzle sederhana","4":"Pemahaman kuat dan selesaikan tantangan kompleks"}}]',
  red_flags_json = '[{"id":"rf-3-1","label":"Disorientasi spasial berat","severity":"moderate"},{"id":"rf-3-2","label":"Tidak memahami hubungan sebab-akibat sederhana","severity":"moderate"},{"id":"rf-3-3","label":"Frustrasi ekstrem saat tantangan gagal (meltdown)","severity":"critical"}]',
  updated_at = datetime('now')
WHERE pos_number = 3;

-- Update Pos 4
UPDATE assessment_configs SET
  pos_name = 'Bahasa Lisan, Pra-Literasi & Motorik Halus',
  pos_description = 'Observasi kemampuan berbahasa, pra-membaca, dan kontrol motorik halus tangan',
  indicators_json = '[{"id":"4.1","label":"Menyimak Cerita Lisan","description":"Menyimak dan memahami pesan cerita lisan yang dibacakan (read-aloud)","foundation":2,"score_descriptors":{"1":"Tidak memperhatikan dan tidak bisa jawab pertanyaan","2":"Memperhatikan tapi jawaban tidak relevan","3":"Menyimak baik dan menjawab sebagian besar","4":"Menyimak aktif dan jawab dengan detail"}},{"id":"4.2","label":"Komunikasi Gagasan Lisan","description":"Mengomunikasikan gagasan lisan tentang hasil gambarnya","foundation":2,"score_descriptors":{"1":"Tidak bisa menjelaskan gambarnya","2":"Menjelaskan dengan 1-2 kata","3":"Menjelaskan dengan kalimat sederhana","4":"Menjelaskan dengan kalimat lengkap dan rinci"}},{"id":"4.3","label":"Kontrol Motorik Halus","description":"Kontrol motorik halus dan genggaman alat tulis fungsional (pincer/tripod grasp)","foundation":5,"score_descriptors":{"1":"Genggaman palmar, tidak bisa kontrol","2":"Peralihan ke pincer, kontrol lemah","3":"Pincer/tripod grasp, bisa menulis/mewarnai","4":"Tripod sempurna, presisi dan kontrol tinggi"}}]',
  red_flags_json = '[{"id":"rf-4-1","label":"Bicara tidak dapat dipahami (speech delay berat)","severity":"critical"},{"id":"rf-4-2","label":"Ekolalia — menirukan kata tanpa makna kontekstual","severity":"critical"},{"id":"rf-4-3","label":"No joint attention — kontak mata absen total","severity":"critical"},{"id":"rf-4-4","label":"Otot tangan sangat lemas, tidak bisa pegang alat tulis","severity":"moderate"}]',
  updated_at = datetime('now')
WHERE pos_number = 4;

-- Update Pos 5
UPDATE assessment_configs SET
  pos_name = 'Bermain Bebas, Istirahat & Interaksi Kelompok',
  pos_description = 'Observasi interaksi saat bermain bebas, makan snack bersama, dan regulasi emosi kelompok',
  indicators_json = '[{"id":"5.1","label":"Bermain Kooperatif & Berbagi","description":"Bermain kooperatif, berbagi alat bermain/makanan, dan berinteraksi sehat dalam kelompok","foundation":2,"score_descriptors":{"1":"Menolak bermain bersama, menyendiri total","2":"Bermain paralel (di dekat teman tapi tidak interaksi)","3":"Bermain kooperatif dengan sedikit konflik","4":"Pemimpin alami, mendorong kerjasama tim"}},{"id":"5.2","label":"Regulasi Diri & Adaptasi","description":"Regulasi emosi saat terjadi perbedaan pendapat/konflik kecil atau situasi baru","foundation":3,"score_descriptors":{"1":"Breakdown total saat ada konflik kecil","2":"Perlu banyak bantuan dewasa untuk regulasi","3":"Bisa regulasi dengan sedikit bantuan","4":"Resolusi konflik mandiri dan tenang"}},{"id":"5.3","label":"Antusiasme & Refleksi Belajar","description":"Menunjukkan keceriaan, rasa ingin tahu positif, dan antusiasme menjalani rangkaian kegiatan","foundation":6,"score_descriptors":{"1":"Tampak sangat tertekan atau pasif menolak kegiatan","2":"Kurang bersemangat, perlu motivasi konstan","3":"Menikmati kegiatan bermain dan interaksi dengan wajar","4":"Sangat antusias, ceria, dan bangga dengan pengalamannya"}}]',
  red_flags_json = '[{"id":"rf-5-1","label":"Extreme social withdrawal — menolak disapa sama sekali","severity":"critical"},{"id":"rf-5-2","label":"Impulsif ekstrem — tidak bisa menunggu giliran","severity":"moderate"},{"id":"rf-5-3","label":"Hiperaktif — tidak bisa diam lebih dari 30 detik","severity":"moderate"}]',
  updated_at = datetime('now')
WHERE pos_number = 5;

-- Update students observation_group distribution
UPDATE students SET observation_group = 'Kelompok 1' WHERE observation_group IS NULL AND (rowid % 3 = 1);
UPDATE students SET observation_group = 'Kelompok 2' WHERE observation_group IS NULL AND (rowid % 3 = 2);
UPDATE students SET observation_group = 'Kelompok 3' WHERE observation_group IS NULL AND (rowid % 3 = 0);
