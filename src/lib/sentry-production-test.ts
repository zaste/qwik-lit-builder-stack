/**
 * Sentry Production Testing
 * Test error monitoring and reporting in production
 */

import { sentryService, initializeSentry } from './sentry';

export class SentryProductionTester {
  
  async initialize() {
    try {
      initializeSentry();
      console.log('✅ Sentry initialized for production testing');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
      return false;
    }
  }

  async testErrorCapture() {
    try {
      // Test basic error capture
      const testError = new Error('Production test error - this is intentional');
      const eventId = sentryService.captureError(testError, {
        component: 'production-tester',
        environment: 'production',
        testType: 'error-capture'
      });

      console.log('✅ Error captured with ID:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to capture error:', error);
      return false;
    }
  }

  async testMessageCapture() {
    try {
      // Test message capture
      const eventId = sentryService.captureMessage(
        'Production monitoring test message',
        'info',
        {
          component: 'production-tester',
          timestamp: new Date().toISOString(),
          testType: 'message-capture'
        }
      );

      console.log('✅ Message captured with ID:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to capture message:', error);
      return false;
    }
  }

  async testUserContext() {
    try {
      // Test user context setting
      sentryService.setUser({
        id: 'test-user-123',
        email: 'test@production-monitor.com',
        username: 'production-tester'
      });

      console.log('✅ User context set successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to set user context:', error);
      return false;
    }
  }

  async testBreadcrumbs() {
    try {
      // Test breadcrumb functionality
      sentryService.addBreadcrumb(
        'Production test started',
        'test',
        {
          timestamp: new Date().toISOString(),
          level: 'info'
        }
      );

      sentryService.addBreadcrumb(
        'Running Sentry functionality tests',
        'test',
        {
          timestamp: new Date().toISOString(),
          level: 'info'
        }
      );

      console.log('✅ Breadcrumbs added successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to add breadcrumbs:', error);
      return false;
    }
  }

  async runCompleteTest() {
    console.log('🧪 Starting Sentry production testing...\n');

    const results = {
      initialization: await this.initialize(),
      errorCapture: await this.testErrorCapture(),
      messageCapture: await this.testMessageCapture(),
      userContext: await this.testUserContext(),
      breadcrumbs: await this.testBreadcrumbs()
    };

    const successful = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    console.log(`\n📊 Sentry Testing Results:`);
    console.log(`   Successful: ${successful}/${total}`);
    console.log(`   Success Rate: ${((successful / total) * 100).toFixed(1)}%`);

    if (successful === total) {
      console.log('✅ All Sentry tests passed!');
    } else {
      console.log('⚠️ Some Sentry tests failed - check configuration');
    }

    return results;
  }
}

// Export for use in other modules
export const sentryTester = new SentryProductionTester();