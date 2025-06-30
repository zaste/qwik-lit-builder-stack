import { Builder } from '@builder.io/sdk';

// Register all design system components for Builder.io
export function registerBuilderComponents() {
  // Register DS Button
  Builder.registerComponent(
    {
      component: 'ds-button',
      name: 'DS Button',
      inputs: [
        {
          name: 'variant',
          type: 'select',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
          defaultValue: 'primary',
        },
        {
          name: 'size',
          type: 'select',
          options: [
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          defaultValue: 'medium',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'text',
          type: 'string',
          defaultValue: 'Button',
        },
      ],
    },
    {
      // Custom render function for Builder.io
      render: ({ variant, size, disabled, text }: any) => {
        return `<ds-button variant="${variant}" size="${size}" ${disabled ? 'disabled' : ''}>${text}</ds-button>`;
      },
    } as any
  );

  // eslint-disable-next-line no-console
  console.log('Design System components registered with Builder.io');
}
