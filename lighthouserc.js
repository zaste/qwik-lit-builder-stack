module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173',
        'http://localhost:5173/login',
        'http://localhost:5173/dashboard',
        'http://localhost:5173/dashboard/media'
      ],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.85 }],
        
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        
        // Progressive Web App checks
        'installable-manifest': 'off', // Not a PWA requirement for this app
        'apple-touch-icon': 'off',
        'maskable-icon': 'off',
        
        // Custom performance budgets
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'modern-image-formats': ['warn'],
        'efficient-animated-content': ['warn'],
        
        // Accessibility requirements
        'color-contrast': ['error'],
        'heading-order': ['error'],
        'label': ['error'],
        'link-name': ['error'],
        'button-name': ['error'],
        
        // Best practices
        'is-on-https': ['error'],
        'uses-responsive-images': ['warn'],
        'offscreen-images': ['warn']
      }
    },
    upload: {
      target: 'temporary-public-storage',
      reportFilenamePattern: 'lighthouse-%%DATETIME%%-%%HOSTNAME%%.%%EXTENSION%%'
    },
    server: {
      port: 9001,
      storage: './lighthouse-reports'
    }
  }
};