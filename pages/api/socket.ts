import { NextApiRequest, NextApiResponse } from 'next';

interface RoomInfo {
  id: string;
  name: string;
  creator: string;
  participants: Set<string>;
  createdAt: string;
}

const clients = new Map<string, Set<NextApiResponse>>();
const rooms = new Map<string, RoomInfo>();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Handle GET rooms list request
  if (method === 'GET' && req.query.list === 'true') {
    return res.json({
      rooms: Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        creator: room.creator,
        participantCount: room.participants.size,
        createdAt: room.createdAt
      }))
    });
  }

  // Handle SSE connection
  if (method === 'GET') {
    const { room, username } = req.query;
    if (!room || !username) {
      return res.status(400).end('Missing room or username');
    }

    const roomId = room.toString();
    const userName = username.toString();

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        name: roomId,
        creator: userName,
        participants: new Set([userName]),
        createdAt: new Date().toISOString()
      });
    } else {
      rooms.get(roomId)?.participants.add(userName);
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Add client to room
    if (!clients.has(roomId)) {
      clients.set(roomId, new Set());
    }
    clients.get(roomId)!.add(res);

    // Broadcast updated room list
    broadcastRoomsList();

    // Notify room about new user
    broadcast(roomId, {
      type: 'user-joined',
      data: { username: userName, timestamp: new Date().toISOString() }
    });

    // Clean up on disconnect
    req.on('close', () => {
      clients.get(roomId)?.delete(res);
      const room = rooms.get(roomId);
      if (room) {
        room.participants.delete(userName);
        if (room.participants.size === 0) {
          rooms.delete(roomId);
        }
      }
      broadcastRoomsList();
      broadcast(roomId, {
        type: 'user-left',
        data: { username: userName, timestamp: new Date().toISOString() }
      });
    });
  }

  // Handle POST (messages)
  else if (method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const { room, type, data } = JSON.parse(body);
        if (!room || !type || !data) {
          return res.status(400).end('Invalid message format');
        }

        broadcast(room, {
          type,
          data: {
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString(),
          }
        });

        res.status(200).end();
      } catch (err) {
        res.status(500).end('Error processing message');
      }
    });
  }

  else {
    res.status(405).end('Method not allowed');
  }
}

function broadcast(roomId: string, message: any) {
  const roomClients = clients.get(roomId);
  if (!roomClients) return;

  const eventData = `data: ${JSON.stringify(message)}\n\n`;
  for (const client of roomClients) {
    try {
      client.write(eventData);
    } catch {
      // Ignore write errors
    }
  }
}

function broadcastRoomsList() {
  const roomsList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    creator: room.creator,
    participantCount: room.participants.size,
    createdAt: room.createdAt
  }));

  // Broadcast to all connected clients in all rooms
  for (const [_, roomClients] of clients) {
    const eventData = `data: ${JSON.stringify({ 
      type: 'rooms-list', 
      data: roomsList 
    })}\n\n`;
    
    for (const client of roomClients) {
      try {
        client.write(eventData);
      } catch {
        // Ignore write errors
      }
    }
  }
}