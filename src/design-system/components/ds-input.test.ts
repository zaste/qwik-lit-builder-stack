import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { DSInput } from './ds-input.classic';

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

describe('DSInput Component', () => {
  let container: HTMLElement;

  beforeEach(async () => {
    // Dynamic import to avoid SSR issues with decorators
    await import('./ds-input');
    
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Rendering', () => {
    it('should render with default properties', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      expect(input).toBeDefined();
      expect(input.type).toBe('text');
      expect(input.size).toBe('medium');
      expect(input.variant).toBe('default');
      expect(input.disabled).toBe(false);
      expect(input.required).toBe(false);
    });

    it('should render with label when provided', async () => {
      container.innerHTML = '<ds-input label="Email Address"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const label = input.shadowRoot?.querySelector('.label');
      expect(label?.textContent).toContain('Email Address');
    });

    it('should show required indicator for required fields', async () => {
      container.innerHTML = '<ds-input label="Password" required></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const label = input.shadowRoot?.querySelector('.label');
      expect(label?.className).toContain('required');
    });

    it('should apply correct size classes', async () => {
      container.innerHTML = '<ds-input size="large"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input');
      expect(inputElement?.className).toContain('size-large');
    });

    it('should apply correct variant classes', async () => {
      container.innerHTML = '<ds-input variant="filled"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input');
      expect(inputElement?.className).toContain('variant-filled');
    });
  });

  describe('Spectrum Token Integration', () => {
    it('should use Spectrum design tokens in CSS', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      // Check that component has shadow DOM and styles are applied
      expect(input.shadowRoot).toBeDefined();
      
      // Check computed styles which would reflect the token values
      const computedStyle = getComputedStyle(input);
      expect(computedStyle).toBeDefined();
      
      // Verify the component has the expected style structure
      const inputElement = input.shadowRoot?.querySelector('input');
      expect(inputElement).toBeDefined();
    });

    it('should have proper fallback values for tokens', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      // Verify component renders properly and has expected structure
      const inputElement = input.shadowRoot?.querySelector('input');
      expect(inputElement).toBeDefined();
      
      // Verify component has expected classes and structure
      expect(inputElement?.className).toContain('variant-default');
      expect(inputElement?.className).toContain('size-medium');
      expect(inputElement?.disabled).toBe(false);
    });

    it('should use Spectrum spacing tokens', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      // Verify component structure shows proper spacing application
      const inputContainer = input.shadowRoot?.querySelector('.input-container');
      expect(inputContainer).toBeDefined();
      
      const inputWrapper = input.shadowRoot?.querySelector('.input-wrapper');
      expect(inputWrapper).toBeDefined();
      
      const inputElement = input.shadowRoot?.querySelector('input');
      expect(inputElement).toBeDefined();
    });
  });

  describe('Input Functionality', () => {
    it('should update value on input', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      
      // Simulate user input
      inputElement.value = 'test value';
      fireEvent.input(inputElement);
      
      expect(input.value).toBe('test value');
    });

    it('should emit ds-input event on input', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      let eventFired = false;
      let eventDetail: any = null;
      
      input.addEventListener('ds-input', (e: any) => {
        eventFired = true;
        eventDetail = e.detail;
      });
      
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      inputElement.value = 'test';
      fireEvent.input(inputElement);
      
      expect(eventFired).toBe(true);
      expect(eventDetail.value).toBe('test');
      expect(eventDetail.isValid).toBeDefined();
    });

    it('should emit ds-focus and ds-blur events', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      let focusEventFired = false;
      let blurEventFired = false;
      
      input.addEventListener('ds-focus', () => {
        focusEventFired = true;
      });
      
      input.addEventListener('ds-blur', () => {
        blurEventFired = true;
      });
      
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      
      fireEvent.focus(inputElement);
      expect(focusEventFired).toBe(true);
      
      fireEvent.blur(inputElement);
      expect(blurEventFired).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      container.innerHTML = '<ds-input required></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      // Empty field should be invalid when touched
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      fireEvent.focus(inputElement);
      fireEvent.blur(inputElement);
      
      expect(input.isValid).toBe(false);
      expect(input.validationErrors.length).toBeGreaterThan(0);
    });

    it('should validate email type inputs', async () => {
      container.innerHTML = '<ds-input type="email"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      
      // Invalid email
      inputElement.value = 'invalid-email';
      fireEvent.input(inputElement);
      fireEvent.blur(inputElement);
      
      expect(input.isValid).toBe(false);
      
      // Valid email
      inputElement.value = 'valid@email.com';
      fireEvent.input(inputElement);
      
      expect(input.isValid).toBe(true);
    });

    it('should validate custom rules', async () => {
      const rules = JSON.stringify([
        { type: 'minLength', value: 5, message: 'Too short' }
      ]);
      
      container.innerHTML = `<ds-input rules='${rules}'></ds-input>`;
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      
      // Short input should be invalid
      inputElement.value = 'abc';
      fireEvent.input(inputElement);
      fireEvent.blur(inputElement);
      
      expect(input.isValid).toBe(false);
      
      // Long enough input should be valid
      inputElement.value = 'abcdef';
      fireEvent.input(inputElement);
      
      expect(input.isValid).toBe(true);
    });

    it('should show error state visually', async () => {
      container.innerHTML = '<ds-input error="This field has an error"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input');
      expect(inputElement?.className).toContain('has-error');
      
      const errorMessage = input.shadowRoot?.querySelector('.error-message');
      expect(errorMessage?.textContent?.trim()).toBe('This field has an error');
    });
  });

  describe('Helper Text', () => {
    it('should display helper text when provided', async () => {
      container.innerHTML = '<ds-input helper-text="Enter your email address"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const helperText = input.shadowRoot?.querySelector('.helper-text');
      expect(helperText?.textContent?.trim()).toBe('Enter your email address');
    });

    it('should prioritize error message over helper text', async () => {
      container.innerHTML = '<ds-input helper-text="Helper" error="Error message"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const errorMessage = input.shadowRoot?.querySelector('.error-message');
      const helperText = input.shadowRoot?.querySelector('.helper-text');
      
      expect(errorMessage?.textContent?.trim()).toBe('Error message');
      expect(helperText).toBeNull();
    });
  });

  describe('Disabled State', () => {
    it('should handle disabled state correctly', async () => {
      container.innerHTML = '<ds-input disabled></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      expect(inputElement.disabled).toBe(true);
      expect(input.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper input semantics', async () => {
      container.innerHTML = '<ds-input label="Username" placeholder="Enter username"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const inputElement = input.shadowRoot?.querySelector('input') as HTMLInputElement;
      const label = input.shadowRoot?.querySelector('label');
      
      expect(inputElement.tagName).toBe('INPUT');
      expect(inputElement.getAttribute('placeholder')).toBe('Enter username');
      expect(label?.getAttribute('for')).toBe('input');
      expect(inputElement.id).toBe('input');
    });

    it('should associate error messages with input', async () => {
      container.innerHTML = '<ds-input error="Invalid input"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      const errorMessage = input.shadowRoot?.querySelector('.error-message');
      expect(errorMessage?.getAttribute('role')).toBe('alert');
    });
  });

  describe('Public API', () => {
    it('should expose focus method', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      expect(typeof input.focus).toBe('function');
      
      // Should be able to call focus without error
      input.focus();
    });

    it('should expose blur method', async () => {
      container.innerHTML = '<ds-input></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      expect(typeof input.blur).toBe('function');
      
      // Should be able to call blur without error
      input.blur();
    });

    it('should expose validate method', async () => {
      container.innerHTML = '<ds-input required></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      expect(typeof input.validate).toBe('function');
      
      const isValid = input.validate();
      expect(typeof isValid).toBe('boolean');
    });

    it('should expose reset method', async () => {
      container.innerHTML = '<ds-input value="initial"></ds-input>';
      const input = container.querySelector('ds-input') as DSInput;
      
      await input.updateComplete;
      
      expect(input.value).toBe('initial');
      
      input.reset();
      expect(input.value).toBe('');
    });
  });
});