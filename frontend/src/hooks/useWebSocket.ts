import { useEffect, useRef, useState } from "react";
import { ChatWebSocketService } from "../services/websocket";
import type { ChatMessage } from "../types";

interface UseWebSocketProps {
  roomName: string;
  onMessage: (message: ChatMessage) => void;
  enabled?: boolean;
}

export function useWebSocket({ roomName, onMessage, enabled = true }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsServiceRef = useRef<ChatWebSocketService | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !roomName) {
      // Clean up existing connection if disabled
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Debounce connection changes to prevent rapid reconnections
    reconnectTimeoutRef.current = setTimeout(() => {
      // Clean up existing connection
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }

      // Create WebSocket service
      wsServiceRef.current = new ChatWebSocketService(roomName);

      // Connect to WebSocket
      wsServiceRef.current.connect(
        (message) => {
          onMessage(message);
        },
        (error) => {
          setError(error);
          console.error('WebSocket error:', error);
        },
        () => {
          setIsConnected(true);
          setError(null);
        },
        () => {
          setIsConnected(false);
        }
      );
    }, 300); // 300ms debounce

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [roomName, enabled, onMessage]);

  const sendMessage = (content: string, senderId: string, recipientId?: string, chatType: 'group' | 'private' = 'group') => {
    if (!wsServiceRef.current) {
      throw new Error('WebSocket service not initialized');
    }
    
    if (!wsServiceRef.current.isConnected()) {
      throw new Error('WebSocket is not connected');
    }

    wsServiceRef.current.sendMessage(content, senderId, recipientId, chatType);
  };

  return {
    isConnected,
    error,
    sendMessage
  };
}
