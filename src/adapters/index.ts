// Removed unused QwikCityVitePluginOptions import

/**
 * Import adapters dynamically to avoid build errors
 */
async function importAdapters() {
  const cfModule = await import('@builder.io/qwik-city/adapters/cloudflare-pages/vite');

  return { 
    cloudflareAdapter: cfModule.cloudflarePagesAdapter
  };
}

export type DeployTarget = 'cloudflare';

export async function getAdapter(target?: string): Promise<any> {
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
      import('../lib/logger').then(({ logger }) => {
        logger.warn(`Unknown deploy target: ${deployTarget}, falling back to cloudflare`, {
          component: 'AdapterSelector',
          deployTarget
        });
      });
      return adapters.cloudflareAdapter();
  }
}
