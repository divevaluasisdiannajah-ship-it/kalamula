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

  const nodes = [2, 48, 92];
  for (const nid of nodes) {
    const info = await sendCmd('node.get', { id: nid });
    console.log(`Node ${nid}:`, JSON.stringify(info.result));
  }

  client.end();
});
