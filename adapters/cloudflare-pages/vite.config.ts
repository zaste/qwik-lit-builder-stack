import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { cloudflarePagesAdapter } from '@builder.io/qwik-city/adapters/cloudflare-pages/vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ['src/entry.cloudflare-pages.tsx', '@qwik-city-plan'],
      },
    },
    plugins: [
      qwikCity({
        routesDir: resolve(__dirname, '../../src/routes'),
        adapter: cloudflarePagesAdapter({
          ssg: {
            include: ['/'],
            exclude: ['/api/*', '/auth/*', '/(app)/*', '/dashboard/*'],
          },
        }),
      }),
      qwikVite(),
    ],
  };
});