import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  // Test files pattern
  files: 'src/**/*.test.{js,ts}',
  
  // Node resolve for ES modules
  nodeResolve: true,
  
  // Browser configuration
  browsers: [
    playwrightLauncher({ 
      product: 'chromium',
      launchOptions: {
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      }
    })
  ],
  
  // Test framework
  testFramework: {
    path: '@web/test-runner-mocha/dist/autorun.js'
  },
  
  // Coverage configuration
  coverage: true,
  coverageConfig: {
    include: [
      'src/design-system/components/**/*.ts',
      'src/design-system/controllers/**/*.ts'
    ],
    exclude: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts'
    ],
    threshold: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  },
  
  // Serve configuration
  rootDir: '.',
  
  // Development mode
  watch: false,
  
  // Concurrency
  concurrency: 4,
  
  // Timeout
  testsStartTimeout: 30000,
  testsFinishTimeout: 60000,
  
  // Plugin configuration for LIT components
  plugins: [],
  
  // Middleware for serving files
  middleware: [],
  
  // Additional configuration
  preserveSymlinks: true,
  
  // Environment variables
  environmentVariables: {
    NODE_ENV: 'test'
  }
};