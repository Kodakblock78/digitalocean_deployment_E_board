const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    transports: ['websocket', 'polling'],
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
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

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
