import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

export interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: string;
}

interface SystemMessage {
  content: string;
  timestamp: string;
}

interface RoomInfo {
  participantCount: number;
}

export function useSocket(roomId: string, username: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket>();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || '/', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { roomId, username });
      toast.success('Connected to chat');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from chat');
    });

    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('system-message', (message: SystemMessage) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: message.content,
          sender: 'System',
          timestamp: message.timestamp,
        },
      ]);
    });

    socket.on('room-info', (info: RoomInfo) => {
      setParticipantCount(info.participantCount);
    });

    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId, username });
        socketRef.current.disconnect();
      }
    };
  }, [roomId, username]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit('send-message', {
        roomId,
        message: content,
      });
    },
    [roomId, isConnected]
  );

  return {
    messages,
    isConnected,
    participantCount,
    sendMessage,
  };
}
