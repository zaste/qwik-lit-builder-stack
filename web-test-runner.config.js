import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: ['src/**/*.test.ts'],
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'es2020',
    }),
  ],
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  testFramework: {
    config: {
      timeout: 5000,
    },
  },
  coverage: true,
  coverageConfig: {
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
};