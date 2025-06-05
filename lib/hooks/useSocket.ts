import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export function useSocket(roomId: string, username: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource>();

  useEffect(() => {
    const eventSource = new EventSource(`/api/socket?room=${roomId}&username=${username}`);
    eventSourceRef.current = eventSource;
    setIsConnected(true);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'message':
          setMessages((prev) => [...prev, data.data]);
          break;
        case 'user-joined':
          toast.success(`${data.data.username} joined the room`);
          setParticipantCount((prev) => prev + 1);
          break;
        case 'user-left':
          toast.info(`${data.data.username} left the room`);
          setParticipantCount((prev) => Math.max(0, prev - 1));
          break;
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      toast.error('Connection lost. Trying to reconnect...');
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [roomId, username]);

  const sendMessage = useCallback(
    async (content: string) => {
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

        if (!response.ok) {
          throw new Error('Failed to send message');
        }
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
