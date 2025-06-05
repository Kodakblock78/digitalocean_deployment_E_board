// pages/api/socket.ts

import { NextApiRequest, NextApiResponse } from 'next';

const clients = new Map<string, Set<NextApiResponse>>();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    const { room, username } = req.query;
    if (!room || !username) {
      return res.status(400).end('Missing room or username');
    }

    const roomId = room.toString();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    if (!clients.has(roomId)) {
      clients.set(roomId, new Set());
    }

    clients.get(roomId)!.add(res);

    broadcast(roomId, {
      type: 'user-joined',
      data: { username, timestamp: new Date().toISOString() },
    });

    req.on('close', () => {
      clients.get(roomId)!.delete(res);
      broadcast(roomId, {
        type: 'user-left',
        data: { username, timestamp: new Date().toISOString() },
      });
    });
  }

  else if (method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const { room, type, data } = JSON.parse(body);
        if (!room || !type || !data) return res.status(400).end('Invalid format');

        broadcast(room, {
          type,
          data: {
            ...data,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
          },
        });

        res.status(200).end('OK');
      } catch (err) {
        res.status(500).end('Error parsing body');
      }
    });
  }

  else {
    res.status(405).end('Method not allowed');
  }
}

function broadcast(roomId: string, message: any) {
  const msg = `data: ${JSON.stringify(message)}\n\n`;
  const roomClients = clients.get(roomId);
  if (!roomClients) return;

  for (const client of roomClients) {
    try {
      client.write(msg);
    } catch {
      // Ignore broken pipes
    }
  }
}
