/**
 * Lazy Loading Utilities
 * Optimize bundle size with dynamic imports
 */

import { component$, type Component } from '@builder.io/qwik';

/**
 * Create a lazy-loaded component with loading state
 */
export function createLazyComponent<T extends Record<string, any>>(
  importFn: () => Promise<{ default: Component<T> }>
) {
  // Qwik handles code splitting automatically through component$
  // This utility can be expanded when Suspense becomes available
  
  const LazyComponent = component$(() => {
    // In real implementation, this would handle the dynamic import
    // For now, return placeholder until Suspense is available
    return 'Loading component...';
  });
  
  // Store the import function for potential future use
  (LazyComponent as any)._importFn = importFn;
  
  return LazyComponent as Component<T>;
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload essential modules
  if (typeof window !== 'undefined') {
    // Only run in browser
    import('../lib/auth').catch(() => {});
    import('../lib/cache-strategies').catch(() => {});
  }
}

/**
 * Load module with error handling
 */
export async function loadModule<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    // console.warn('Failed to load module:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Defer non-critical module loading
 */
export function deferLoad<T>(
  importFn: () => Promise<T>,
  delay = 100
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      importFn().then(resolve).catch(reject);
    }, delay);
  });
}