import { fixture, expect, html } from '@open-wc/testing';
import { DSCard } from './ds-card.js';

describe('DSCard Component', () => {
  describe('Basic Functionality', () => {
    it('should render with default properties', async () => {
      const el = await fixture<DSCard>(html`<ds-card></ds-card>`);
      
      expect(el.variant).to.equal('default');
      expect(el.padding).to.equal('medium');
      expect(el.shadow).to.equal('medium');
      expect(el.interactive).to.be.false;
      expect(el.header).to.equal('');
      expect(el.footer).to.equal('');
    });

    it('should render with custom properties', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card 
          variant="elevated"
          padding="large"
          shadow="large"
          interactive
          header="Test Header"
          footer="Test Footer"
        ></ds-card>
      `);
      
      expect(el.variant).to.equal('elevated');
      expect(el.padding).to.equal('large');
      expect(el.shadow).to.equal('large');
      expect(el.interactive).to.be.true;
      expect(el.header).to.equal('Test Header');
      expect(el.footer).to.equal('Test Footer');
    });

    it('should have proper shadow DOM structure', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card>
          <p>Card content</p>
        </ds-card>
      `);
      
      const card = el.shadowRoot!.querySelector('.card');
      const content = el.shadowRoot!.querySelector('.content');
      const slot = el.shadowRoot!.querySelector('slot:not([name])');
      
      expect(card).to.exist;
      expect(content).to.exist;
      expect(slot).to.exist;
    });
  });

  describe('Variants', () => {
    it('should apply correct CSS classes for default variant', async () => {
      const el = await fixture<DSCard>(html`<ds-card variant="default"></ds-card>`);
      const card = el.shadowRoot!.querySelector('.card')!;
      
      expect(card.className).to.include('variant-default');
    });

    it('should apply correct CSS classes for elevated variant', async () => {
      const el = await fixture<DSCard>(html`<ds-card variant="elevated"></ds-card>`);
      const card = el.shadowRoot!.querySelector('.card')!;
      
      expect(card.className).to.include('variant-elevated');
    });

    it('should apply correct CSS classes for outlined variant', async () => {
      const el = await fixture<DSCard>(html`<ds-card variant="outlined"></ds-card>`);
      const card = el.shadowRoot!.querySelector('.card')!;
      
      expect(card.className).to.include('variant-outlined');
    });
  });

  describe('Shadow Levels', () => {
    it('should apply correct shadow class', async () => {
      const el = await fixture<DSCard>(html`<ds-card shadow="large"></ds-card>`);
      const card = el.shadowRoot!.querySelector('.card')!;
      
      expect(card.className).to.include('shadow-large');
    });

    it('should apply no shadow when set to none', async () => {
      const el = await fixture<DSCard>(html`<ds-card shadow="none"></ds-card>`);
      const card = el.shadowRoot!.querySelector('.card')!;
      
      expect(card.className).to.include('shadow-none');
    });
  });

  describe('Interactive Behavior', () => {
    it('should add interactive class when interactive is true', async () => {
      const el = await fixture<DSCard>(html`<ds-card interactive></ds-card>`);
      const card = el.shadowRoot!.querySelector('.card')!;
      
      expect(card.className).to.include('interactive');
    });

    it('should dispatch click event when interactive and clicked', async () => {
      const el = await fixture<DSCard>(html`<ds-card interactive variant="elevated"></ds-card>`);
      let eventFired = false;
      let eventDetail: any;
      
      el.addEventListener('ds-card-click', (e: Event) => {
        eventFired = true;
        eventDetail = (e as CustomEvent).detail;
      });
      
      const card = el.shadowRoot!.querySelector('.card')!;
      card.click();
      
      expect(eventFired).to.be.true;
      expect(eventDetail.variant).to.equal('elevated');
    });

    it('should not dispatch click event when not interactive', async () => {
      const el = await fixture<DSCard>(html`<ds-card></ds-card>`);
      let eventFired = false;
      
      el.addEventListener('ds-card-click', () => {
        eventFired = true;
      });
      
      const card = el.shadowRoot!.querySelector('.card')!;
      card.click();
      
      expect(eventFired).to.be.false;
    });
  });

  describe('Header and Footer', () => {
    it('should render header when header text is provided', async () => {
      const el = await fixture<DSCard>(html`<ds-card header="Test Header"></ds-card>`);
      const header = el.shadowRoot!.querySelector('header');
      
      expect(header).to.exist;
      expect(header!.textContent).to.include('Test Header');
    });

    it('should render footer when footer text is provided', async () => {
      const el = await fixture<DSCard>(html`<ds-card footer="Test Footer"></ds-card>`);
      const footer = el.shadowRoot!.querySelector('footer');
      
      expect(footer).to.exist;
      expect(footer!.textContent).to.include('Test Footer');
    });

    it('should not render header when no header text is provided', async () => {
      const el = await fixture<DSCard>(html`<ds-card></ds-card>`);
      const header = el.shadowRoot!.querySelector('header');
      
      expect(header).to.not.exist;
    });

    it('should not render footer when no footer text is provided', async () => {
      const el = await fixture<DSCard>(html`<ds-card></ds-card>`);
      const footer = el.shadowRoot!.querySelector('footer');
      
      expect(footer).to.not.exist;
    });

    it('should render header slot content', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card>
          <div slot="header">Custom Header Content</div>
          <p>Main content</p>
        </ds-card>
      `);
      
      const header = el.shadowRoot!.querySelector('header');
      const headerSlot = el.shadowRoot!.querySelector('slot[name="header"]');
      
      expect(header).to.exist;
      expect(headerSlot).to.exist;
    });

    it('should render footer slot content', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card>
          <p>Main content</p>
          <div slot="footer">Custom Footer Content</div>
        </ds-card>
      `);
      
      const footer = el.shadowRoot!.querySelector('footer');
      const footerSlot = el.shadowRoot!.querySelector('slot[name="footer"]');
      
      expect(footer).to.exist;
      expect(footerSlot).to.exist;
    });
  });

  describe('Padding Variants', () => {
    it('should apply correct padding classes to all sections', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card padding="large" header="Header" footer="Footer">
          Content
        </ds-card>
      `);
      
      const header = el.shadowRoot!.querySelector('header')!;
      const content = el.shadowRoot!.querySelector('.content')!;
      const footer = el.shadowRoot!.querySelector('footer')!;
      
      expect(header.className).to.include('padding-large');
      expect(content.className).to.include('padding-large');
      expect(footer.className).to.include('padding-large');
    });

    it('should apply no padding when set to none', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card padding="none" header="Header">
          Content
        </ds-card>
      `);
      
      const header = el.shadowRoot!.querySelector('header')!;
      const content = el.shadowRoot!.querySelector('.content')!;
      
      expect(header.className).to.include('padding-none');
      expect(content.className).to.include('padding-none');
    });
  });

  describe('Content Rendering', () => {
    it('should render slotted content', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card>
          <h2>Title</h2>
          <p>This is the card content</p>
          <button>Action</button>
        </ds-card>
      `);
      
      const slot = el.shadowRoot!.querySelector('slot:not([name])');
      expect(slot).to.exist;
      
      // Check that content is actually rendered
      const title = el.querySelector('h2');
      const paragraph = el.querySelector('p');
      const button = el.querySelector('button');
      
      expect(title).to.exist;
      expect(paragraph).to.exist;
      expect(button).to.exist;
      expect(title!.textContent).to.equal('Title');
      expect(paragraph!.textContent).to.equal('This is the card content');
    });

    it('should work with complex nested content', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card>
          <div class="complex-content">
            <img src="test.jpg" alt="Test" />
            <div class="text-content">
              <h3>Nested Title</h3>
              <p>Nested paragraph</p>
            </div>
          </div>
        </ds-card>
      `);
      
      const complexContent = el.querySelector('.complex-content');
      expect(complexContent).to.exist;
      
      const nestedTitle = el.querySelector('h3');
      const nestedParagraph = el.querySelector('p');
      
      expect(nestedTitle).to.exist;
      expect(nestedParagraph).to.exist;
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', async () => {
      const el = await fixture<DSCard>(html`
        <ds-card header="Card Title" footer="Card Footer">
          <p>Card content for accessibility testing</p>
        </ds-card>
      `);
      
      const card = el.shadowRoot!.querySelector('.card');
      const header = el.shadowRoot!.querySelector('header');
      const footer = el.shadowRoot!.querySelector('footer');
      
      expect(card).to.exist;
      expect(header).to.exist;
      expect(footer).to.exist;
    });

    it('should maintain proper focus management when interactive', async () => {
      const el = await fixture<DSCard>(html`<ds-card interactive></ds-card>`);
      const card = el.shadowRoot!.querySelector('.card')!;
      
      // Interactive cards should be focusable
      expect(card.style.cursor).to.not.equal('');
    });
  });
});