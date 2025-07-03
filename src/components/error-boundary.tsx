/**
 * Error Boundary Component for Qwik
 * Catches and handles React-style errors in Qwik components
 */

import { component$, useSignal, useTask$, Slot, $ } from '@builder.io/qwik';
import { logger } from '../lib/logger';

interface ErrorBoundaryProps {
  fallback?: any;
  onError?: (error: Error, errorInfo: any) => void;
}

export const ErrorBoundary = component$<ErrorBoundaryProps>((props) => {
  const hasError = useSignal(false);
  const errorMessage = useSignal('');
  const errorDetails = useSignal<any>(null);

  // Error boundary implementation - handles errors and updates state
  const handleError = $((error: Error, errorInfo?: any) => {
    hasError.value = true;
    errorMessage.value = error.message;
    errorDetails.value = errorInfo;
    
    // Lazy load error handler to reduce bundle size
    import('../lib/error-handler').then(({ handleUIError }) => {
      handleUIError(error, {
        metadata: {
          component: 'ErrorBoundary',
          details: errorInfo
        }
      });
    }).catch((_error) => {
      logger.error('Failed to load error handler', { error: _error instanceof Error ? _error.message : String(_error) });
    });
  });

  // Track errors and call onError prop when error state changes  
  useTask$(({ track }) => {
    track(() => hasError.value);
    // Note: onError prop handling moved outside $ scope to avoid serialization issues
  });

  // Handle onError prop outside of reactive scope to avoid serialization issues
  if (hasError.value && props.onError) {
    // Use queueMicrotask to ensure this runs after state update
    queueMicrotask(() => {
      const error = new Error(errorMessage.value);
      props.onError?.(error, errorDetails.value);
    });
  }

  // Set up global error listener to catch unhandled errors
  useTask$(() => {
    if (typeof window !== 'undefined') {
      const errorHandler = (event: ErrorEvent) => {
        handleError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      };

      const rejectionHandler = (event: PromiseRejectionEvent) => {
        handleError(new Error(event.reason), {
          type: 'unhandledrejection',
          reason: event.reason
        });
      };

      window.addEventListener('error', errorHandler);
      window.addEventListener('unhandledrejection', rejectionHandler);

      return () => {
        window.removeEventListener('error', errorHandler);
        window.removeEventListener('unhandledrejection', rejectionHandler);
      };
    }
  });

  if (hasError.value) {
    if (props.fallback) {
      return props.fallback;
    }

    return (
      <div class="error-boundary">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div class="flex items-center mb-4">
            <svg class="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 class="text-lg font-semibold text-red-800">Something went wrong</h3>
          </div>
          
          <p class="text-red-700 mb-4">
            We encountered an unexpected error. The error has been reported and our team will investigate.
          </p>
          
          <details class="mb-4">
            <summary class="cursor-pointer text-red-600 hover:text-red-800 font-medium">
              Error Details
            </summary>
            <div class="mt-2 p-3 bg-red-100 rounded border font-mono text-sm text-red-800">
              <p><strong>Message:</strong> {errorMessage.value}</p>
              {errorDetails.value && (
                <pre class="mt-2 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(errorDetails.value, null, 2)}
                </pre>
              )}
            </div>
          </details>
          
          <div class="flex gap-3">
            <button
              class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              onClick$={() => {
                hasError.value = false;
                errorMessage.value = '';
                errorDetails.value = null;
              }}
            >
              Try Again
            </button>
            <button
              class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              onClick$={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expose handleError for manual error reporting
  (ErrorBoundary as any).reportError = handleError;

  return <Slot />;
});

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (WrappedComponent: any, errorBoundaryProps?: ErrorBoundaryProps) => {
  const fallbackProp = errorBoundaryProps?.fallback;
  
  return component$((props: any) => {
    // Create a simple error handler without serialization issues
    const wrappedErrorHandler = $((_error: Error, _errorInfo: any) => {
      // Basic error logging without serializing the onError function
      // eslint-disable-next-line no-console
      
    });
    
    return (
      <ErrorBoundary 
        fallback={fallbackProp}
        onError={wrappedErrorHandler}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  });
};

// Specialized error boundaries for different contexts
export const APIErrorBoundary = component$<{ children?: any }>(() => {
  // Define the error handler outside the JSX to avoid serialization issues
  const apiErrorHandler = $((error: Error) => {
    // Lazy load error handler for API errors
    import('../lib/error-handler').then(({ handleUIError }) => {
      handleUIError(error, {
        metadata: { context: 'API_REQUEST' }
      });
    }).catch((_error) => {
      logger.error('Failed to load error handler', { error: _error instanceof Error ? _error.message : String(_error) });
    });
  });

  return (
    <ErrorBoundary
      onError={apiErrorHandler}
      fallback={
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-yellow-800">Unable to load data. Please try refreshing the page.</p>
          </div>
        </div>
      }
    >
      <Slot />
    </ErrorBoundary>
  );
});

export const ComponentErrorBoundary = component$<{ componentName: string; children?: any }>((props) => {
  // Define the error handler outside the JSX to avoid serialization issues
  const componentErrorHandler = $((error: Error) => {
    // Lazy load error handler for component errors
    import('../lib/error-handler').then(({ handleUIError }) => {
      handleUIError(error, {
        metadata: { 
          context: 'COMPONENT_RENDER',
          componentName: props.componentName 
        }
      });
    }).catch((_error) => {
      logger.error('Failed to load error handler', { error: _error instanceof Error ? _error.message : String(_error) });
    });
  });

  return (
    <ErrorBoundary
      onError={componentErrorHandler}
      fallback={
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 m-2">
          <p class="text-gray-600 text-sm">
            Component "{props.componentName}" failed to render
          </p>
        </div>
      }
    >
      <Slot />
    </ErrorBoundary>
  );
});