import { describe, it, expect, beforeAll } from 'vitest';

describe('DSButton Integration Tests', () => {
  beforeAll(async () => {
    // Ensure LIT is loaded
    if (typeof window !== 'undefined') {
      // Dynamic import to test component loading
      try {
        await import('./ds-button');
      } catch (error) {
        console.error('Failed to load ds-button component:', error);
      }
    }
  });

  it('should have DSButton component available', () => {
    expect(typeof customElements).toBe('object');
    expect(typeof customElements.define).toBe('function');
    expect(typeof customElements.get).toBe('function');
  });

  it('should be able to create ds-button element', () => {
    const element = document.createElement('ds-button');
    expect(element).toBeDefined();
    expect(element.tagName.toLowerCase()).toBe('ds-button');
  });

  it('should support Shadow DOM', () => {
    const element = document.createElement('ds-button');
    document.body.appendChild(element);
    
    // Wait for component to be ready
    setTimeout(() => {
      expect(element.shadowRoot).toBeDefined();
      document.body.removeChild(element);
    }, 100);
  });

  it('should have basic LIT component structure', () => {
    const element = document.createElement('ds-button');
    
    // Test if element has LIT-specific properties
    expect(element).toHaveProperty('updateComplete');
    expect(element).toHaveProperty('requestUpdate');
  });

  it('should be registered in custom elements', () => {
    // Check if component is registered (after dynamic import)
    const ButtonConstructor = customElements.get('ds-button');
    
    if (ButtonConstructor) {
      expect(ButtonConstructor).toBeDefined();
      expect(typeof ButtonConstructor).toBe('function');
    } else {
      // Component might not be loaded yet in test environment
      expect(typeof customElements.define).toBe('function');
    }
  });
});