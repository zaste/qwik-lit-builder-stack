import type { QwikCityVitePluginOptions } from '@builder.io/qwik-city/vite';

/**
 * Import adapters dynamically to avoid build errors
 */
async function importAdapters() {
  const [
    cfModule,
    vercelModule,
    nodeModule,
    staticModule
  ] = await Promise.all([
    import('@builder.io/qwik-city/adapters/cloudflare-pages/vite'),
    import('@builder.io/qwik-city/adapters/vercel-edge/vite'),
    import('@builder.io/qwik-city/adapters/node-server/vite'),
    import('@builder.io/qwik-city/adapters/static/vite')
  ]);

  return { 
    cloudflareAdapter: cfModule.cloudflarePagesAdapter,
    vercelAdapter: vercelModule.vercelEdgeAdapter,
    nodeAdapter: nodeModule.nodeServerAdapter,
    staticAdapter: staticModule.staticAdapter
  };
}

export type DeployTarget = 'cloudflare' | 'vercel' | 'static' | 'node';

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
      
    case 'vercel':
      return adapters.vercelAdapter({
        outputConfig: true,
        ssg: {
          include: ['/*'],
          exclude: ['/api/*', '/admin/*', '/(app)/*'],
        },
      });
      
    case 'static':
      return adapters.staticAdapter({
        origin: process.env.ORIGIN || 'https://localhost:5173',
      });
      
    case 'node':
      return adapters.nodeAdapter({
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
