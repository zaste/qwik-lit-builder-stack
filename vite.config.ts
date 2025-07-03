import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { cloudflarePagesAdapter } from '@builder.io/qwik-city/adapters/cloudflare-pages/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(async ({ command, mode }) => {
  const isProd = mode === 'production';
  
  // Cloudflare Pages adapter with static generation for homepage
  const adapter = cloudflarePagesAdapter({
    ssg: {
      include: ['/'],
      exclude: ['/api/*', '/auth/*', '/(app)/*', '/dashboard/*'],
    },
    staticGenerate: true,
  });
  
  
  // Base dependencies to optimize
  const baseDepsToInclude = [
    '@builder.io/qwik',
    '@builder.io/qwik-city',
    'lit',
    'lit/decorators.js',
    '@lit/reactive-element',
    '@lit/task'
  ];
  
  const optimizeDepsInclude = baseDepsToInclude;
  
  return {
    plugins: [
      qwikCity({
        adapter
      }),
      qwikVite({
        // Optimization settings
        entryStrategy: { type: 'smart' },
        srcDir: 'src',
        tsconfigFileNames: ['tsconfig.json']
      }),
      tsconfigPaths(),
      // Bundle analysis plugin (only in analyze mode)
      mode === 'analyze' && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    // CSS optimization
    css: {
      preprocessorOptions: {
        css: {
          charset: false
        }
      }
    },
    
    // LIT-specific config with optimization
    build: {
      target: 'es2020',
      outDir: 'dist',
      rollupOptions: {
        external: isProd ? [] : ['lit'],
        output: {
          // Better code splitting
          manualChunks: (id) => {
            // Bundle analysis showed these are heavy - split them out
            if (id.includes('src/lib/error-handler')) {
              return 'error-handling';
            }
            if (id.includes('src/lib/sentry')) {
              return 'monitoring';
            }
            if (id.includes('src/lib/websocket-manager')) {
              return 'websocket';
            }
            if (id.includes('src/lib/advanced-file-manager')) {
              return 'file-management';
            }
            if (id.includes('src/lib/rbac')) {
              return 'auth-rbac';
            }
            // Keep vendor libraries separate
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      },
      // Tree shaking optimization
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        }
      } : undefined
    },
    
    // Optimization for dependencies
    optimizeDeps: {
      include: optimizeDepsInclude,
      exclude: ['@builder.io/qwik-city']
    },
    
    // Environment variables
    define: {
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
