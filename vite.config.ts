import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getAdapter } from './src/adapters';

export default defineConfig(async ({ command, mode }) => {
  const isProd = mode === 'production';
  const adapter = await getAdapter(process.env.DEPLOY_TARGET);
  
  // Check if Builder.io dependencies are available
  let hasBuilderDeps = false;
  try {
    await import('@builder.io/sdk');
    await import('@builder.io/sdk-qwik');
    hasBuilderDeps = true;
  } catch {
    console.warn('Builder.io dependencies not found - CMS features will be disabled');
  }
  
  // Base dependencies to optimize
  const baseDepsToInclude = [
    '@builder.io/qwik',
    '@builder.io/qwik-city',
    'lit',
    '@lit/reactive-element',
    '@lit/task'
  ];
  
  // Add Builder.io deps only if available
  const optimizeDepsInclude = hasBuilderDeps 
    ? [...baseDepsToInclude, '@builder.io/sdk', '@builder.io/sdk-qwik']
    : baseDepsToInclude;
  
  return {
    plugins: [
      qwikCity({
        adapter
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
      tsconfigPaths()
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
      include: optimizeDepsInclude,
      exclude: ['@builder.io/qwik-city']
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
