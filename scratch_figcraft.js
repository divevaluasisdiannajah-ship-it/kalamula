const net = require('net');

function queryFigcraft(command, params = {}) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.connect(7979, '127.0.0.1', () => {
      const msg = JSON.stringify({
        jsonrpc: '2.0',
        id: Math.random().toString(36).substring(2),
        method: 'engine.execute',
        params: { command, params }
      }) + '\n';
      client.write(msg);
    });

    client.on('data', (data) => {
      try {
        const res = JSON.parse(data.toString());
        resolve(res);
      } catch (err) {
        resolve({ raw: data.toString() });
      }
      client.end();
    });

    client.on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  const res = await queryFigcraft('document.get', {});
  console.log('Document:', JSON.stringify(res).substring(0, 500));
}

run();
