import { beforeAll, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  // Setup global test environment
  global.fetch = fetch;
  
  // Mock browser APIs that might not be available in happy-dom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class MockIntersectionObserver {
    root = null;
    rootMargin = '0px';
    thresholds = [];
    
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  } as any;

  // Enable custom elements for LIT components
  if (!customElements.get('ds-button')) {
    // Mock custom elements registry if needed
    const originalDefine = customElements.define;
    customElements.define = function(name: string, constructor: any, options?: any) {
      try {
        return originalDefine.call(this, name, constructor, options);
      } catch (e) {
        // Ignore already defined elements
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (!errorMessage.includes('already defined')) {
          throw e;
        }
      }
    };
  }

  // Mock CSS custom properties support
  if (!CSS.supports('color', 'var(--test)')) {
    Object.defineProperty(CSS, 'supports', {
      writable: true,
      value: () => true,
    });
  }
});

// Cleanup after each test
afterEach(() => {
  // Clean up any registered custom elements for isolated tests
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});