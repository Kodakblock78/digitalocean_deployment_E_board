import { NextResponse } from 'next/server';

const encoder = new TextEncoder();
const rooms = new Map<string, Set<string>>();
const clients = new Map<string, ReadableStreamDefaultController>();

export const runtime = 'edge';

export async function GET(request: Request) {
  const room = new URL(request.url).searchParams.get('room');
  const username = new URL(request.url).searchParams.get('username');

  if (!room || !username) {
    return new NextResponse('Room and username are required', { status: 400 });
  }

  // Create SSE connection
  const stream = new ReadableStream({
    start(controller) {
      // Store client controller
      const clientId = Math.random().toString(36).slice(2);
      clients.set(clientId, controller);

      // Add client to room
      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room)?.add(clientId);

      // Send join message to room
      broadcastToRoom(room, {
        type: 'user-joined',
        data: {
          username,
          timestamp: new Date().toISOString(),
        },
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clients.delete(clientId);
        rooms.get(room)?.delete(clientId);
        if (rooms.get(room)?.size === 0) {
          rooms.delete(room);
        } else {
          broadcastToRoom(room, {
            type: 'user-left',
            data: {
              username,
              timestamp: new Date().toISOString(),
            },
          });
        }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: Request) {
  const { room, type, data } = await request.json();

  if (!room || !type || !data) {
    return new NextResponse('Invalid message format', { status: 400 });
  }

  broadcastToRoom(room, {
    type,
    data: {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    },
  });

  return new NextResponse('Message sent', { status: 200 });
}

function broadcastToRoom(room: string, message: any) {
  const roomClients = rooms.get(room);
  if (!roomClients) return;

  const encoded = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
  roomClients.forEach(clientId => {
    const controller = clients.get(clientId);
    try {
      controller?.enqueue(encoded);
    } catch (err) {
      console.error('Error sending message to client:', err);
    }
  });
}