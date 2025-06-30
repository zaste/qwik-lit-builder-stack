import type { RequestHandler } from '@builder.io/qwik-city';

/**
 * Catch-all API 404 handler
 */
export const onGet: RequestHandler = async ({ json }) => {
  throw json(404, {
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
    },
  });
};

export const onPost = onGet;
export const onPut = onGet;
export const onDelete = onGet;
export const onPatch = onGet;
