const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });
console.log('✅ Serveur WebSocket lancé sur le port', PORT);

const users = new Map(); // username => ws

wss.on('connection', ws => {
  let username = null;

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    // Enregistrement utilisateur
    if (data.type === 'register') {
      username = data.username;
      users.set(username, ws);
      updateUserList();
      return;
    }

    // Relay messages (appel, réponse, ICE)
    const dest = users.get(data.to);
    if (dest) {
      data.from = username; // 👈 important pour notification
      dest.send(JSON.stringify(data));
      console.log(`🔁 ${data.type} de ${username} vers ${data.to}`);
    }
  });

  ws.on('close', () => {
    if (username) {
      users.delete(username);
      updateUserList();
    }
  });

  function updateUserList() {
    const userList = Array.from(users.keys());
    const payload = JSON.stringify({ type: 'user-list', users: userList });
    users.forEach(client => client.send(payload));
  }
});
