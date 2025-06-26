import { component$, Slot, useStore, useVisibleTask$ } from '@builder.io/qwik';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export const ErrorBoundary = component$(() => {
  const state = useStore<ErrorBoundaryState>({
    hasError: false,
  });

  useVisibleTask$(() => {
    // Set up global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('ErrorBoundary caught:', event.error);
      state.hasError = true;
      state.error = event.error;
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  });

  if (state.hasError) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0">
              <svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900">Something went wrong</h3>
              <p class="mt-1 text-sm text-gray-500">
                {state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
          <div class="mt-4">
            <button
              onClick$={() => window.location.reload()}
              class="btn-primary w-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Slot />;
});