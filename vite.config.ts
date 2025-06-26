import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikInsights } from '@builder.io/qwik-labs/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production';
  
  return {
    plugins: [
      qwikCity({
        // Multi-adapter support
        // adapter: getAdapter(process.env.DEPLOY_TARGET)
      }),
      qwikVite({
        // Optimization settings
        entryStrategy: { type: 'smart' },
        srcDir: 'src',
        tsconfigFileNames: ['tsconfig.json'],
        // LIT integration
        optimizeDeps: {
          include: ['lit', 'lit/decorators.js']
        }
      }),
      tsconfigPaths(),
      ...(isProd && process.env.QWIK_INSIGHTS_KEY ? [qwikInsights({ publicApiKey: process.env.QWIK_INSIGHTS_KEY })] : [])
    ],
    
    // LIT-specific config
    build: {
      rollupOptions: {
        external: isProd ? [] : ['lit']
      }
    },
    
    // Environment variables
    define: {
      'import.meta.env.BUILDER_PUBLIC_KEY': JSON.stringify(process.env.BUILDER_PUBLIC_KEY),
      'import.meta.env.DEPLOY_TARGET': JSON.stringify(process.env.DEPLOY_TARGET || 'cloudflare')
    },

    // Development server
    server: {
      headers: {
        'Cache-Control': 'public, max-age=0'
      }
    },
    
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=600'
      }
    }
  };
});