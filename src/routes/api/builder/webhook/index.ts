import type { RequestHandler } from '@builder.io/qwik-city';
import crypto from 'crypto';

/**
 * Builder.io webhook endpoint for content updates
 */
export const onPost: RequestHandler = async ({ request, env, json }) => {
  // Verify webhook signature
  const signature = request.headers.get('x-builder-signature');
  const secret = env.get('BUILDER_WEBHOOK_SECRET');
  
  if (!signature || !secret) {
    return json(401, { error: 'Unauthorized' });
  }

  // Get raw body for signature verification
  const rawBody = await request.text();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return json(401, { error: 'Invalid signature' });
  }

  // Parse webhook payload
  const payload = JSON.parse(rawBody);
  
  // Handle different webhook events
  switch (payload.event) {
    case 'content.published':
      // Invalidate cache, trigger rebuild, etc.
      console.log('Content published:', payload.data.modelName, payload.data.id);
      // TODO: Implement cache invalidation
      break;
      
    case 'content.deleted':
      console.log('Content deleted:', payload.data.modelName, payload.data.id);
      // TODO: Handle content deletion
      break;
      
    default:
      console.log('Unknown webhook event:', payload.event);
  }

  return json(200, { received: true });
};