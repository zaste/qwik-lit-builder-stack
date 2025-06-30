/**
 * WebSocket Manager for Real-time Features
 * Production-grade WebSocket handling with reconnection and room management
 */

import { logger } from './logger';
import { addBreadcrumb } from './sentry';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  roomId?: string;
  messageId: string;
}

export interface Room {
  id: string;
  users: Set<string>;
  metadata: Record<string, any>;
  createdAt: number;
  lastActivity: number;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  metadata: Record<string, any>;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  roomCleanupInterval: number;
  userTimeoutMs: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private heartbeatTimer?: number;
  private reconnectTimer?: number;
  private roomCleanupTimer?: number;
  
  // Event listeners
  private messageHandlers: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private presenceHandlers: Set<(presence: UserPresence[]) => void> = new Set();
  
  // State management
  private currentUserId?: string;
  private currentRooms: Set<string> = new Set();
  private rooms: Map<string, Room> = new Map();
  private userPresence: Map<string, UserPresence> = new Map();
  private messageQueue: WebSocketMessage[] = [];

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: this.getWebSocketUrl(),
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      roomCleanupInterval: 60000,
      userTimeoutMs: 60000,
      ...config
    };

    this.startRoomCleanup();
  }

  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:3000/ws';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  // Connection management
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.currentUserId = userId;
      
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          logger.info('WebSocket connected', {
            userId,
            url: this.config.url
          });

          addBreadcrumb('WebSocket connected', 'websocket', { userId });
          
          // Send authentication message
          this.sendMessage({
            type: 'auth',
            payload: { userId },
            timestamp: Date.now(),
            messageId: this.generateMessageId()
          });

          // Start heartbeat
          this.startHeartbeat();
          
          // Process queued messages
          this.processMessageQueue();
          
          // Notify connection handlers
          this.connectionHandlers.forEach(handler => handler(true));
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error('WebSocket message parse error', {}, error as Error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.stopHeartbeat();
          
          logger.warn('WebSocket closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });

          addBreadcrumb('WebSocket closed', 'websocket', {
            code: event.code,
            reason: event.reason
          });
          
          // Notify connection handlers
          this.connectionHandlers.forEach(handler => handler(false));
          
          // Attempt reconnection
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          const errorObj = error instanceof Error ? error : new Error(`WebSocket error: ${error.type || 'Unknown error'}`);
          logger.error('WebSocket error', {}, errorObj);
          reject(errorObj);
        };

      } catch (error) {
        logger.error('WebSocket connection failed', {}, error as Error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.stopHeartbeat();
    this.stopReconnection();
    this.currentRooms.clear();
    
    logger.info('WebSocket disconnected', {
      userId: this.currentUserId
    });
  }

  // Message handling
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'presence_update':
        this.handlePresenceUpdate(message.payload);
        break;
      
      case 'room_joined':
        this.handleRoomJoined(message.payload);
        break;
      
      case 'room_left':
        this.handleRoomLeft(message.payload);
        break;
      
      case 'user_joined':
        this.handleUserJoined(message.payload);
        break;
      
      case 'user_left':
        this.handleUserLeft(message.payload);
        break;
      
      case 'heartbeat_response':
        // Heartbeat acknowledged
        break;
      
      default:
        // Dispatch to registered handlers
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              logger.error('Message handler error', {
                messageType: message.type
              }, error as Error);
            }
          });
        }
        break;
    }
  }

  sendMessage(message: Omit<WebSocketMessage, 'messageId'> & { messageId?: string }): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      messageId: message.messageId || this.generateMessageId()
    };

    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(fullMessage));
      } catch (error) {
        logger.error('WebSocket send error', {
          messageType: message.type
        }, error as Error);
        
        // Queue message for retry
        this.messageQueue.push(fullMessage);
      }
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(fullMessage);
    }
  }

  // Room management
  joinRoom(roomId: string, metadata?: Record<string, any>): void {
    if (this.currentRooms.has(roomId)) {
      return;
    }

    this.sendMessage({
      type: 'join_room',
      payload: { roomId, metadata },
      timestamp: Date.now(),
      userId: this.currentUserId,
      roomId
    });

    logger.info('Joining room', {
      roomId,
      userId: this.currentUserId
    });
  }

  leaveRoom(roomId: string): void {
    if (!this.currentRooms.has(roomId)) {
      return;
    }

    this.sendMessage({
      type: 'leave_room',
      payload: { roomId },
      timestamp: Date.now(),
      userId: this.currentUserId,
      roomId
    });

    this.currentRooms.delete(roomId);
    this.rooms.delete(roomId);

    logger.info('Leaving room', {
      roomId,
      userId: this.currentUserId
    });
  }

  // Real-time collaboration methods
  broadcastToRoom(roomId: string, type: string, payload: any): void {
    if (!this.currentRooms.has(roomId)) {
      logger.warn('Attempted to broadcast to room not joined', { roomId });
      return;
    }

    this.sendMessage({
      type: 'room_broadcast',
      payload: {
        roomId,
        messageType: type,
        data: payload
      },
      timestamp: Date.now(),
      userId: this.currentUserId,
      roomId
    });
  }

  sendToUser(targetUserId: string, type: string, payload: any): void {
    this.sendMessage({
      type: 'direct_message',
      payload: {
        targetUserId,
        messageType: type,
        data: payload
      },
      timestamp: Date.now(),
      userId: this.currentUserId
    });
  }

  // Presence management
  updatePresence(status: UserPresence['status'], metadata?: Record<string, any>): void {
    this.sendMessage({
      type: 'presence_update',
      payload: {
        status,
        metadata: metadata || {}
      },
      timestamp: Date.now(),
      userId: this.currentUserId
    });
  }

  // Event listeners
  onMessage(type: string, handler: (message: WebSocketMessage) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  onPresenceChange(handler: (presence: UserPresence[]) => void): () => void {
    this.presenceHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.presenceHandlers.delete(handler);
    };
  }

  // Private methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private processMessageQueue(): void {
    const queuedMessages = [...this.messageQueue];
    this.messageQueue = [];
    
    queuedMessages.forEach(message => {
      this.sendMessage(message);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'heartbeat',
          payload: {},
          timestamp: Date.now()
        });
      }
    }, this.config.heartbeatInterval) as unknown as number;
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    this.reconnectTimer = window.setTimeout(() => {
      logger.info('Attempting WebSocket reconnection', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.config.maxReconnectAttempts
      });

      if (this.currentUserId) {
        this.connect(this.currentUserId).catch(error => {
          logger.error('Reconnection failed', {}, error as Error);
        });
      }
    }, this.config.reconnectInterval) as unknown as number;
  }

  private stopReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private startRoomCleanup(): void {
    this.roomCleanupTimer = window.setInterval(() => {
      const now = Date.now();
      
      // Clean up inactive rooms
      for (const [roomId, room] of this.rooms.entries()) {
        if (now - room.lastActivity > this.config.userTimeoutMs) {
          this.rooms.delete(roomId);
        }
      }
      
      // Clean up offline users
      for (const [userId, presence] of this.userPresence.entries()) {
        if (now - presence.lastSeen > this.config.userTimeoutMs) {
          this.userPresence.delete(userId);
        }
      }
    }, this.config.roomCleanupInterval) as unknown as number;
  }

  // Message handlers
  private handlePresenceUpdate(payload: any): void {
    const presence: UserPresence = {
      userId: payload.userId,
      status: payload.status,
      lastSeen: Date.now(),
      metadata: payload.metadata || {}
    };
    
    this.userPresence.set(payload.userId, presence);
    
    // Notify presence handlers
    const allPresence = Array.from(this.userPresence.values());
    this.presenceHandlers.forEach(handler => handler(allPresence));
  }

  private handleRoomJoined(payload: any): void {
    this.currentRooms.add(payload.roomId);
    
    const room: Room = {
      id: payload.roomId,
      users: new Set(payload.users || []),
      metadata: payload.metadata || {},
      createdAt: payload.createdAt || Date.now(),
      lastActivity: Date.now()
    };
    
    this.rooms.set(payload.roomId, room);
  }

  private handleRoomLeft(payload: any): void {
    this.currentRooms.delete(payload.roomId);
    this.rooms.delete(payload.roomId);
  }

  private handleUserJoined(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      room.users.add(payload.userId);
      room.lastActivity = Date.now();
    }
  }

  private handleUserLeft(payload: any): void {
    const room = this.rooms.get(payload.roomId);
    if (room) {
      room.users.delete(payload.userId);
      room.lastActivity = Date.now();
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get userId(): string | undefined {
    return this.currentUserId;
  }

  get activeRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  get presence(): UserPresence[] {
    return Array.from(this.userPresence.values());
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    
    if (this.roomCleanupTimer) {
      clearInterval(this.roomCleanupTimer);
    }
    
    this.messageHandlers.clear();
    this.connectionHandlers.clear();
    this.presenceHandlers.clear();
    this.rooms.clear();
    this.userPresence.clear();
  }
}

// Global WebSocket manager instance
export const webSocketManager = new WebSocketManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    webSocketManager.destroy();
  });
}