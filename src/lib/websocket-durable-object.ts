/**
 * WebSocket Durable Object for Cloudflare Workers
 * Production-ready real-time infrastructure
 */

import type { DurableObjectState } from '@cloudflare/workers-types';

interface Connection {
  id: string;
  webSocket: WebSocket;
  userId?: string;
  rooms: Set<string>;
  lastSeen: number;
  metadata: Record<string, any>;
}

interface Room {
  id: string;
  connections: Set<string>;
  createdAt: number;
  metadata: Record<string, any>;
}

interface Message {
  id: string;
  type: string;
  payload: any;
  from: string;
  to?: string;
  room?: string;
  timestamp: number;
}

export class WebSocketDurableObject {
  private state: DurableObjectState;
  private connections: Map<string, Connection>;
  private rooms: Map<string, Room>;
  private messageHistory: Message[];
  private readonly MAX_HISTORY = 100;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.connections = new Map();
    this.rooms = new Map();
    this.messageHistory = [];
    
    // Load persisted state
    this.loadPersistedState();
    
    // Cleanup inactive connections every 5 minutes
    setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocketUpgrade(request);
    }
    
    if (url.pathname === '/api/rooms') {
      return this.handleRoomsAPI();
    }
    
    if (url.pathname === '/api/connections') {
      return this.handleConnectionsAPI();
    }
    
    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    const connectionId = this.generateId();
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    server.accept();
    
    const connection: Connection = {
      id: connectionId,
      webSocket: server,
      userId: userId || undefined,
      rooms: new Set(),
      lastSeen: Date.now(),
      metadata: {}
    };

    this.connections.set(connectionId, connection);

    server.addEventListener('message', async (event) => {
      await this.handleMessage(connectionId, event.data);
    });

    server.addEventListener('close', () => {
      this.handleDisconnection(connectionId);
    });

    server.addEventListener('error', (_error) => {
      // console.error('WebSocket error:', error);
      this.handleDisconnection(connectionId);
    });

    // Send connection confirmation
    server.send(JSON.stringify({
      type: 'connection_established',
      connectionId,
      timestamp: Date.now()
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async handleMessage(connectionId: string, data: string | ArrayBuffer): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.lastSeen = Date.now();

    try {
      const message = typeof data === 'string' ? JSON.parse(data) : JSON.parse(new TextDecoder().decode(data));
      
      switch (message.type) {
        case 'join_room':
          await this.handleJoinRoom(connectionId, message.roomId, message.metadata);
          break;
          
        case 'leave_room':
          await this.handleLeaveRoom(connectionId, message.roomId);
          break;
          
        case 'send_message':
          await this.handleSendMessage(connectionId, message);
          break;
          
        case 'ping':
          connection.webSocket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
          
        default:
          // console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      // console.error('Error handling message:', error);
    }
  }

  private async handleJoinRoom(connectionId: string, roomId: string, metadata?: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        connections: new Set(),
        createdAt: Date.now(),
        metadata: metadata || {}
      });
    }

    const room = this.rooms.get(roomId)!;
    room.connections.add(connectionId);
    connection.rooms.add(roomId);

    // Notify room members
    const joinMessage: Message = {
      id: this.generateId(),
      type: 'user_joined',
      payload: {
        connectionId,
        userId: connection.userId,
        metadata: connection.metadata
      },
      from: connectionId,
      room: roomId,
      timestamp: Date.now()
    };

    await this.broadcastToRoom(roomId, joinMessage, connectionId);
    
    // Send confirmation to joiner
    connection.webSocket.send(JSON.stringify({
      type: 'room_joined',
      roomId,
      connectionCount: room.connections.size,
      timestamp: Date.now()
    }));

    await this.persistState();
  }

  private async handleLeaveRoom(connectionId: string, roomId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    const room = this.rooms.get(roomId);
    
    if (!connection || !room) return;

    room.connections.delete(connectionId);
    connection.rooms.delete(roomId);

    // Clean up empty rooms
    if (room.connections.size === 0) {
      this.rooms.delete(roomId);
    }

    // Notify remaining room members
    const leaveMessage: Message = {
      id: this.generateId(),
      type: 'user_left',
      payload: {
        connectionId,
        userId: connection.userId
      },
      from: connectionId,
      room: roomId,
      timestamp: Date.now()
    };

    await this.broadcastToRoom(roomId, leaveMessage, connectionId);
    
    connection.webSocket.send(JSON.stringify({
      type: 'room_left',
      roomId,
      timestamp: Date.now()
    }));

    await this.persistState();
  }

  private async handleSendMessage(connectionId: string, messageData: any): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const message: Message = {
      id: this.generateId(),
      type: messageData.messageType || 'message',
      payload: messageData.payload,
      from: connectionId,
      to: messageData.to,
      room: messageData.room,
      timestamp: Date.now()
    };

    // Store in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory.shift();
    }

    // Send message
    if (message.to) {
      // Direct message
      await this.sendDirectMessage(message);
    } else if (message.room) {
      // Room message
      await this.broadcastToRoom(message.room, message);
    }

    await this.persistState();
  }

  private async broadcastToRoom(roomId: string, message: Message, excludeConnectionId?: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageString = JSON.stringify(message);
    
    for (const connectionId of room.connections) {
      if (connectionId === excludeConnectionId) continue;
      
      const connection = this.connections.get(connectionId);
      if (connection) {
        try {
          connection.webSocket.send(messageString);
        } catch (error) {
          // console.error('Error sending to connection:', error);
          // Clean up dead connection
          this.handleDisconnection(connectionId);
        }
      }
    }
  }

  private async sendDirectMessage(message: Message): Promise<void> {
    if (!message.to) return;
    
    const connection = this.connections.get(message.to);
    if (connection) {
      try {
        connection.webSocket.send(JSON.stringify(message));
      } catch (error) {
        // console.error('Error sending direct message:', error);
        this.handleDisconnection(message.to);
      }
    }
  }

  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from all rooms
    for (const roomId of connection.rooms) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.connections.delete(connectionId);
        
        // Notify room members
        const leaveMessage: Message = {
          id: this.generateId(),
          type: 'user_disconnected',
          payload: {
            connectionId,
            userId: connection.userId
          },
          from: connectionId,
          room: roomId,
          timestamp: Date.now()
        };

        this.broadcastToRoom(roomId, leaveMessage, connectionId);

        // Clean up empty rooms
        if (room.connections.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }

    this.connections.delete(connectionId);
    this.persistState();
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastSeen > timeout) {
        this.handleDisconnection(connectionId);
      }
    }
  }

  private async handleRoomsAPI(): Promise<Response> {
    const rooms = Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      connectionCount: room.connections.size,
      createdAt: room.createdAt,
      metadata: room.metadata
    }));

    return new Response(JSON.stringify({ rooms }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleConnectionsAPI(): Promise<Response> {
    const connections = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      userId: conn.userId,
      roomCount: conn.rooms.size,
      lastSeen: conn.lastSeen,
      metadata: conn.metadata
    }));

    return new Response(JSON.stringify({ 
      connections,
      totalConnections: connections.length 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const roomsData = await this.state.storage.get('rooms');
      if (roomsData) {
        this.rooms = new Map(roomsData as any);
      }

      const historyData = await this.state.storage.get('messageHistory');
      if (historyData) {
        this.messageHistory = historyData as Message[];
      }
    } catch (error) {
      // console.error('Error loading persisted state:', error);
    }
  }

  private async persistState(): Promise<void> {
    try {
      await this.state.storage.put('rooms', Array.from(this.rooms.entries()));
      await this.state.storage.put('messageHistory', this.messageHistory);
    } catch (error) {
      // console.error('Error persisting state:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export for Cloudflare Workers
export default {
  async fetch(): Promise<any> {
    // TODO: Complete Durable Object integration
    // This is a placeholder for the WebSocket Durable Object implementation
    // The full implementation would need proper type handling between
    // Cloudflare Workers types and standard Web API types
    
    return new Response('WebSocket Durable Object not yet integrated', { 
      status: 501 
    });
  }
};