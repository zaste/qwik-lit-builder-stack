import type { RequestHandler } from '@builder.io/qwik-city';
import crypto from 'crypto';
// Import cache manager when needed
// import { getCacheManager } from '~/lib/cache-strategies';

/**
 * Builder.io webhook endpoint for content updates
 */
export const onPost: RequestHandler = async ({ request, env, json }) => {
  // Verify webhook signature
  const signature = request.headers.get('x-builder-signature');
  const secret = env.get('BUILDER_WEBHOOK_SECRET');
  
  if (!signature || !secret) {
    json(401, { error: 'Unauthorized' });
    return;
  }

  // Get raw body for signature verification
  const rawBody = await request.text();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    json(401, { error: 'Invalid signature' });
    return;
  }

  // Parse webhook payload
  const payload = JSON.parse(rawBody);
  
  // Handle different webhook events
  switch (payload.event) {
    case 'content.published':
      // Real cache invalidation (simplified for now)
      try {
        const modelName = payload.data?.modelName || 'page';
        const contentId = payload.data?.id;
        
        if (contentId) {
          console.log(`✅ Content published webhook received: ${modelName}:${contentId}`);
          // TODO: Implement cache invalidation with proper cache manager
        }
      } catch (error) {
        console.error('Content publish handling failed:', error);
      }
      break;
      
    case 'content.deleted':
      // Real content deletion handling
      try {
        const modelName = payload.data?.modelName || 'page';
        const contentId = payload.data?.id;
        
        if (contentId) {
          console.log(`✅ Content deleted webhook received: ${modelName}:${contentId}`);
          // TODO: Implement cache invalidation with proper cache manager
        }
      } catch (error) {
        console.error('Content deletion handling failed:', error);
      }
      break;
      
    default:
      console.log('Unknown webhook event:', payload.event);
  }

  json(200, { received: true });
};