import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface Message {
  id: number;
  content: string;
  sender: string;
  timestamp: string;
}

export interface Room {
  id: string;
  name: string;
  participantCount: number;
  creator: string;
}

export function useSocket(roomId: string, username: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const eventSourceRef = useRef<EventSource>();

  useEffect(() => {
    // Initial fetch of available rooms
    fetch('/api/socket?list=true')
      .then(res => res.json())
      .then(data => setAvailableRooms(data.rooms))
      .catch(console.error);

    const eventSource = new EventSource(`/api/socket?room=${roomId}&username=${username}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      toast.success('Connected to chat');
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      toast.error('Connection lost');
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'message':
          setMessages(prev => [...prev, data.data]);
          break;
        case 'user-joined':
          toast.success(`${data.data.username} joined`);
          setParticipantCount(prev => prev + 1);
          break;
        case 'user-left':
          toast.info(`${data.data.username} left`);
          setParticipantCount(prev => Math.max(0, prev - 1));
          break;
        case 'rooms-list':
          setAvailableRooms(data.data);
          break;
      }
    };

    return () => {
      eventSourceRef.current?.close();
      setIsConnected(false);
    };
  }, [roomId, username]);

  const sendMessage = useCallback(async (content: string) => {
    if (!isConnected) {
      toast.error('Not connected');
      return;
    }

    try {
      const response = await fetch('/api/socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: roomId,
          type: 'message',
          data: {
            content,
            sender: username,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
    } catch (error) {
      toast.error('Failed to send message');
    }
  }, [roomId, username, isConnected]);

  return {
    messages,
    isConnected,
    participantCount,
    sendMessage,
    availableRooms,
  };
}
