import { Builder } from '@builder.io/sdk';
import { enhanceBuilderRegistrationWithSimpleValidation } from './builder-validation-simple.js';
import { createBuilderThemeControls } from './style-system.js';

// Create component categories for better organization
// Note: Categories available for future use
// const DESIGN_SYSTEM_CATEGORIES = {
//   INPUTS: 'Design System - Inputs',
//   LAYOUT: 'Design System - Layout', 
//   ACTIONS: 'Design System - Actions',
//   MEDIA: 'Design System - Media'
// };

// Register all design system components for Builder.io
export function registerBuilderComponents() {
  // Initialize real-time validation
  enhanceBuilderRegistrationWithSimpleValidation();
  
  // Initialize theme system
  createBuilderThemeControls();
  // console.log(`🎨 Style system initialized with themes: ${themeManager.getThemes().map(t => t.name).join(', ')}`);
  // Register DS Button
  Builder.registerComponent(
    'ds-button',
    {
      name: 'DS Button',
      tag: 'design-system actions',
      description: 'Design system button with multiple variants, sizes, and customization options',
      image: 'https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F8b4c2b3b4c5b6c7d8e9f0a1b2c3',
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
        {
          name: 'icon',
          type: 'select',
          options: [
            { label: 'None', value: '' },
            { label: 'Arrow Right', value: 'arrow-right' },
            { label: 'Check', value: 'check' },
            { label: 'Plus', value: 'plus' },
            { label: 'Download', value: 'download' },
            { label: 'Upload', value: 'upload' },
            { label: 'Search', value: 'search' },
          ],
          defaultValue: '',
          helperText: 'Icon to display in button',
        },
        {
          name: 'iconPosition',
          type: 'select',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          defaultValue: 'left',
          helperText: 'Position of icon relative to text',
          showIf: (options) => options.get('icon') && options.get('icon') !== '',
        },
        {
          name: 'loading',
          type: 'boolean',
          defaultValue: false,
          helperText: 'Show loading spinner instead of content',
        },
        {
          name: 'primaryColor',
          type: 'color',
          defaultValue: '#007acc',
          helperText: 'Primary button color',
        },
        {
          name: 'hoverColor',
          type: 'color',
          defaultValue: '#005999',
          helperText: 'Button color on hover',
        },
        {
          name: 'borderRadius',
          type: 'number',
          defaultValue: 6,
          helperText: 'Border radius in pixels',
          min: 0,
          max: 20,
        },
        {
          name: 'fullWidth',
          type: 'boolean',
          defaultValue: false,
          helperText: 'Make button take full container width',
        },
      ],
    }
  );

  // Register DS Input
  Builder.registerComponent(
    'ds-input',
    {
      name: 'DS Input',
      tag: 'design-system inputs',
      description: 'Advanced input component with validation, multiple variants, and styling options',
      image: 'https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F9c5d3e4f5g6h7i8j9k0l1m2n3o4',
      inputs: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Password', value: 'password' },
            { label: 'Number', value: 'number' },
            { label: 'Tel', value: 'tel' },
            { label: 'URL', value: 'url' },
          ],
          defaultValue: 'text',
        },
        {
          name: 'label',
          type: 'string',
          defaultValue: 'Input Label',
        },
        {
          name: 'placeholder',
          type: 'string',
          defaultValue: 'Enter text...',
        },
        {
          name: 'value',
          type: 'string',
          defaultValue: '',
        },
        {
          name: 'required',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'variant',
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Filled', value: 'filled' },
            { label: 'Outlined', value: 'outlined' },
          ],
          defaultValue: 'default',
        },
        {
          name: 'size',
          type: 'select',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          defaultValue: 'medium',
        },
        {
          name: 'helperText',
          type: 'string',
          defaultValue: '',
        },
        {
          name: 'rules',
          type: 'longText',
          defaultValue: '',
          helperText: 'JSON validation rules (e.g., [{"type": "required"}, {"type": "email"}])',
          showIf: (options) => options.get('type') === 'email' || options.get('required') === true,
        },
        {
          name: 'showValidationOn',
          type: 'select',
          options: [
            { label: 'On Blur', value: 'blur' },
            { label: 'On Input', value: 'input' },
            { label: 'On Submit', value: 'submit' },
          ],
          defaultValue: 'blur',
          helperText: 'When to show validation feedback',
          showIf: (options) => options.get('rules') && options.get('rules') !== '',
        },
        {
          name: 'primaryColor',
          type: 'color',
          defaultValue: '#007acc',
          helperText: 'Primary color for focus states and valid input',
        },
        {
          name: 'errorColor',
          type: 'color',
          defaultValue: '#dc3545',
          helperText: 'Color for error states and validation messages',
        },
        {
          name: 'borderRadius',
          type: 'number',
          defaultValue: 4,
          helperText: 'Border radius in pixels',
          min: 0,
          max: 20,
        },
        {
          name: 'name',
          type: 'string',
          defaultValue: '',
        },
        {
          name: 'autocomplete',
          type: 'string',
          defaultValue: '',
        },
      ],
    }
  );

  // Register DS Card
  Builder.registerComponent(
    'ds-card',
    {
      name: 'DS Card',
      tag: 'design-system layout',
      description: 'Flexible card container with advanced layout, interaction, and styling options',
      image: 'https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F7a8b9c0d1e2f3g4h5i6j7k8l9m0',
      inputs: [
        {
          name: 'variant',
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Elevated', value: 'elevated' },
            { label: 'Outlined', value: 'outlined' },
          ],
          defaultValue: 'default',
        },
        {
          name: 'padding',
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          defaultValue: 'medium',
        },
        {
          name: 'shadow',
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          defaultValue: 'medium',
        },
        {
          name: 'interactive',
          type: 'boolean',
          defaultValue: false,
          helperText: 'Make card clickable with hover effects',
        },
        {
          name: 'header',
          type: 'string',
          defaultValue: '',
          helperText: 'Header text (optional)',
        },
        {
          name: 'footer',
          type: 'string',
          defaultValue: '',
          helperText: 'Footer text (optional)',
        },
        {
          name: 'backgroundColor',
          type: 'color',
          defaultValue: '#ffffff',
          helperText: 'Card background color',
        },
        {
          name: 'borderColor',
          type: 'color',
          defaultValue: '#e0e0e0',
          helperText: 'Border color (for outlined variant)',
          showIf: (options) => options.get('variant') === 'outlined',
        },
        {
          name: 'borderRadius',
          type: 'number',
          defaultValue: 8,
          helperText: 'Border radius in pixels',
          min: 0,
          max: 24,
        },
        {
          name: 'maxWidth',
          type: 'string',
          defaultValue: '',
          helperText: 'Maximum width (e.g., 400px, 50%, auto)',
        },
        {
          name: 'minHeight',
          type: 'string',
          defaultValue: '',
          helperText: 'Minimum height (e.g., 200px, auto)',
        },
        {
          name: 'clickAction',
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Navigate to URL', value: 'navigate' },
            { label: 'Open Modal', value: 'modal' },
            { label: 'Custom Event', value: 'custom' },
          ],
          defaultValue: 'none',
          helperText: 'Action when card is clicked',
          showIf: (options) => options.get('interactive') === true,
        },
        {
          name: 'clickUrl',
          type: 'string',
          defaultValue: '',
          helperText: 'URL to navigate to when clicked',
          showIf: (options) => options.get('clickAction') === 'navigate',
        },
        // Enhanced Layout Properties
        {
          name: 'alignment',
          type: 'select',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
            { label: 'Stretch', value: 'stretch' },
          ],
          defaultValue: 'left',
          helperText: 'Content alignment within the card',
        },
        {
          name: 'contentDirection',
          type: 'select',
          options: [
            { label: 'Column', value: 'column' },
            { label: 'Row', value: 'row' },
          ],
          defaultValue: 'column',
          helperText: 'Layout direction for card content',
        },
        {
          name: 'justifyContent',
          type: 'select',
          options: [
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
            { label: 'Space Between', value: 'space-between' },
          ],
          defaultValue: 'flex-start',
          helperText: 'How content is distributed along main axis',
        },
        {
          name: 'alignItems',
          type: 'select',
          options: [
            { label: 'Stretch', value: 'stretch' },
            { label: 'Start', value: 'flex-start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'flex-end' },
          ],
          defaultValue: 'stretch',
          helperText: 'How content is aligned along cross axis',
        },
        {
          name: 'gap',
          type: 'string',
          defaultValue: '0',
          helperText: 'Gap between child elements (e.g., 16px, 1rem)',
        },
        {
          name: 'width',
          type: 'string',
          defaultValue: 'auto',
          helperText: 'Card width (e.g., 300px, 100%, auto)',
        },
        {
          name: 'height',
          type: 'string',
          defaultValue: 'auto',
          helperText: 'Card height (e.g., 200px, 100%, auto)',
        },
        // Enhanced Interaction Properties
        {
          name: 'hoverEffect',
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Lift', value: 'lift' },
            { label: 'Scale', value: 'scale' },
            { label: 'Glow', value: 'glow' },
            { label: 'Shadow', value: 'shadow' },
          ],
          defaultValue: 'lift',
          helperText: 'Visual effect on hover',
          showIf: (options) => options.get('interactive') === true,
        },
        {
          name: 'hoverScale',
          type: 'number',
          defaultValue: 1.02,
          min: 1,
          max: 1.2,
          step: 0.01,
          helperText: 'Scale factor for hover effect',
          showIf: (options) => options.get('hoverEffect') === 'scale',
        },
        {
          name: 'hoverTransition',
          type: 'string',
          defaultValue: '0.2s',
          helperText: 'Transition duration (e.g., 0.2s, 300ms)',
          showIf: (options) => options.get('interactive') === true,
        },
        {
          name: 'clickAnimation',
          type: 'select',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Scale', value: 'scale' },
            { label: 'Ripple', value: 'ripple' },
          ],
          defaultValue: 'scale',
          helperText: 'Animation when clicked',
          showIf: (options) => options.get('interactive') === true,
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: false,
          helperText: 'Disable card interactions',
        },
        // Advanced Styling Properties
        {
          name: 'primaryColor',
          type: 'color',
          defaultValue: '#2563eb',
          helperText: 'Primary color for accents and highlights',
        },
        {
          name: 'secondaryColor',
          type: 'color',
          defaultValue: '#64748b',
          helperText: 'Secondary color for supporting elements',
        },
        {
          name: 'textColor',
          type: 'color',
          defaultValue: '#111827',
          helperText: 'Text color throughout the card',
        },
        {
          name: 'borderWidth',
          type: 'number',
          defaultValue: 1,
          min: 0,
          max: 10,
          helperText: 'Border width in pixels',
        },
        {
          name: 'backgroundImage',
          type: 'string',
          defaultValue: '',
          helperText: 'Background image URL (optional)',
        },
        {
          name: 'backgroundPosition',
          type: 'select',
          options: [
            { label: 'Center', value: 'center' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          defaultValue: 'center',
          helperText: 'Position of background image',
          showIf: (options) => options.get('backgroundImage') && options.get('backgroundImage') !== '',
        },
        {
          name: 'backgroundSize',
          type: 'select',
          options: [
            { label: 'Cover', value: 'cover' },
            { label: 'Contain', value: 'contain' },
            { label: 'Auto', value: 'auto' },
          ],
          defaultValue: 'cover',
          helperText: 'How background image is sized',
          showIf: (options) => options.get('backgroundImage') && options.get('backgroundImage') !== '',
        },
      ],
      canHaveChildren: true,
      defaultChildren: [
        {
          '@type': '@builder.io/sdk:Element',
          component: {
            name: 'Text',
            options: {
              text: 'Card content goes here. You can add any components inside this card.',
            },
          },
        },
      ],
    }
  );

  // Register DS File Upload
  Builder.registerComponent(
    'ds-file-upload',
    {
      name: 'DS File Upload',
      tag: 'design-system media',
      description: 'Advanced file upload component with drag & drop, progress tracking, and smart storage routing',
      image: 'https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F6b7c8d9e0f1a2b3c4d5e6f7g8h9',
      inputs: [
        {
          name: 'multiple',
          type: 'boolean',
          defaultValue: false,
          helperText: 'Allow multiple file selection',
        },
        {
          name: 'accept',
          type: 'string',
          defaultValue: 'image/*,video/*,.pdf,.doc,.docx',
          helperText: 'Accepted file types (e.g., image/*,.pdf)',
        },
        {
          name: 'maxFileSize',
          type: 'number',
          defaultValue: 10,
          helperText: 'Maximum file size in MB',
          min: 1,
          max: 100,
        },
        {
          name: 'maxFiles',
          type: 'number',
          defaultValue: 5,
          helperText: 'Maximum number of files (when multiple is enabled)',
          min: 1,
          max: 20,
          showIf: (options) => options.get('multiple') === true,
        },
        {
          name: 'uploadText',
          type: 'string',
          defaultValue: 'Drag & drop files here or click to browse',
          helperText: 'Text displayed in upload area',
        },
        {
          name: 'uploadingText',
          type: 'string',
          defaultValue: 'Uploading...',
          helperText: 'Text displayed during upload',
        },
        {
          name: 'successText',
          type: 'string',
          defaultValue: 'Upload completed successfully!',
          helperText: 'Text displayed on successful upload',
        },
        {
          name: 'errorText',
          type: 'string',
          defaultValue: 'Upload failed. Please try again.',
          helperText: 'Text displayed on upload error',
        },
        {
          name: 'showProgress',
          type: 'boolean',
          defaultValue: true,
          helperText: 'Show upload progress bar',
        },
        {
          name: 'allowRemove',
          type: 'boolean',
          defaultValue: true,
          helperText: 'Allow users to remove uploaded files',
        },
        {
          name: 'primaryColor',
          type: 'color',
          defaultValue: '#007acc',
          helperText: 'Primary color for upload area and progress',
        },
        {
          name: 'borderRadius',
          type: 'number',
          defaultValue: 8,
          helperText: 'Border radius for upload area',
          min: 0,
          max: 20,
        },
        {
          name: 'height',
          type: 'string',
          defaultValue: '200px',
          helperText: 'Height of upload area (e.g., 200px, 300px)',
        },
        {
          name: 'storagePreference',
          type: 'select',
          options: [
            { label: 'Auto (by size)', value: 'auto' },
            { label: 'Supabase Storage', value: 'supabase' },
            { label: 'Cloudflare R2', value: 'r2' },
          ],
          defaultValue: 'auto',
          helperText: 'Storage backend preference',
        },
      ],
      canHaveChildren: false,
    }
  );

  // console.log('✅ Design System components registered with Builder.io:');
  // console.log(`📊 Categories created: ${Object.values(DESIGN_SYSTEM_CATEGORIES).join(', ')}`);
  // console.log('🎯 Components: ds-button, ds-input, ds-card, ds-file-upload');
  // console.log('🚀 Enhanced with categories, descriptions, and rich property controls');
}