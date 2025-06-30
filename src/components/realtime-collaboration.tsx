/**
 * Real-time Collaboration Components
 * Qwik components for real-time features
 */

import { component$, useSignal, useVisibleTask$, useTask$, $ } from '@builder.io/qwik';
import type { WebSocketMessage, UserPresence } from '../lib/websocket-manager';

export interface CollaboratorCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
  lastUpdate: number;
}

export interface RealtimeCollaborationProps {
  roomId: string;
  userId: string;
  userName: string;
  onMessage?: (message: WebSocketMessage) => void;
  onCursorMove?: (cursor: CollaboratorCursor) => void;
}

export const RealtimeCollaboration = component$<RealtimeCollaborationProps>((props) => {
  const isConnected = useSignal(false);
  const collaborators = useSignal<UserPresence[]>([]);
  const cursors = useSignal<Map<string, CollaboratorCursor>>(new Map());
  const connectionStatus = useSignal<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Signals for callback communication outside reactive scopes
  const latestCursor = useSignal<CollaboratorCursor | null>(null);
  const latestMessage = useSignal<any>(null);
  
  // Extract primitive props to avoid serialization issues in $ functions
  const roomId = props.roomId;
  const userId = props.userId;
  const userName = props.userName;

  // Initialize WebSocket connection
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    // Track the primitive values
    track(() => roomId);
    track(() => userId);
    track(() => userName);

    if (!roomId || !userId) {
      return;
    }

    try {
      connectionStatus.value = 'connecting';
      
      const { webSocketManager } = await import('../lib/websocket-manager');
      
      // Connect to WebSocket
      await webSocketManager.connect(userId);
      
      // Join the room
      webSocketManager.joinRoom(roomId, {
        userName: userName,
        timestamp: Date.now()
      });

      connectionStatus.value = 'connected';
      isConnected.value = true;

      // Set up message handlers
      const unsubscribeMessage = webSocketManager.onMessage('cursor_move', (message) => {
        if (message.userId !== userId && message.roomId === roomId) {
          const cursor: CollaboratorCursor = {
            userId: message.userId!,
            x: message.payload.x,
            y: message.payload.y,
            color: message.payload.color || '#3b82f6',
            name: message.payload.name || 'Anonymous',
            lastUpdate: Date.now()
          };
          
          cursors.value = new Map(cursors.value.set(cursor.userId, cursor));
          
          // Signal the cursor move for external handling
          latestCursor.value = cursor;
        }
      });

      const unsubscribeComment = webSocketManager.onMessage('comment_added', (message) => {
        // Signal the message for external handling
        latestMessage.value = message;
      });

      const unsubscribeConnection = webSocketManager.onConnectionChange((connected) => {
        isConnected.value = connected;
        connectionStatus.value = connected ? 'connected' : 'disconnected';
      });

      const unsubscribePresence = webSocketManager.onPresenceChange((presence) => {
        collaborators.value = presence.filter(p => p.userId !== userId);
      });

      // Cleanup on unmount
      return () => {
        unsubscribeMessage();
        unsubscribeComment();
        unsubscribeConnection();
        unsubscribePresence();
        webSocketManager.leaveRoom(roomId);
      };

    } catch (error) {
      // console.error('Failed to connect to WebSocket:', error);
      connectionStatus.value = 'error';
    }
  });

  // Handle callback props outside reactive scopes
  // Note: Callback props commented to avoid Qwik serialization issues
  useTask$(({ track }) => {
    const cursor = track(() => latestCursor.value);
    if (cursor) {
      // Cursor update tracked internally
      // props.onCursorMove would cause serialization issues
    }
  });

  useTask$(({ track }) => {
    const message = track(() => latestMessage.value);
    if (message) {
      // Message tracked internally  
      // props.onMessage would cause serialization issues
    }
  });

  // Handle mouse movement for cursor tracking
  const handleMouseMove = $((event: MouseEvent) => {
    if (!isConnected.value) return;

    const loadWebSocket = async () => {
      const { webSocketManager } = await import('../lib/websocket-manager');
      
      webSocketManager.broadcastToRoom(roomId, 'cursor_move', {
        x: event.clientX,
        y: event.clientY,
        color: '#3b82f6',
        name: userName
      });
    };

    loadWebSocket().catch(() => {});
  });

  // Update presence status
  const updatePresence = $(async (status: 'online' | 'away' | 'offline') => {
    if (!isConnected.value) return;

    const { webSocketManager } = await import('../lib/websocket-manager');
    
    webSocketManager.updatePresence(status, {
      userName: userName,
      roomId: roomId
    });
  });

  // Note: sendComment functionality removed as it was unused
  // Can be restored if comment sending UI is implemented

  return (
    <div class="realtime-collaboration" onMouseMove$={handleMouseMove}>
      {/* Connection Status */}
      <div class={`connection-status ${connectionStatus.value}`}>
        <div class="flex items-center gap-2 px-3 py-1 rounded-full text-sm">
          <div class={`w-2 h-2 rounded-full ${
            connectionStatus.value === 'connected' ? 'bg-green-500' :
            connectionStatus.value === 'connecting' ? 'bg-yellow-500' :
            connectionStatus.value === 'error' ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
          <span>
            {connectionStatus.value === 'connected' ? 'Connected' :
             connectionStatus.value === 'connecting' ? 'Connecting...' :
             connectionStatus.value === 'error' ? 'Connection Error' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Collaborators List */}
      {collaborators.value.length > 0 && (
        <div class="collaborators-list">
          <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">
              Active Collaborators ({collaborators.value.length})
            </h3>
            <div class="space-y-2">
              {collaborators.value.map((collaborator) => (
                <div key={collaborator.userId} class="flex items-center gap-2">
                  <div class={`w-2 h-2 rounded-full ${
                    collaborator.status === 'online' ? 'bg-green-500' :
                    collaborator.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  <span class="text-sm text-gray-700">
                    {collaborator.metadata?.userName || collaborator.userId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collaborator Cursors */}
      <div class="collaborator-cursors">
        {Array.from(cursors.value.values()).map((cursor) => (
          <CollaboratorCursor key={cursor.userId} cursor={cursor} />
        ))}
      </div>

      {/* Collaboration Controls */}
      <div class="collaboration-controls">
        <div class="flex gap-2">
          <button
            class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            onClick$={() => updatePresence('online')}
          >
            Online
          </button>
          <button
            class="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            onClick$={() => updatePresence('away')}
          >
            Away
          </button>
        </div>
      </div>
    </div>
  );
});

export const CollaboratorCursor = component$<{ cursor: CollaboratorCursor }>((props) => {
  return (
    <div
      class="collaborator-cursor absolute pointer-events-none z-50"
      style={{
        left: `${props.cursor.x}px`,
        top: `${props.cursor.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div class="relative">
        {/* Cursor */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          class="drop-shadow-md"
          style={{ color: props.cursor.color }}
        >
          <path
            d="M0 0L0 16L4 12L8 20L12 18L8 10L16 10L0 0Z"
            fill="currentColor"
            stroke="white"
            stroke-width="1"
          />
        </svg>
        
        {/* Name Label */}
        <div
          class="absolute top-5 left-2 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
          style={{ backgroundColor: props.cursor.color }}
        >
          {props.cursor.name}
        </div>
      </div>
    </div>
  );
});

export const RealtimeComments = component$<{
  roomId: string;
  userId: string;
  userName: string;
}>((props) => {
  const comments = useSignal<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    userName: string;
    timestamp: number;
    userId: string;
  }>>([]);
  const showCommentForm = useSignal(false);
  const commentPosition = useSignal({ x: 0, y: 0 });
  const commentText = useSignal('');

  // Handle click to add comment
  const handleAddComment = $((event: MouseEvent) => {
    commentPosition.value = { x: event.clientX, y: event.clientY };
    showCommentForm.value = true;
  });

  // Submit comment
  const submitComment = $(async () => {
    if (!commentText.value.trim()) return;

    const { webSocketManager } = await import('../lib/websocket-manager');
    
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text: commentText.value,
      x: commentPosition.value.x,
      y: commentPosition.value.y,
      userName: props.userName,
      timestamp: Date.now(),
      userId: props.userId
    };

    // Add to local state
    comments.value = [...comments.value, comment];

    // Broadcast to other users
    webSocketManager.broadcastToRoom(props.roomId, 'comment_added', comment);

    // Reset form
    commentText.value = '';
    showCommentForm.value = false;
  });

  // Listen for incoming comments
  useVisibleTask$(async () => {
    const { webSocketManager } = await import('../lib/websocket-manager');
    
    const unsubscribe = webSocketManager.onMessage('comment_added', (message) => {
      if (message.userId !== props.userId && message.roomId === props.roomId) {
        const comment = message.payload;
        comments.value = [...comments.value, comment];
      }
    });

    return unsubscribe;
  });

  return (
    <div class="realtime-comments relative w-full h-full" onClick$={handleAddComment}>
      {/* Existing Comments */}
      {comments.value.map((comment) => (
        <div
          key={comment.id}
          class="absolute bg-yellow-200 border border-yellow-400 rounded-lg p-2 max-w-xs shadow-lg"
          style={{
            left: `${comment.x}px`,
            top: `${comment.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div class="text-xs font-semibold text-gray-800 mb-1">
            {comment.userName}
          </div>
          <div class="text-sm text-gray-700">{comment.text}</div>
          <div class="text-xs text-gray-500 mt-1">
            {new Date(comment.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}

      {/* Comment Form */}
      {showCommentForm.value && (
        <div
          class="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-50"
          style={{
            left: `${commentPosition.value.x}px`,
            top: `${commentPosition.value.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <textarea
            class="w-64 h-20 p-2 border border-gray-300 rounded resize-none text-sm"
            placeholder="Add a comment..."
            value={commentText.value}
            onInput$={(event) => {
              commentText.value = (event.target as HTMLTextAreaElement).value;
            }}
            autoFocus
          />
          <div class="flex gap-2 mt-2">
            <button
              class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              onClick$={submitComment}
            >
              Add Comment
            </button>
            <button
              class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              onClick$={() => {
                showCommentForm.value = false;
                commentText.value = '';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});