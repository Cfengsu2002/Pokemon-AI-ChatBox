// server.js
const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', socket => {
  console.log(`${socket.id} connected.`);

  socket.on('chatMessage', data => {
    if (!socket.username) {
      socket.username = data.handle;
      io.emit('systemMessage', `${socket.username} has joined the chat.`);
    }

    console.log(`${data.handle}: ${data.message}`);
    io.emit('chatMessage', data);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('systemMessage', `${socket.username} has left the chat.`);
      console.log(`${socket.username} disconnected.`);
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
