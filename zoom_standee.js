const net = require('net');
const client = new net.Socket();
client.connect(7979, '127.0.0.1', () => {
  client.write(JSON.stringify({ jsonrpc: '2.0', id: 'sel', method: 'engine.execute', params: { command: 'select.set', params: { ids: [133] } } }) + '\n');
  setTimeout(() => {
    client.write(JSON.stringify({ jsonrpc: '2.0', id: 'zoom', method: 'engine.execute', params: { command: 'view.zoomSelection', params: {} } }) + '\n');
    setTimeout(() => client.end(), 300);
  }, 200);
});
