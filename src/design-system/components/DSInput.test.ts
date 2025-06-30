import { fixture, expect, html } from '@open-wc/testing';
import { DSInput } from './ds-input.js';

describe('DSInput Component', () => {
  describe('Basic Functionality', () => {
    it('should render with default properties', async () => {
      const el = await fixture<DSInput>(html`<ds-input></ds-input>`);
      
      expect(el.type).to.equal('text');
      expect(el.size).to.equal('medium');
      expect(el.variant).to.equal('default');
      expect(el.value).to.equal('');
      expect(el.required).to.be.false;
      expect(el.disabled).to.be.false;
    });

    it('should render with custom properties', async () => {
      const el = await fixture<DSInput>(html`
        <ds-input 
          type="email"
          label="Email Address"
          placeholder="Enter email"
          size="large"
          variant="outlined"
          required
        ></ds-input>
      `);
      
      expect(el.type).to.equal('email');
      expect(el.label).to.equal('Email Address');
      expect(el.placeholder).to.equal('Enter email');
      expect(el.size).to.equal('large');
      expect(el.variant).to.equal('outlined');
      expect(el.required).to.be.true;
    });

    it('should have proper shadow DOM structure', async () => {
      const el = await fixture<DSInput>(html`
        <ds-input label="Test Input" helper-text="Helper text"></ds-input>
      `);
      
      const label = el.shadowRoot!.querySelector('.label');
      const input = el.shadowRoot!.querySelector('input');
      const helperText = el.shadowRoot!.querySelector('.helper-text');
      
      expect(label).to.exist;
      expect(label!.textContent).to.include('Test Input');
      expect(input).to.exist;
      expect(helperText).to.exist;
      expect(helperText!.textContent).to.include('Helper text');
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const el = await fixture<DSInput>(html`<ds-input required></ds-input>`);
      
      // Initially valid (not touched)
      expect(el.isValid).to.be.true;
      
      // Trigger blur without value
      const input = el.shadowRoot!.querySelector('input')!;
      input.dispatchEvent(new Event('blur'));
      await el.updateComplete;
      
      // Should be invalid after touch
      expect(el.isValid).to.be.false;
      expect(el.validationErrors.length).to.be.greaterThan(0);
      expect(el.validationErrors[0].message).to.include('required');
    });

    it('should validate email format', async () => {
      const el = await fixture<DSInput>(html`<ds-input type="email"></ds-input>`);
      
      // Set invalid email
      el.value = 'invalid-email';
      el.validationController.setTouched(true);
      await el.updateComplete;
      
      expect(el.isValid).to.be.false;
      expect(el.validationErrors[0].message).to.include('email');
    });

    it('should validate with custom rules', async () => {
      const rules = JSON.stringify([
        { type: 'minLength', value: 5, message: 'Minimum 5 characters' }
      ]);
      
      const el = await fixture<DSInput>(html`<ds-input rules="${rules}"></ds-input>`);
      
      el.value = 'abc';
      el.validationController.setTouched(true);
      await el.updateComplete;
      
      expect(el.isValid).to.be.false;
      expect(el.validationErrors[0].message).to.include('Minimum 5');
    });

    it('should clear errors when value becomes valid', async () => {
      const el = await fixture<DSInput>(html`<ds-input required></ds-input>`);
      
      // Make invalid
      const input = el.shadowRoot!.querySelector('input')!;
      input.dispatchEvent(new Event('blur'));
      await el.updateComplete;
      expect(el.isValid).to.be.false;
      
      // Make valid
      el.value = 'valid value';
      await el.updateComplete;
      expect(el.isValid).to.be.true;
    });
  });

  describe('Events', () => {
    it('should dispatch ds-input event on input', async () => {
      const el = await fixture<DSInput>(html`<ds-input></ds-input>`);
      let eventFired = false;
      let eventDetail: any;
      
      el.addEventListener('ds-input', (e: Event) => {
        eventFired = true;
        eventDetail = (e as CustomEvent).detail;
      });
      
      const input = el.shadowRoot!.querySelector('input')!;
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      
      expect(eventFired).to.be.true;
      expect(eventDetail.value).to.equal('test');
      expect(eventDetail.isValid).to.be.a('boolean');
    });

    it('should dispatch ds-blur event on blur', async () => {
      const el = await fixture<DSInput>(html`<ds-input></ds-input>`);
      let eventFired = false;
      
      el.addEventListener('ds-blur', () => {
        eventFired = true;
      });
      
      const input = el.shadowRoot!.querySelector('input')!;
      input.dispatchEvent(new Event('blur'));
      
      expect(eventFired).to.be.true;
    });

    it('should dispatch ds-focus event on focus', async () => {
      const el = await fixture<DSInput>(html`<ds-input></ds-input>`);
      let eventFired = false;
      
      el.addEventListener('ds-focus', () => {
        eventFired = true;
      });
      
      const input = el.shadowRoot!.querySelector('input')!;
      input.dispatchEvent(new Event('focus'));
      
      expect(eventFired).to.be.true;
    });
  });

  describe('Variants and Sizes', () => {
    it('should apply correct CSS classes for variants', async () => {
      const el = await fixture<DSInput>(html`<ds-input variant="outlined"></ds-input>`);
      const input = el.shadowRoot!.querySelector('input')!;
      
      expect(input.className).to.include('variant-outlined');
    });

    it('should apply correct CSS classes for sizes', async () => {
      const el = await fixture<DSInput>(html`<ds-input size="large"></ds-input>`);
      const input = el.shadowRoot!.querySelector('input')!;
      
      expect(input.className).to.include('size-large');
    });

    it('should show error state styling', async () => {
      const el = await fixture<DSInput>(html`<ds-input error="Test error"></ds-input>`);
      const input = el.shadowRoot!.querySelector('input')!;
      const errorMessage = el.shadowRoot!.querySelector('.error-message');
      
      expect(input.className).to.include('has-error');
      expect(errorMessage).to.exist;
      expect(errorMessage!.textContent).to.include('Test error');
    });
  });

  describe('Public API', () => {
    it('should focus input when focus() is called', async () => {
      const el = await fixture<DSInput>(html`<ds-input></ds-input>`);
      const input = el.shadowRoot!.querySelector('input')!;
      
      let focusCalled = false;
      input.focus = () => { focusCalled = true; };
      
      el.focus();
      expect(focusCalled).to.be.true;
    });

    it('should validate when validate() is called', async () => {
      const el = await fixture<DSInput>(html`<ds-input required></ds-input>`);
      
      const isValid = el.validate();
      expect(isValid).to.be.false;
    });

    it('should reset validation state when reset() is called', async () => {
      const el = await fixture<DSInput>(html`<ds-input required></ds-input>`);
      
      // Make invalid
      el.value = '';
      el.validationController.setTouched(true);
      await el.updateComplete;
      expect(el.isValid).to.be.false;
      
      // Reset
      el.reset();
      expect(el.value).to.equal('');
      expect(el.validationController.isTouched).to.be.false;
      expect(el.validationController.isDirty).to.be.false;
    });

    it('should clear errors when clearError() is called', async () => {
      const el = await fixture<DSInput>(html`<ds-input error="Test error"></ds-input>`);
      
      expect(el.error).to.equal('Test error');
      el.clearError();
      expect(el.error).to.equal('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const el = await fixture<DSInput>(html`
        <ds-input 
          label="Test Input" 
          required 
          error="Error message"
        ></ds-input>
      `);
      
      const input = el.shadowRoot!.querySelector('input')!;
      const errorMessage = el.shadowRoot!.querySelector('.error-message');
      
      expect(input.getAttribute('required')).to.exist;
      expect(errorMessage!.getAttribute('role')).to.equal('alert');
    });

    it('should show required indicator in label', async () => {
      const el = await fixture<DSInput>(html`<ds-input label="Test" required></ds-input>`);
      const label = el.shadowRoot!.querySelector('.label')!;
      
      expect(label.className).to.include('required');
    });
  });
});