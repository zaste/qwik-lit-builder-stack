import type { QwikCityVitePluginOptions } from '@builder.io/qwik-city/vite';

/**
 * Import adapters dynamically to avoid build errors
 */
async function importAdapters() {
  const [
    cfModule
  ] = await Promise.all([
    import('@builder.io/qwik-city/adapters/cloudflare-pages/vite')
  ]);

  return {
    cloudflareAdapter: cfModule.cloudflarePagesAdapter
  };
}

export type DeployTarget = 'cloudflare';

export async function getAdapter(target?: string): Promise<QwikCityVitePluginOptions['adapter']> {
  const deployTarget = (target || process.env.DEPLOY_TARGET || 'cloudflare') as DeployTarget;

  const adapters = await importAdapters();

  switch (deployTarget) {
    case 'cloudflare':
      return adapters.cloudflareAdapter({
        ssg: {
          include: ['/*'],
          exclude: ['/api/*', '/admin/*', '/(app)/*'],
        },
      });

    default:
      console.warn(`Unknown deploy target: ${deployTarget}, falling back to cloudflare`);
      return adapters.cloudflareAdapter();
  }
}
