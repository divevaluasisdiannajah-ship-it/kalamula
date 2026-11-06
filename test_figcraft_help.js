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

  // Test what commands exist
  const res = await sendCmd('help', {});
  console.log('Help result:', JSON.stringify(res));

  const res2 = await sendCmd('command.list', {});
  console.log('Command list result:', JSON.stringify(res2));

  client.end();
});
