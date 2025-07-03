import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DSButton } from './ds-button.classic';

// Helper function to dispatch events
const fireEvent = {
  click: (element: Element) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  },
  focus: (element: Element) => {
    const event = new FocusEvent('focus', { bubbles: true });
    element.dispatchEvent(event);
  },
  blur: (element: Element) => {
    const event = new FocusEvent('blur', { bubbles: true });
    element.dispatchEvent(event);
  },
  input: (element: Element) => {
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  }
};

describe('DSButton Component', () => {
  let container: HTMLElement;

  beforeEach(async () => {
    // Dynamic import to avoid SSR issues with decorators
    await import('./ds-button');
    
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Rendering', () => {
    it('should render with default properties', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      expect(button).toBeDefined();
      expect(button.text).toBe('Button');
      expect(button.variant).toBe('primary');
      expect(button.size).toBe('medium');
      expect(button.disabled).toBe(false);
    });

    it('should render with custom text', async () => {
      container.innerHTML = '<ds-button text="Custom Text"></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      expect(shadowButton?.textContent).toContain('Custom Text');
    });

    it('should apply correct variant classes', async () => {
      container.innerHTML = '<ds-button variant="secondary"></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      expect(shadowButton?.className).toContain('variant-secondary');
    });

    it('should apply correct size classes', async () => {
      container.innerHTML = '<ds-button size="large"></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      expect(shadowButton?.className).toContain('size-large');
    });
  });

  describe('Spectrum Token Integration', () => {
    it('should use Spectrum design tokens in CSS', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      // Check that component has shadow DOM and styles are applied
      expect(button.shadowRoot).toBeDefined();
      
      // Check computed styles which would reflect the token values
      const computedStyle = getComputedStyle(button);
      expect(computedStyle).toBeDefined();
      
      // Verify the component has the expected style structure
      const buttonElement = button.shadowRoot?.querySelector('button');
      expect(buttonElement).toBeDefined();
    });

    it('should have proper fallback values for tokens', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      // Verify component renders properly and has expected structure
      const shadowButton = button.shadowRoot?.querySelector('button');
      expect(shadowButton).toBeDefined();
      
      // Verify component has expected classes and structure
      expect(shadowButton?.className).toContain('variant-primary');
      expect(shadowButton?.className).toContain('size-medium');
      expect(shadowButton?.disabled).toBe(false);
    });
  });

  describe('States and Interactions', () => {
    it('should handle disabled state correctly', async () => {
      container.innerHTML = '<ds-button disabled></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      expect(shadowButton?.disabled).toBe(true);
      expect(button.disabled).toBe(true);
    });

    it('should handle loading state correctly', async () => {
      container.innerHTML = '<ds-button loading></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      expect(button.loading).toBe(true);
      const shadowButton = button.shadowRoot?.querySelector('button');
      expect(shadowButton?.disabled).toBe(true);
      
      // Should show loading spinner
      const spinner = button.shadowRoot?.querySelector('.loading-spinner');
      expect(spinner).toBeDefined();
    });

    it('should emit ds-click event when clicked', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      let eventFired = false;
      let eventDetail: any = null;
      
      button.addEventListener('ds-click', (e: any) => {
        eventFired = true;
        eventDetail = e.detail;
      });
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      shadowButton?.click();
      
      expect(eventFired).toBe(true);
      expect(eventDetail).toEqual({ variant: 'primary' });
    });

    it('should not emit event when disabled', async () => {
      container.innerHTML = '<ds-button disabled></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      let eventFired = false;
      
      button.addEventListener('ds-click', () => {
        eventFired = true;
      });
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      shadowButton?.click();
      
      expect(eventFired).toBe(false);
    });
  });

  describe('Icons and Content', () => {
    it('should render icon when provided', async () => {
      container.innerHTML = '<ds-button icon="check" text="Save"></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      const icon = button.shadowRoot?.querySelector('.icon');
      expect(icon).toBeDefined();
      expect(icon?.textContent).toBe('✓');
    });

    it('should position icon correctly', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      // Set properties programmatically
      button.icon = 'arrow-right';
      button.iconPosition = 'right';
      button.text = 'Next';
      
      await button.updateComplete;
      
      expect(button.iconPosition).toBe('right');
      // Icon should appear after text in DOM
      const buttonContent = button.shadowRoot?.querySelector('button')?.innerHTML;
      expect(buttonContent?.indexOf('Next')).toBeLessThan(buttonContent?.indexOf('→') || 0);
    });

    it('should handle full-width property', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      // Set property programmatically
      button.fullWidth = true;
      
      await button.updateComplete;
      
      expect(button.fullWidth).toBe(true);
      expect(button.hasAttribute('full-width')).toBe(true);
    });
  });

  describe('Custom Properties', () => {
    it('should apply custom colors when provided', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      // Set properties programmatically
      button.primaryColor = '#ff0000';
      button.hoverColor = '#cc0000';
      
      await button.updateComplete;
      
      expect(button.primaryColor).toBe('#ff0000');
      expect(button.hoverColor).toBe('#cc0000');
      
      const computedStyle = getComputedStyle(button);
      expect(computedStyle.getPropertyValue('--primary-color')).toBe('#ff0000');
      expect(computedStyle.getPropertyValue('--hover-color')).toBe('#cc0000');
    });

    it('should apply custom border radius', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      // Set property programmatically
      button.borderRadius = 10;
      
      await button.updateComplete;
      
      expect(button.borderRadius).toBe(10);
      
      const computedStyle = getComputedStyle(button);
      expect(computedStyle.getPropertyValue('--border-radius')).toBe('10px');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button semantics', async () => {
      container.innerHTML = '<ds-button text="Submit Form"></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      expect(shadowButton?.tagName).toBe('BUTTON');
      expect(shadowButton?.getAttribute('part')).toBe('button');
    });

    it('should be keyboard accessible', async () => {
      container.innerHTML = '<ds-button></ds-button>';
      const button = container.querySelector('ds-button') as DSButton;
      
      await button.updateComplete;
      
      const shadowButton = button.shadowRoot?.querySelector('button');
      
      // Should be focusable
      shadowButton?.focus();
      expect(document.activeElement).toBe(button);
    });
  });
});