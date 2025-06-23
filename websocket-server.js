const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });
console.log('✅ Serveur WebSocket démarré sur le port 3000');

const users = new Map(); // username => ws

wss.on('connection', ws => {
  ws.on('message', message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error("❌ Message JSON invalide :", message);
      return;
    }

    // Enregistrement du nom d'utilisateur
    if (data.type === 'register') {
      if (data.username) {
        ws.username = data.username;
        users.set(data.username, ws);
        console.log(`👤 ${data.username} est enregistré`);
      }
      return;
    }

    // Relais des messages
    const targetWs = users.get(data.to);
    if (targetWs) {
      data.from = ws.username; // assure que 'from' est présent
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
    }
  });
});
