import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Media Content API - Unified routing for R2 + Supabase media
 */

export const onGet: RequestHandler = async ({ json, env, query, request }) => {
  // Forward to existing files/list API
  const { onGet: filesListGet } = await import('../../files/list/index');
  return filesListGet({ json, env, query, request } as any);
};

export const onPost: RequestHandler = async ({ json, env, request }) => {
  // Forward to existing upload API
  const { onPost: uploadPost } = await import('../../upload/index');
  return uploadPost({ json, env, request } as any);
};