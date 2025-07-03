import type { RequestHandler } from '@builder.io/qwik-city';
import { onGet as filesListGet } from '../../files/list/index';
import { onPost as uploadPost } from '../../upload/index';

/**
 * Media Content API - Unified routing for R2 + Supabase media
 */

export const onGet: RequestHandler = async (context) => {
  // Forward to existing files/list API
  return filesListGet(context);
};

export const onPost: RequestHandler = async (context) => {
  // Forward to existing upload API
  return uploadPost(context);
};