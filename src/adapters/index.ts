import type { QwikCityVitePluginOptions } from '@builder.io/qwik-city/vite';
import cloudflareAdapter from '@builder.io/qwik-city/adapters/cloudflare-pages/vite';
import vercelAdapter from '@builder.io/qwik-city/adapters/vercel-edge/vite';
import nodeAdapter from '@builder.io/qwik-city/adapters/node-server/vite';
import staticAdapter from '@builder.io/qwik-city/adapters/static/vite';

export type DeployTarget = 'cloudflare' | 'vercel' | 'static' | 'node';

export function getAdapter(target?: string): QwikCityVitePluginOptions['adapter'] {
  const deployTarget = (target || process.env.DEPLOY_TARGET || 'cloudflare') as DeployTarget;
  
  switch (deployTarget) {
    case 'cloudflare':
      return cloudflareAdapter({
        ssg: {
          include: ['/*'],
          exclude: ['/api/*', '/admin/*', '/(app)/*'],
        },
      });
      
    case 'vercel':
      return vercelAdapter({
        outputConfig: true,
        ssg: {
          include: ['/*'],
          exclude: ['/api/*', '/admin/*', '/(app)/*'],
        },
      });
      
    case 'static':
      return staticAdapter({
        origin: process.env.ORIGIN || 'https://localhost:5173',
      });
      
    case 'node':
      return nodeAdapter({
        ssg: {
          include: ['/*'],
          exclude: ['/api/*', '/admin/*', '/(app)/*'],
        },
      });
      
    default:
      console.warn(`Unknown deploy target: ${deployTarget}, falling back to cloudflare`);
      return cloudflareAdapter();
  }
}
