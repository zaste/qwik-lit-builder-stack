/**
 * Error Reporting API Endpoint
 * Receives and processes client-side error reports
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import type { ApiResponse, ErrorResponse } from '../../../types/api';
import { z } from 'zod';

const ErrorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  context: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    route: z.string().optional(),
    timestamp: z.string(),
    userAgent: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['ui', 'api', 'auth', 'data', 'network', 'system'])
});

export const onPost: RequestHandler = async ({ json, request, platform }) => {
  try {
    const body = await request.json();
    const errorReport = ErrorReportSchema.parse(body);

    // Log error with structured format
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: errorReport.severity === 'critical' ? 'error' : 
             errorReport.severity === 'high' ? 'error' :
             errorReport.severity === 'medium' ? 'warn' : 'info',
      message: errorReport.message,
      category: errorReport.category,
      severity: errorReport.severity,
      context: errorReport.context,
      stack: errorReport.stack,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('cf-connecting-ip') || 
          request.headers.get('x-forwarded-for') || 
          'unknown'
    };

    // Log to console (captured by logging infrastructure)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(logEntry));

    // Store critical errors in KV for immediate attention
    if (errorReport.severity === 'critical' && platform?.env?.ERROR_LOGS) {
      const key = `critical_error_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await platform.env.ERROR_LOGS.put(key, JSON.stringify(logEntry), {
        expirationTtl: 7 * 24 * 60 * 60 // 7 days
      });
    }

    // Send to external error tracking service (placeholder for Sentry integration)
    await sendToErrorTracking(logEntry);

    json(200, { 
      success: true, 
      data: { errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2)}` }
    } as ApiResponse);

  } catch (_error) {
    // eslint-disable-next-line no-console
    console.error('Error processing error report:', _error);
    
    json(500, { 
      error: 'Failed to process error report' 
    } as ErrorResponse);
  }
};

async function sendToErrorTracking(logEntry: any): Promise<void> {
  try {
    // Send to Sentry if configured
    const sentryDsn = process.env.SENTRY_DSN;
    if (sentryDsn && logEntry.severity === 'critical') {
      // Real Sentry integration
      const sentryUrl = `${sentryDsn.replace('/sentry.io/', '/sentry.io/api/')}/store/`;
      
      await fetch(sentryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${sentryDsn.split('@')[0].split('//')[1]}`
        },
        body: JSON.stringify({
          message: logEntry.message,
          level: logEntry.level,
          platform: 'javascript',
          timestamp: logEntry.timestamp,
          tags: {
            category: logEntry.category,
            severity: logEntry.severity
          },
          extra: {
            context: logEntry.context,
            userAgent: logEntry.userAgent,
            ip: logEntry.ip
          },
          exception: logEntry.stack ? [{
            type: 'Error',
            value: logEntry.message,
            stacktrace: {
              frames: logEntry.stack.split('\n').map((line: string) => ({
                filename: 'unknown',
                function: line.trim(),
                lineno: 0
              }))
            }
          }] : undefined
        })
      });
    }
    
    // Also send to webhook if configured
    if (process.env.ERROR_WEBHOOK_URL && logEntry.severity === 'critical') {
      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Error: ${logEntry.message}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Category', value: logEntry.category, short: true },
              { title: 'Route', value: logEntry.context.route || 'unknown', short: true },
              { title: 'User Agent', value: logEntry.userAgent || 'unknown', short: false },
              { title: 'Stack Trace', value: logEntry.stack || 'No stack trace', short: false }
            ]
          }]
        })
      });
    }
  } catch (_error) {
    // Silently handle error tracking failures
  }
}

// Health check endpoint for error reporting system
export const onGet: RequestHandler = async ({ json }) => {
  json(200, {
    success: true,
    data: {
      service: 'error-reporting',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  } as ApiResponse);
};