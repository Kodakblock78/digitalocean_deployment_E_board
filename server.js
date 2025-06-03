const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Store active rooms and their participants
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let userRoom = null;
    let username = null;

    socket.on('join-room', ({ roomId, username: userName }) => {
      userRoom = roomId;
      username = userName;
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);
      
      // Send welcome message and room info
      io.to(roomId).emit('system-message', {
        content: `${userName} joined the room`,
        timestamp: new Date().toISOString(),
      });
      
      io.to(roomId).emit('room-info', {
        participantCount: rooms.get(roomId).size
      });
      
      console.log(`${socket.id} (${userName}) joined room ${roomId}`);
    });

    socket.on('send-message', ({ roomId, message }) => {
      if (userRoom && username) {
        io.to(roomId).emit('new-message', {
          id: Date.now(),
          content: message,
          sender: username,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (userRoom && username) {
        const room = rooms.get(userRoom);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            rooms.delete(userRoom);
          } else {
            io.to(userRoom).emit('system-message', {
              content: `${username} left the room`,
              timestamp: new Date().toISOString(),
            });
            io.to(userRoom).emit('room-info', {
              participantCount: room.size
            });
          }
        }
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
});
