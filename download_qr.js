const fs = require('fs');
const path = require('path');

async function downloadQR() {
  const url = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https%3A%2F%2Fobservasi.sdiannajah.ai.id%2Fparent&color=284034&bgcolor=FFFFFF';
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const filePath = path.resolve(__dirname, 'standee_qr.png');
  fs.writeFileSync(filePath, Buffer.from(buf));
  console.log('Saved QR to:', filePath, 'Size:', fs.statSync(filePath).size);
  return filePath;
}

downloadQR().catch(console.error);
