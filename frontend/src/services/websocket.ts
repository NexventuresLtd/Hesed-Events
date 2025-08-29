import type { ChatMessage } from "../types";

export interface WebSocketMessage {
  type: 'message' | 'error';
  message?: ChatMessage;
  error?: string;
}

export class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onMessageCallback?: (message: ChatMessage) => void;
  private onErrorCallback?: (error: string) => void;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;
  private roomName: string;
  private baseUrl: string;

  constructor(
    roomName: string,
    apiUrl = import.meta.env.VITE_API_BASE_URL.replace("/api", "") || 'http://localhost:8000',
    baseUrl = apiUrl.startsWith('http://')
        ? apiUrl.replace('http://', 'ws://')
        : apiUrl.startsWith('https://')
            ? apiUrl.replace('https://', 'wss://').replace('/api', '/')
            : apiUrl.replace('/api', '/')
  ) {
    this.roomName = roomName;
    this.baseUrl = baseUrl;
  }

  connect(
    onMessage: (message: ChatMessage) => void,
    onError?: (error: string) => void,
    onConnect?: () => void,
    onDisconnect?: () => void
  ) {
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;

    try {
      this.ws = new WebSocket(`${this.baseUrl}/ws/chat/${this.roomName}/`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnectCallback?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          if (data.type === 'message' && data.message) {
            // Convert backend message format to frontend format
            const backendMessage = data.message as any;
            const frontendMessage: ChatMessage = {
              id: backendMessage.id?.toString() || Date.now().toString(),
              senderId: backendMessage.sender?.toString() || '',
              senderName: backendMessage.sender_name || 'Unknown User',
              senderRole: backendMessage.sender_role || 'employee',
              content: backendMessage.content,
              timestamp: backendMessage.timestamp || new Date().toISOString(),
              chatType: backendMessage.chat_type as 'group' | 'private',
              recipientId: backendMessage.recipient?.toString() || undefined
            };
            this.onMessageCallback?.(frontendMessage);
          } else if (data.type === 'error' && data.error) {
            this.onErrorCallback?.(data.error);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.onErrorCallback?.('Failed to parse message');
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onDisconnectCallback?.();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onErrorCallback?.('Connection error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.onErrorCallback?.('Failed to connect');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.onMessageCallback) {
          this.connect(
            this.onMessageCallback,
            this.onErrorCallback,
            this.onConnectCallback,
            this.onDisconnectCallback
          );
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  sendMessage(content: string, senderId: string, recipientId?: string, chatType: 'group' | 'private' = 'group') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      message: content,
      sender_id: senderId,
      recipient_id: recipientId,
      chat_type: chatType
    };

    this.ws.send(JSON.stringify(message));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
