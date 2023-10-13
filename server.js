const express = require('express');
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000;
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const connections = [null, null];

io.on('connection', socket => {
  let playerIndex = -1;
  for (const i in connections) {
    if (connections[i] === null) {
      playerIndex = i;
      break;
    }
  }

  socket.emit('player-number', playerIndex);

  if (playerIndex === -1) return;

  connections[playerIndex] = false;

  socket.broadcast.emit('player-connection', playerIndex);

  socket.on('disconnect', () => {
    connections[playerIndex] = null;
    socket.broadcast.emit('player-connection', playerIndex);
  });

  socket.on('player-ready', () => {
    socket.broadcast.emit('enemy-ready', playerIndex);
    connections[playerIndex] = true;
  });

  socket.on('check-players', () => {
    const players = [];
    for (const i in connections) {
      connections[i] === null ? players.push({ connected: false, ready: false }) : players.push({ connected: true, ready: connections[i] });
    }
    socket.emit('check-players', players);
  });

  socket.on('fire', id => {
    socket.broadcast.emit('fire', id);
  });

  socket.on('fire-reply', square => {
    socket.broadcast.emit('fire-reply', square);
  });

  setTimeout(() => {
    connections[playerIndex] = null;
    socket.emit('timeout');
    socket.disconnect();
  }, 600000);
});
