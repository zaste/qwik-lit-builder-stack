import * as Sentry from '@sentry/browser';
import { performanceMonitor } from '../../lib/monitoring';

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring() {
  const isDev = import.meta.env.DEV;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  // Sentry Error Tracking
  if (sentryDsn && !isDev) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration({
          tracingOrigins: ['localhost', /^\//],
        }),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: isDev ? 1.0 : 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  // Performance Monitoring
  performanceMonitor.trackWebVitals();

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // 
    Sentry.captureException(event.reason);
  });

  // Enhanced error logging
  window.addEventListener('error', (event) => {
    if (event.error) {
      // 
      
      // Log to Sentry
      Sentry.captureException(event.error);
    }
  });

  // 
}

// Export monitoring utilities
export { performanceMonitor } from '../../lib/monitoring';
export { Sentry };