const net = require('net');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

async function run() {
  const qrPath = path.resolve(__dirname, 'standee_qr.png');
  const qrBase64 = fs.readFileSync(qrPath).toString('base64');

  const client = new net.Socket();
  client.connect(7979, '127.0.0.1', async () => {
    const rl = readline.createInterface({ input: client });
    function sendCmd(cmd, params = {}) {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).substring(2);
        const msg = JSON.stringify({
          jsonrpc: '2.0',
          id,
          method: 'engine.execute',
          params: { command: cmd, params },
        }) + '\n';

        function onLine(line) {
          try {
            const res = JSON.parse(line);
            if (res.id === id) {
              rl.removeListener('line', onLine);
              resolve(res);
            }
          } catch (e) {}
        }

        rl.on('line', onLine);
        client.write(msg);
      });
    }

    // Clean up any rogue layers with ID >= 130
    for (let id = 130; id <= 180; id++) {
      await sendCmd('edit.delete', { ids: [id] });
    }

    console.log('--- Creating Standee QR Frame in FigCraft ---');

    // 1. Standee A4 Frame (A4 Aspect Ratio: 640 x 900)
    // Position at x: 2320, y: 100
    const frameRes = await sendCmd('frame.create', {
      name: 'Standee A4 - QR Kuesioner Orang Tua',
      x: 2320,
      y: 100,
      width: 640,
      height: 900,
      props: {
        fill: '#FFFFFF',
        cornerRadius: 28,
        stroke: '#284034',
        strokeWeight: 3,
        clip: true,
      },
    });

    console.log('Frame create response:', JSON.stringify(frameRes));
    const frameId = frameRes.result.id;
    console.log('Frame created with ID:', frameId);

    // 2. Header Box (Deep Forest Green #284034)
    await sendCmd('shape.rectangle', {
      parent: frameId,
      name: 'Header Box (Forest Green)',
      x: 36,
      y: 36,
      width: 568,
      height: 205,
      props: {
        fill: '#284034',
        cornerRadius: 20,
      },
    });

    // Decorative batik wave shapes inside header
    await sendCmd('shape.ellipse', {
      parent: frameId,
      name: 'Batik Cloud Accent 1',
      x: 10,
      y: 10,
      width: 130,
      height: 130,
      props: {
        fill: '#314E3F',
        opacity: 0.5,
      },
    });

    await sendCmd('shape.ellipse', {
      parent: frameId,
      name: 'Batik Cloud Accent 2',
      x: 480,
      y: 120,
      width: 150,
      height: 150,
      props: {
        fill: '#314E3F',
        opacity: 0.5,
      },
    });

    // Emblem White Square
    await sendCmd('shape.rectangle', {
      parent: frameId,
      name: 'Emblem Box White',
      x: 296,
      y: 52,
      width: 48,
      height: 48,
      props: {
        fill: '#FFFFFF',
        cornerRadius: 14,
      },
    });

    // Sprout Leaf Emoji
    await sendCmd('text.create', {
      parent: frameId,
      name: 'Leaf Icon',
      text: '🌱',
      x: 308,
      y: 62,
      props: {
        fontSize: 24,
      },
    });

    // Eyebrow Institution text
    await sendCmd('text.create', {
      parent: frameId,
      name: 'Eyebrow Text',
      text: 'YAYASAN PENDIDIKAN ISLAM AN-NAJAH MANDIRI • SPMB 2026/2027',
      x: 36,
      y: 110,
      width: 568,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 10,
        fontStyle: 'Bold',
        fill: '#B7D2C4',
        textAlign: 'center',
      },
    });

    // School Title (SD Islam An Najah)
    await sendCmd('text.create', {
      parent: frameId,
      name: 'School Title',
      text: 'SD Islam An Najah',
      x: 36,
      y: 126,
      width: 568,
      props: {
        fontFamily: 'Playfair Display',
        fontSize: 30,
        fontStyle: 'Bold',
        fill: '#FFFFFF',
        textAlign: 'center',
      },
    });

    // Pill Badge
    await sendCmd('shape.rectangle', {
      parent: frameId,
      name: 'Badge Pill White',
      x: 105,
      y: 172,
      width: 430,
      height: 30,
      props: {
        fill: '#FFFFFF',
        cornerRadius: 15,
      },
    });

    // Text in Pill
    await sendCmd('text.create', {
      parent: frameId,
      name: 'Badge Text',
      text: 'KUESIONER KESIAPAN BELAJAR & KEBIASAAN ANAK DI RUMAH',
      x: 105,
      y: 180,
      width: 430,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 10.5,
        fontStyle: 'Bold',
        fill: '#284034',
        textAlign: 'center',
      },
    });

    // Subtitle Foundation
    await sendCmd('text.create', {
      parent: frameId,
      name: 'Foundation Subtitle',
      text: '6 Kemampuan Fondasi Transisi PAUD ke SD',
      x: 36,
      y: 212,
      width: 568,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 11,
        fill: '#D2E7DC',
        textAlign: 'center',
      },
    });

    // 3. QR Code Showcase Area
    // Outer Border Box
    await sendCmd('shape.rectangle', {
      parent: frameId,
      name: 'QR Outer Card',
      x: 175,
      y: 260,
      width: 290,
      height: 290,
      props: {
        fill: '#FFFFFF',
        stroke: '#284034',
        strokeWeight: 4,
        cornerRadius: 24,
      },
    });

    // Place QR Image
    const qrImg = await sendCmd('image.place', {
      parent: frameId,
      name: 'QR Code Image (observasi.sdiannajah.ai.id/parent)',
      data: qrBase64,
      x: 195,
      y: 280,
      width: 250,
      height: 250,
    });
    console.log('QR Image placed:', qrImg.result ? qrImg.result.id : 'error');

    // URL Display
    await sendCmd('text.create', {
      parent: frameId,
      name: 'URL Text',
      text: 'observasi.sdiannajah.ai.id/parent',
      x: 36,
      y: 565,
      width: 568,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 15,
        fontStyle: 'Bold',
        fill: '#22352B',
        textAlign: 'center',
      },
    });

    // Callout instruction
    await sendCmd('text.create', {
      parent: frameId,
      name: 'Scan Callout',
      text: '📸 Pindai / Scan QR Code Menggunakan Kamera Ponsel',
      x: 36,
      y: 590,
      width: 568,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 13,
        fontStyle: 'Bold',
        fill: '#9B3F18',
        textAlign: 'center',
      },
    });

    // 4. Steps Container (Warm Cream)
    await sendCmd('shape.rectangle', {
      parent: frameId,
      name: 'Steps Container',
      x: 36,
      y: 625,
      width: 568,
      height: 180,
      props: {
        fill: '#FAF8F5',
        stroke: '#E8E2D8',
        strokeWeight: 1.5,
        cornerRadius: 18,
      },
    });

    // Steps Header Title
    await sendCmd('text.create', {
      parent: frameId,
      name: 'Steps Header',
      text: 'LANGKAH PENGISIAN KUESIONER:',
      x: 36,
      y: 640,
      width: 568,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 11,
        fontStyle: 'Bold',
        fill: '#284034',
        textAlign: 'center',
      },
    });

    // 3 Step Cards
    const stepCards = [
      {
        num: '1',
        title: 'Langkah 1',
        desc: 'Buka kamera ponsel Anda dan arahkan langsung ke QR Code di atas.',
        x: 52,
      },
      {
        num: '2',
        title: 'Langkah 2',
        desc: 'Cari & pilih nama Ananda tercinta dari daftar calon siswa.',
        x: 236,
      },
      {
        num: '3',
        title: 'Langkah 3',
        desc: 'Jawab 20 kebiasaan ananda (Selalu / Kadang / Belum) & kirim.',
        x: 420,
      },
    ];

    for (const step of stepCards) {
      // Step Card Box
      await sendCmd('shape.rectangle', {
        parent: frameId,
        name: `Step ${step.num} Box`,
        x: step.x,
        y: 665,
        width: 168,
        height: 125,
        props: {
          fill: '#FFFFFF',
          stroke: '#E8E2D8',
          strokeWeight: 1,
          cornerRadius: 14,
        },
      });

      // Circle Badge
      await sendCmd('shape.ellipse', {
        parent: frameId,
        name: `Step ${step.num} Circle`,
        x: step.x + 12,
        y: 677,
        width: 24,
        height: 24,
        props: {
          fill: '#284034',
        },
      });

      // Badge Number Text
      await sendCmd('text.create', {
        parent: frameId,
        name: `Step ${step.num} Num`,
        text: step.num,
        x: step.x + 12,
        y: 681,
        width: 24,
        props: {
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 12,
          fontStyle: 'Bold',
          fill: '#FFFFFF',
          textAlign: 'center',
        },
      });

      // Step Title
      await sendCmd('text.create', {
        parent: frameId,
        name: `Step ${step.num} Title`,
        text: step.title,
        x: step.x + 44,
        y: 681,
        props: {
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 11,
          fontStyle: 'Bold',
          fill: '#284034',
        },
      });

      // Step Description
      await sendCmd('text.create', {
        parent: frameId,
        name: `Step ${step.num} Desc`,
        text: step.desc,
        x: step.x + 14,
        y: 712,
        width: 140,
        props: {
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 10.5,
          fill: '#565C58',
          lineHeight: '135%',
        },
      });
    }

    // 5. Footer Standee
    await sendCmd('shape.rectangle', {
      parent: frameId,
      name: 'Footer Divider',
      x: 50,
      y: 825,
      width: 540,
      height: 1,
      props: {
        fill: '#E8E2D8',
      },
    });

    await sendCmd('text.create', {
      parent: frameId,
      name: 'Footer Note',
      text: 'Data kuesioner terhubung otomatis dengan dokumen diagnostik kesiapan belajar ananda • Panitia SPMB SD Islam An Najah',
      x: 36,
      y: 840,
      width: 568,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 9.5,
        fill: '#787F7A',
        textAlign: 'center',
      },
    });

    // 6. Acrylic Stand Base (Mockup Feet)
    await sendCmd('shape.rectangle', {
      name: 'Standee Acrylic Base Plate',
      x: 2300,
      y: 1015,
      width: 680,
      height: 24,
      props: {
        fill: '#E2E8F0',
        stroke: '#CBD5E1',
        strokeWeight: 1,
        cornerRadius: 8,
      },
    });

    await sendCmd('shape.rectangle', {
      name: 'Standee Acrylic Inner Slot',
      x: 2320,
      y: 1022,
      width: 640,
      height: 6,
      props: {
        fill: '#94A3B8',
        cornerRadius: 3,
      },
    });

    await sendCmd('text.create', {
      name: 'Standee Mockup Label',
      text: '✨ FORMAT STANDING AKRILIK / CETAK A4 RUANG TUNGGU WALI MURID',
      x: 2300,
      y: 1050,
      width: 680,
      props: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        fontStyle: 'Bold',
        fill: '#787F7A',
        textAlign: 'center',
      },
    });

    // Select the newly drawn standee frame and zoom to it
    await sendCmd('select.set', { ids: [frameId] });

    console.log('--- ALL STANDEE ELEMENTS CREATED SUCCESSFULLY ---');
    client.end();
  });
}

run().catch(console.error);
