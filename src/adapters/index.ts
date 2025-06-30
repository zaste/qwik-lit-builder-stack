import type { QwikCityVitePluginOptions } from '@builder.io/qwik-city/vite';

/**
 * Import adapters dynamically to avoid build errors
 */
async function importAdapters() {
  const [
    cfModule,
    staticModule
  ] = await Promise.allSettled([
    import('@builder.io/qwik-city/adapters/cloudflare-pages/vite'),
    import('@builder.io/qwik-city/adapters/static/vite')
  ]);

  return {
    cloudflareAdapter: cfModule.status === 'fulfilled' ? cfModule.value.cloudflarePagesAdapter : null,
    staticAdapter: staticModule.status === 'fulfilled' ? staticModule.value.staticAdapter : null
  };
}

export type DeployTarget = 'cloudflare' | 'static';

export async function getAdapter(target?: string): Promise<any> {
  const deployTarget = (target || process.env.DEPLOY_TARGET || 'cloudflare') as DeployTarget;

  const adapters = await importAdapters();

  switch (deployTarget) {
    case 'cloudflare':
      if (!adapters.cloudflareAdapter) {
        throw new Error('Cloudflare adapter not available');
      }
      return adapters.cloudflareAdapter({
        ssg: {
          include: ['/*'],
          exclude: ['/api/*', '/admin/*', '/(app)/*'],
        },
      });

    case 'static':
      if (!adapters.staticAdapter) {
        throw new Error('Static adapter not available');
      }
      return adapters.staticAdapter({
        origin: 'https://localhost:3000'
      });

    default:
      if (!adapters.cloudflareAdapter) {
        throw new Error('No adapters available');
      }
      return adapters.cloudflareAdapter();
  }
}
