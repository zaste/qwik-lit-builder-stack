import { component$, useSignal, useVisibleTask$, useStore } from '@builder.io/qwik';
import { supabaseRealtime } from '~/lib/supabase';

interface CollaboratorCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

export const RealtimeCollaboration = component$<{
  roomId: string;
  userId: string;
  userName: string;
}>((props) => {
  const cursors = useStore<Record<string, CollaboratorCursor>>({});
  const channel = useSignal<any>(null);

  useVisibleTask$(({ cleanup }) => {
    // Initialize realtime channel
    const initRealtime = async () => {
      const ch = supabaseRealtime.channel(`room:${props.roomId}`);
      
      // Subscribe to cursor movements
      ch.on('broadcast', { event: 'cursor' }, (payload) => {
        if (payload.payload.userId !== props.userId) {
          cursors[payload.payload.userId] = payload.payload;
        }
      });

      // Subscribe to presence
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        console.log('Presence state:', state);
      });

      // Join the channel
      await ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await ch.track({
            userId: props.userId,
            userName: props.userName,
            onlineAt: new Date().toISOString(),
          });
        }
      });

      channel.value = ch;
    };

    initRealtime();

    // Track mouse movements
    const handleMouseMove = (e: MouseEvent) => {
      if (channel.value) {
        supabaseRealtime.broadcast(`room:${props.roomId}`, 'cursor', {
          userId: props.userId,
          x: e.clientX,
          y: e.clientY,
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          name: props.userName,
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    cleanup(() => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (channel.value) {
        supabaseRealtime.removeChannel(channel.value);
      }
    });
  });

  return (
    <>
      {/* Render other users' cursors */}
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          class="fixed pointer-events-none z-50 transition-all duration-100"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
          }}
        >
          {/* Cursor */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: cursor.color }}
          >
            <path
              d="M12 2L2 12L7 12L7 22L12 17L12 12L22 12L12 2Z"
              fill="currentColor"
              stroke="white"
              stroke-width="2"
            />
          </svg>
          {/* Name label */}
          <div
            class="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </>
  );
});