import type { RequestHandler } from '@builder.io/qwik-city';
// Reuse existing Builder.io implementation but with unified routing

export const onGet: RequestHandler = async ({ json, env, query }) => {
  // Forward to Builder.io pages API
  const { onGet: builderPagesGet } = await import('../../builder/pages/index');
  return builderPagesGet({ json, env, query } as any);
};

export const onPost: RequestHandler = async ({ json, env, request }) => {
  // Forward to Builder.io pages API
  const { onPost: builderPagesPost } = await import('../../builder/pages/index');
  return builderPagesPost({ json, env, request } as any);
};