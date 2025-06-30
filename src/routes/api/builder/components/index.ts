import type { RequestHandler } from '@builder.io/qwik-city';
import { registerBuilderComponents } from '~/integrations/builder/index';

/**
 * Component registration API - Get registered components
 */
export const onGet: RequestHandler = async ({ json }) => {
  // Return list of available design system components for Builder.io
  const components = [
    {
      name: 'DS Button',
      description: 'Design system button component',
      inputs: [
        { name: 'variant', type: 'select', options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }], defaultValue: 'primary' },
        { name: 'size', type: 'select', options: [{ label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }], defaultValue: 'medium' },
        { name: 'disabled', type: 'boolean', defaultValue: false },
        { name: 'children', type: 'string', defaultValue: 'Button Text' }
      ],
      image: '/icons/button.svg'
    },
    {
      name: 'DS Card',
      description: 'Design system card component',
      inputs: [
        { name: 'variant', type: 'select', options: [{ label: 'Default', value: 'default' }, { label: 'Elevated', value: 'elevated' }], defaultValue: 'default' },
        { name: 'content', type: 'richText', defaultValue: '<p>Card content</p>' }
      ],
      image: '/icons/card.svg'
    },
    {
      name: 'DS Input',
      description: 'Design system input component',
      inputs: [
        { name: 'type', type: 'select', options: [{ label: 'Text', value: 'text' }, { label: 'Email', value: 'email' }, { label: 'Password', value: 'password' }], defaultValue: 'text' },
        { name: 'placeholder', type: 'string', defaultValue: 'Enter text...' },
        { name: 'required', type: 'boolean', defaultValue: false },
        { name: 'disabled', type: 'boolean', defaultValue: false }
      ],
      image: '/icons/input.svg'
    },
    {
      name: 'DS File Upload',
      description: 'Design system file upload component',
      inputs: [
        { name: 'accept', type: 'string', defaultValue: 'image/*' },
        { name: 'multiple', type: 'boolean', defaultValue: false },
        { name: 'maxSize', type: 'number', defaultValue: 10485760 }
      ],
      image: '/icons/upload.svg'
    }
  ];

  json(200, { components });
};

/**
 * Component registration API - Register components with Builder.io
 */
export const onPost: RequestHandler = async ({ json }) => {
  try {
    // Register all design system components with Builder.io
    await registerBuilderComponents();
    
    json(200, { 
      success: true, 
      message: 'Components registered successfully with Builder.io',
      registeredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to register components with Builder.io:', error);
    json(500, { 
      error: 'Failed to register components', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};