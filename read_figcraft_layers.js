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

  // Get selection
  const all = await sendCmd('select.all', {});
  console.log('Selected IDs:', all.result.selection);

  // Inspect code for Desktop Frame if available
  const codeDesk = await sendCmd('inspect.code', { id: 2, language: 'html' });
  if (codeDesk.result) {
    console.log('--- INSPECT CODE FRAME 2 (DESKTOP) ---');
    console.log(codeDesk.result.code?.substring(0, 1500));
  } else {
    console.log('Code Frame 2 error:', codeDesk.error);
  }

  // Inspect code for Mobile Frame if available
  const codeMob = await sendCmd('inspect.code', { id: 24, language: 'html' });
  if (codeMob.result) {
    console.log('--- INSPECT CODE FRAME (MOBILE) ---');
    console.log(codeMob.result.code?.substring(0, 1500));
  } else {
    console.log('Code Frame mobile error:', codeMob.error);
  }

  client.end();
});
