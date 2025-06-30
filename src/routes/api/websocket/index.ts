/**
 * WebSocket API Handler
 * Handles WebSocket connections for real-time features
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import type { ApiResponse } from '../../../types/api';
import { logger } from '../../../lib/logger';

interface WebSocketConnection {
  id: string;
  userId?: string;
  rooms: Set<string>;
  lastSeen: number;
  socket: any; // WebSocket type varies by runtime
}

interface Room {
  id: string;
  connections: Set<string>;
  metadata: Record<string, any>;
  createdAt: number;
  lastActivity: number;
}

// In-memory storage for connections and rooms
// In production, use Redis or another persistent store
const connections = new Map<string, WebSocketConnection>();
const rooms = new Map<string, Room>();
const userToConnection = new Map<string, string>();

// Generate unique connection ID
function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Clean up inactive connections
function cleanupConnections(): void {
  const now = Date.now();
  const timeout = 60000; // 1 minute

  for (const [connId, conn] of connections.entries()) {
    if (now - conn.lastSeen > timeout) {
      // Remove from all rooms
      for (const roomId of conn.rooms) {
        const room = rooms.get(roomId);
        if (room) {
          room.connections.delete(connId);
          
          // Broadcast user left event
          if (conn.userId) {
            broadcastToRoom(roomId, {
              type: 'user_left',
              payload: { userId: conn.userId, roomId },
              timestamp: now,
              messageId: `msg_${now}_${Math.random().toString(36).slice(2)}`
            });
          }
          
          // Clean up empty rooms
          if (room.connections.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
      
      // Remove user mapping
      if (conn.userId) {
        userToConnection.delete(conn.userId);
      }
      
      connections.delete(connId);
    }
  }
}

// Broadcast message to all connections in a room
function broadcastToRoom(roomId: string, message: any): void {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const connId of room.connections) {
    const conn = connections.get(connId);
    if (conn && conn.socket) {
      try {
        conn.socket.send(JSON.stringify(message));
      } catch (error) {
        logger.error('WebSocket broadcast error', { connId, roomId }, error as Error);
      }
    }
  }
}

// Send message to specific user
function sendToUser(userId: string, message: any): void {
  const connId = userToConnection.get(userId);
  if (!connId) return;

  const conn = connections.get(connId);
  if (conn && conn.socket) {
    try {
      conn.socket.send(JSON.stringify(message));
    } catch (error) {
      logger.error('WebSocket send to user error', { userId }, error as Error);
    }
  }
}

// Handle WebSocket message
function handleMessage(connId: string, data: string): void {
  try {
    const message = JSON.parse(data);
    const conn = connections.get(connId);
    
    if (!conn) {
      logger.warn('Message from unknown connection', { connId });
      return;
    }

    conn.lastSeen = Date.now();

    switch (message.type) {
      case 'auth':
        handleAuth(connId, message.payload);
        break;
      
      case 'join_room':
        handleJoinRoom(connId, message.payload);
        break;
      
      case 'leave_room':
        handleLeaveRoom(connId, message.payload);
        break;
      
      case 'room_broadcast':
        handleRoomBroadcast(connId, message.payload);
        break;
      
      case 'direct_message':
        handleDirectMessage(connId, message.payload);
        break;
      
      case 'presence_update':
        handlePresenceUpdate(connId, message.payload);
        break;
      
      case 'heartbeat':
        handleHeartbeat(connId);
        break;
      
      default:
        logger.warn('Unknown message type', { type: message.type, connId });
    }
  } catch (error) {
    logger.error('WebSocket message handling error', { connId }, error as Error);
  }
}

function handleAuth(connId: string, payload: any): void {
  const conn = connections.get(connId);
  if (!conn) return;

  const { userId } = payload;
  
  if (userId) {
    // Remove previous connection for this user
    const previousConnId = userToConnection.get(userId);
    if (previousConnId && previousConnId !== connId) {
      const previousConn = connections.get(previousConnId);
      if (previousConn && previousConn.socket) {
        previousConn.socket.close(1000, 'New connection established');
      }
    }
    
    conn.userId = userId;
    userToConnection.set(userId, connId);
    
    logger.info('User authenticated', { userId, connId });
    
    // Send auth success
    conn.socket.send(JSON.stringify({
      type: 'auth_success',
      payload: { userId },
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
    }));
  }
}

function handleJoinRoom(connId: string, payload: any): void {
  const conn = connections.get(connId);
  if (!conn) return;

  const { roomId, metadata = {} } = payload;
  
  // Get or create room
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      connections: new Set(),
      metadata,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    rooms.set(roomId, room);
  }
  
  // Add connection to room
  room.connections.add(connId);
  conn.rooms.add(roomId);
  room.lastActivity = Date.now();
  
  logger.info('User joined room', { 
    userId: conn.userId, 
    roomId, 
    connId,
    roomSize: room.connections.size 
  });
  
  // Notify user they joined
  conn.socket.send(JSON.stringify({
    type: 'room_joined',
    payload: {
      roomId,
      users: Array.from(room.connections)
        .map(id => connections.get(id)?.userId)
        .filter(Boolean),
      metadata: room.metadata
    },
    timestamp: Date.now(),
    messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }));
  
  // Broadcast user joined to other room members
  if (conn.userId) {
    broadcastToRoom(roomId, {
      type: 'user_joined',
      payload: { userId: conn.userId, roomId },
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
    });
  }
}

function handleLeaveRoom(connId: string, payload: any): void {
  const conn = connections.get(connId);
  if (!conn) return;

  const { roomId } = payload;
  const room = rooms.get(roomId);
  
  if (room && conn.rooms.has(roomId)) {
    room.connections.delete(connId);
    conn.rooms.delete(roomId);
    room.lastActivity = Date.now();
    
    logger.info('User left room', { 
      userId: conn.userId, 
      roomId, 
      connId,
      roomSize: room.connections.size 
    });
    
    // Broadcast user left
    if (conn.userId) {
      broadcastToRoom(roomId, {
        type: 'user_left',
        payload: { userId: conn.userId, roomId },
        timestamp: Date.now(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
      });
    }
    
    // Clean up empty room
    if (room.connections.size === 0) {
      rooms.delete(roomId);
    }
    
    // Notify user they left
    conn.socket.send(JSON.stringify({
      type: 'room_left',
      payload: { roomId },
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
    }));
  }
}

function handleRoomBroadcast(connId: string, payload: any): void {
  const conn = connections.get(connId);
  if (!conn || !conn.userId) return;

  const { roomId, messageType, data } = payload;
  
  if (!conn.rooms.has(roomId)) {
    logger.warn('User attempted to broadcast to room they are not in', {
      userId: conn.userId,
      roomId
    });
    return;
  }
  
  broadcastToRoom(roomId, {
    type: messageType,
    payload: data,
    timestamp: Date.now(),
    userId: conn.userId,
    roomId,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
  });
}

function handleDirectMessage(connId: string, payload: any): void {
  const conn = connections.get(connId);
  if (!conn || !conn.userId) return;

  const { targetUserId, messageType, data } = payload;
  
  sendToUser(targetUserId, {
    type: messageType,
    payload: data,
    timestamp: Date.now(),
    userId: conn.userId,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
  });
}

function handlePresenceUpdate(connId: string, payload: any): void {
  const conn = connections.get(connId);
  if (!conn || !conn.userId) return;

  const { status, metadata } = payload;
  
  // Broadcast presence update to all rooms the user is in
  for (const roomId of conn.rooms) {
    broadcastToRoom(roomId, {
      type: 'presence_update',
      payload: {
        userId: conn.userId,
        status,
        metadata
      },
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
    });
  }
}

function handleHeartbeat(connId: string): void {
  const conn = connections.get(connId);
  if (!conn) return;

  conn.socket.send(JSON.stringify({
    type: 'heartbeat_response',
    payload: {},
    timestamp: Date.now(),
    messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }));
}

// WebSocket upgrade handler
export const onGet: RequestHandler = async ({ request }) => {
  try {
    // Check if this is a WebSocket upgrade request
    const upgradeHeader = request.headers.get('upgrade');
    
    if (upgradeHeader !== 'websocket') {
      return new Response('WebSocket endpoint', { status: 200 });
    }

    // For Cloudflare Workers, use Durable Objects or handle differently
    // This is a basic implementation that works in development
    if (typeof (globalThis as any).Deno !== 'undefined') {
      // Deno WebSocket upgrade
      const { socket, response } = (globalThis as any).Deno.upgradeWebSocket(request);
      
      const connId = generateConnectionId();
      const connection: WebSocketConnection = {
        id: connId,
        rooms: new Set(),
        lastSeen: Date.now(),
        socket
      };
      
      connections.set(connId, connection);
      
      socket.onopen = () => {
        logger.info('WebSocket connection opened', { connId });
      };
      
      socket.onmessage = (event: MessageEvent) => {
        handleMessage(connId, event.data);
      };
      
      socket.onclose = () => {
        logger.info('WebSocket connection closed', { connId });
        
        const conn = connections.get(connId);
        if (conn) {
          // Remove from all rooms
          for (const roomId of conn.rooms) {
            const room = rooms.get(roomId);
            if (room) {
              room.connections.delete(connId);
              
              if (conn.userId) {
                broadcastToRoom(roomId, {
                  type: 'user_left',
                  payload: { userId: conn.userId, roomId },
                  timestamp: Date.now(),
                  messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`
                });
              }
              
              if (room.connections.size === 0) {
                rooms.delete(roomId);
              }
            }
          }
          
          if (conn.userId) {
            userToConnection.delete(conn.userId);
          }
          
          connections.delete(connId);
        }
      };
      
      socket.onerror = (error: Event) => {
        logger.error('WebSocket error', { connId }, error as any);
      };
      
      return response;
    }
    
    // For other platforms, return info about WebSocket endpoint
    return new Response(JSON.stringify({
      error: 'WebSocket not supported in this environment',
      message: 'WebSocket endpoint available at /api/websocket'
    }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    logger.error('WebSocket upgrade error', {}, error as Error);
    
    return new Response(JSON.stringify({
      error: 'WebSocket upgrade failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Status endpoint
export const onPost: RequestHandler = async ({ json }) => {
  json(200, {
    success: true,
    data: {
      status: 'operational',
      connections: connections.size,
      rooms: rooms.size,
      users: userToConnection.size,
      timestamp: new Date().toISOString()
    }
  } as ApiResponse);
};

// Cleanup timer
setInterval(cleanupConnections, 30000); // Clean up every 30 seconds