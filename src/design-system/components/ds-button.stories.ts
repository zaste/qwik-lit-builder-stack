import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './ds-button';

const meta: Meta = {
  title: 'Design System/Button',
  component: 'ds-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
    },
    size: {
      control: { type: 'select' },
      options: ['medium', 'large'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
  },
  render: (args) => html`
    <ds-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
    >
      Primary Button
    </ds-button>
  `,
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'medium',
    disabled: false,
  },
  render: (args) => html`
    <ds-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
    >
      Secondary Button
    </ds-button>
  `,
};

export const Large: Story = {
  args: {
    variant: 'primary',
    size: 'large',
    disabled: false,
  },
  render: (args) => html`
    <ds-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
    >
      Large Button
    </ds-button>
  `,
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: true,
  },
  render: (args) => html`
    <ds-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
    >
      Disabled Button
    </ds-button>
  `,
};

export const ButtonGroup: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <ds-button variant="primary" size="medium">Save</ds-button>
      <ds-button variant="secondary" size="medium">Cancel</ds-button>
      <ds-button variant="primary" size="medium" disabled>Disabled</ds-button>
    </div>
  `,
};