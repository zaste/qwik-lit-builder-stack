import * as Sentry from '@sentry/browser';
import { datadogLogs } from '@datadog/browser-logs';
import { performanceMonitor } from '~/lib/monitoring';

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring() {
  const isDev = import.meta.env.DEV;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const datadogToken = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;

  // Sentry Error Tracking
  if (sentryDsn && !isDev) {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      integrations: [
        new Sentry.BrowserTracing({
          tracingOrigins: ['localhost', /^\//],
        }),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: isDev ? 1.0 : 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  // Datadog Logging
  if (datadogToken && !isDev) {
    datadogLogs.init({
      clientToken: datadogToken,
      site: 'datadoghq.com',
      service: 'qwik-lit-builder-app',
      env: import.meta.env.MODE,
      forwardErrorsToLogs: true,
      forwardConsoleLogs: ['error', 'warn'],
      sampleRate: 100,
    });
  }

  // Performance Monitoring
  performanceMonitor.trackWebVitals();

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection:', event.reason);
    Sentry.captureException(event.reason);
  });

  // Enhanced error logging
  window.addEventListener('error', (event) => {
    if (event.error) {
      // eslint-disable-next-line no-console
      console.error('Global error:', event.error);

      // Log to Datadog
      if (window.datadog) {
        datadogLogs.logger.error('Global error', {
          error: event.error.message,
          stack: event.error.stack,
          url: window.location.href,
        });
      }
    }
  });

  console.log('🔍 Monitoring services initialized');
}

// Export monitoring utilities
export { performanceMonitor } from '~/lib/monitoring';
export { Sentry };
export { datadogLogs };
