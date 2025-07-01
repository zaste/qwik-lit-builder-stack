import { component$, useStore, useTask$ } from '@builder.io/qwik';
import { RateLimitError } from '~/lib/errors';

interface RateLimiterState {
  requests: number[];
  blocked: boolean;
  retryAfter?: number;
}

export const useRateLimiter = (maxRequests = 10, windowMs = 60000) => {
  const state = useStore<RateLimiterState>({
    requests: [],
    blocked: false,
  });

  useTask$(({ cleanup }) => {
    // Clean up old requests periodically
    const interval = setInterval(() => {
      const now = Date.now();
      state.requests = state.requests.filter(time => now - time < windowMs);
      
      if (state.blocked && state.requests.length < maxRequests) {
        state.blocked = false;
        state.retryAfter = undefined;
      }
    }, 1000);

    cleanup(() => clearInterval(interval));
  });

  const checkLimit = () => {
    const now = Date.now();
    
    // Remove old requests
    state.requests = state.requests.filter(time => now - time < windowMs);
    
    if (state.requests.length >= maxRequests) {
      state.blocked = true;
      const oldestRequest = Math.min(...state.requests);
      state.retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      throw new RateLimitError(state.retryAfter);
    }
    
    // Add current request
    state.requests.push(now);
  };

  return {
    checkLimit,
    isBlocked: state.blocked,
    retryAfter: state.retryAfter,
    remaining: maxRequests - state.requests.length,
  };
};

export const RateLimitDisplay = component$<{
  blocked: boolean;
  retryAfter?: number;
}>((props) => {
  if (!props.blocked) return null;

  return (
    <div class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
      <strong class="font-bold">Rate limit exceeded!</strong>
      <span class="block sm:inline">
        {props.retryAfter
          ? ` Please try again in ${props.retryAfter} seconds.`
          : ' Please slow down your requests.'}
      </span>
    </div>
  );
});