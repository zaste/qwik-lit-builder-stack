import { defineConfig } from 'vitest/config';
import { qwikVite } from '@builder.io/qwik/optimizer';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    qwikVite(),
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**',
      '**/simple.test.ts' // Exclude simple test file for now
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**'
      ]
    },
    // Add better support for Web Components and custom elements
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
  define: {
    'import.meta.vitest': undefined,
  },
  resolve: {
    alias: {
      '~/': new URL('./src/', import.meta.url).pathname,
    },
  },
  // Add esbuild configuration for better module handling
  esbuild: {
    target: 'es2020',
    // Enable decorator support for LIT components
    experimentalDecorators: true,
    useDefineForClassFields: false,
    // Keep class names for better debugging
    keepNames: true,
  },
  // Add better handling for LIT decorators
  optimizeDeps: {
    include: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js'],
  },
});