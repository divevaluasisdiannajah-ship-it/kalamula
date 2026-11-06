const net = require('net');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

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

  const qrPath = path.resolve(__dirname, 'standee_qr.png');
  const base64Data = fs.readFileSync(qrPath).toString('base64');
  console.log('Testing image.place with base64...');

  const res = await sendCmd('image.place', {
    data: base64Data,
    x: 2300,
    y: 100,
    width: 200,
    height: 200,
    name: 'QR Code Test'
  });

  console.log('image.place result:', JSON.stringify(res));

  // Let's delete it so we keep canvas clean for the full standee
  if (res.result && res.result.id) {
    await sendCmd('edit.delete', { ids: [res.result.id] });
    console.log('Cleaned up test image layer');
  }

  client.end();
});
