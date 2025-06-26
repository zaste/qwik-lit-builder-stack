import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],

  testFramework: {
    config: {
      ui: 'bdd',
      timeout: 3000,
    },
  },

  coverageConfig: {
    include: ['src/design-system/**/*.ts'],
    exclude: ['**/*.test.ts', '**/*.stories.ts'],
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};