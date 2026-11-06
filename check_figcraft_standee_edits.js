const net = require('net');
const readline = require('readline');

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

  // Inspect code for Standee Frame
  const code = await sendCmd('inspect.code', { id: 133, language: 'html' });
  if (code.result) {
    console.log('--- CURRENT CODE FOR STANDEE FRAME 133 ---');
    console.log(code.result.code);
  } else {
    console.log('Error inspecting code for 133:', code.error);
  }

  // Check selection
  const sel = await sendCmd('select.all', {});
  console.log('Selected IDs:', sel.result.selection);

  client.end();
});
