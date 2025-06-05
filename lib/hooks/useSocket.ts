import { useEffect, useRef, useState, useCallback } from 'react';
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
  const eventSourceRef = useRef<EventSource>();

  useEffect(() => {
    const eventSource = new EventSource(`/api/rooms?roomId=${roomId}&username=${username}`);

    eventSource.onopen = () => {
      setIsConnected(true);
      toast.success('Connected to chat');
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      toast.error('Disconnected from chat');
    };

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    });

    eventSource.addEventListener('system', (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: data.content,
          sender: 'System',
          timestamp: data.timestamp,
        },
      ]);
    });

    eventSource.addEventListener('room-info', (event) => {
      const data = JSON.parse(event.data);
      setParticipantCount(data.participantCount);
    });

    eventSourceRef.current = eventSource;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        fetch(`/api/rooms?roomId=${roomId}&username=${username}`, { method: 'DELETE' });
      }
    };
  }, [roomId, username]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!isConnected) return;

      try {
        await fetch('/api/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId,
            message: content,
            username,
          }),
        });
      } catch (error) {
        toast.error('Failed to send message');
      }
    },
    [roomId, username, isConnected]
  );

  return {
    messages,
    isConnected,
    participantCount,
    sendMessage,
  };
}
