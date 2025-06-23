const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });
console.log('✅ Serveur WebSocket démarré sur le port 3000');

const users = new Map(); // username => ws

function broadcastUsers() {
  const usernames = [...users.keys()];
  const message = JSON.stringify({ type: 'users', users: usernames });

  users.forEach(ws => {
    ws.send(message);
  });
}

wss.on('connection', ws => {
  ws.on('message', message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error("❌ Message JSON invalide :", message);
      return;
    }

    // Enregistrement utilisateur
    if (data.type === 'register') {
      if (data.username) {
        ws.username = data.username;
        users.set(data.username, ws);
        console.log(`👤 ${data.username} est connecté`);
        broadcastUsers(); // ➕ Mise à jour pour tout le monde
      }
      return;
    }

    // Relais des messages (appel, réponse, ICE)
    const targetWs = users.get(data.to);
    if (targetWs) {
      data.from = ws.username;
      targetWs.send(JSON.stringify(data));
      console.log(`🔄 Message de ${data.from} vers ${data.to} : ${data.type}`);
    } else {
      console.warn(`⚠️ Utilisateur ${data.to} non trouvé`);
    }
  });

  ws.on('close', () => {
    if (ws.username) {
      users.delete(ws.username);
      console.log(`❌ ${ws.username} déconnecté`);
      broadcastUsers(); // ➖ Mise à jour pour tout le monde
    }
  });
});
