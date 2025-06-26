import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikInsights } from '@builder.io/qwik-labs/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getAdapter } from './src/adapters';

export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production';
  
  return {
    plugins: [
      qwikCity({
        adapter: getAdapter(process.env.DEPLOY_TARGET)
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
      target: 'es2020',
      outDir: 'dist',
      rollupOptions: {
        external: isProd ? [] : ['lit']
      }
    },
    
    // Optimization for dependencies
    optimizeDeps: {
      include: [
        '@builder.io/qwik',
        '@builder.io/qwik-city',
        '@builder.io/sdk',
        '@builder.io/sdk-qwik',
        'lit',
        '@lit/reactive-element',
        '@lit/task'
      ]
    },
    
    // Environment variables
    define: {
      'import.meta.env.BUILDER_PUBLIC_KEY': JSON.stringify(process.env.BUILDER_PUBLIC_KEY || ''),
      'import.meta.env.DEPLOY_TARGET': JSON.stringify(process.env.DEPLOY_TARGET || 'cloudflare'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || '')
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
