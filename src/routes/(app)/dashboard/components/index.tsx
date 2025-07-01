import { component$, useSignal, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const selectedComponent = useSignal('ds-button');
  const componentProps = useSignal<any>({
    'ds-button': { variant: 'primary', size: 'medium', text: 'Sample Button' },
    'ds-card': { variant: 'default', content: '<p>Sample card content</p>' },
    'ds-input': { type: 'text', placeholder: 'Enter text...', label: 'Sample Input' },
    'ds-file-upload': { accept: 'image/*', multiple: false }
  });

  const components = [
    {
      name: 'ds-button',
      title: 'DS Button',
      description: 'Interactive button with variants and sizes',
      props: [
        { name: 'variant', type: 'select', options: ['primary', 'secondary'], default: 'primary' },
        { name: 'size', type: 'select', options: ['medium', 'large'], default: 'medium' },
        { name: 'disabled', type: 'boolean', default: false },
        { name: 'text', type: 'string', default: 'Button Text' }
      ]
    },
    {
      name: 'ds-card',
      title: 'DS Card',
      description: 'Container component with variants',
      props: [
        { name: 'variant', type: 'select', options: ['default', 'elevated'], default: 'default' },
        { name: 'content', type: 'richtext', default: '<p>Card content</p>' }
      ]
    },
    {
      name: 'ds-input',
      title: 'DS Input',
      description: 'Form input with validation',
      props: [
        { name: 'type', type: 'select', options: ['text', 'email', 'password'], default: 'text' },
        { name: 'placeholder', type: 'string', default: 'Enter text...' },
        { name: 'label', type: 'string', default: 'Input Label' },
        { name: 'required', type: 'boolean', default: false }
      ]
    },
    {
      name: 'ds-file-upload',
      title: 'DS File Upload',
      description: 'File upload with drag & drop',
      props: [
        { name: 'accept', type: 'string', default: 'image/*' },
        { name: 'multiple', type: 'boolean', default: false },
        { name: 'maxSize', type: 'number', default: 10485760 }
      ]
    }
  ];

  const updateProp = $((propName: string, value: any) => {
    componentProps.value = {
      ...componentProps.value,
      [selectedComponent.value]: {
        ...componentProps.value[selectedComponent.value],
        [propName]: value
      }
    };
  });

  const currentComponent = components.find(c => c.name === selectedComponent.value);
  const currentProps = componentProps.value[selectedComponent.value];

  return (
    <div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Design System Components</h1>
        <p class="text-gray-600 mt-2">Manage and preview your LIT web components</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        {/* Component List */}
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Available Components</h2>
            </div>
            <div class="divide-y">
              {components.map((component) => (
                <button
                  key={component.name}
                  class={`w-full px-6 py-4 text-left hover:bg-gray-50 ${
                    selectedComponent.value === component.name ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick$={() => selectedComponent.value = component.name}
                >
                  <h3 class="font-medium text-gray-900">{component.title}</h3>
                  <p class="text-sm text-gray-500 mt-1">{component.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Component Registration Status */}
          <div class="bg-white rounded-lg shadow-sm border mt-6">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Builder.io Registration</h2>
            </div>
            <div class="p-6">
              <div class="space-y-3">
                {components.map((component) => (
                  <div key={component.name} class="flex items-center justify-between">
                    <span class="text-sm font-medium">{component.title}</span>
                    <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      ✅ Registered
                    </span>
                  </div>
                ))}
              </div>
              <button class="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                Re-register Components
              </button>
            </div>
          </div>
        </div>

        {/* Component Preview & Props */}
        <div class="lg:col-span-2 space-y-6">
          {/* Live Preview */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Live Preview - {currentComponent?.title}</h2>
            </div>
            <div class="p-8 bg-gray-50 min-h-32 flex items-center justify-center">
              {selectedComponent.value === 'ds-button' && (
                <ds-button 
                  variant={currentProps.variant}
                  size={currentProps.size}
                  disabled={currentProps.disabled}
                >
                  {currentProps.text}
                </ds-button>
              )}
              {selectedComponent.value === 'ds-card' && (
                <ds-card variant={currentProps.variant}>
                  <div dangerouslySetInnerHTML={currentProps.content}></div>
                </ds-card>
              )}
              {selectedComponent.value === 'ds-input' && (
                <ds-input
                  type={currentProps.type}
                  placeholder={currentProps.placeholder}
                  label={currentProps.label}
                  required={currentProps.required}
                />
              )}
              {selectedComponent.value === 'ds-file-upload' && (
                <ds-file-upload
                  accept={currentProps.accept}
                  multiple={currentProps.multiple}
                  maxSize={currentProps.maxSize}
                />
              )}
            </div>
          </div>

          {/* Props Editor */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Properties</h2>
            </div>
            <div class="p-6 space-y-4">
              {currentComponent?.props.map((prop) => (
                <div key={prop.name}>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {prop.name}
                  </label>
                  {prop.type === 'select' ? (
                    <select
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentProps[prop.name]}
                      onChange$={(e) => updateProp(prop.name, (e.target as HTMLSelectElement).value)}
                    >
                      {'options' in prop && prop.options ? prop.options.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                      )) : null}
                    </select>
                  ) : prop.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      class="mr-2"
                      checked={currentProps[prop.name]}
                      onChange$={(e) => updateProp(prop.name, (e.target as HTMLInputElement).checked)}
                    />
                  ) : prop.type === 'number' ? (
                    <input
                      type="number"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentProps[prop.name]}
                      onInput$={(e) => updateProp(prop.name, parseInt((e.target as HTMLInputElement).value))}
                    />
                  ) : (
                    <input
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={currentProps[prop.name]}
                      onInput$={(e) => updateProp(prop.name, (e.target as HTMLInputElement).value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Generated Code */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Generated Code</h2>
            </div>
            <div class="p-6">
              <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>
{`<${selectedComponent.value}${Object.entries(currentProps).map(([key, value]) => 
  typeof value === 'boolean' && value ? ` ${key}` :
  typeof value === 'boolean' && !value ? '' :
  ` ${key}="${value}"`
).join('')}>`}
{selectedComponent.value === 'ds-button' ? currentProps.text : ''}
{selectedComponent.value === 'ds-card' ? '\n  ' + currentProps.content + '\n' : ''}
{`</${selectedComponent.value}>`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Components - Design System',
  meta: [
    {
      name: 'description',
      content: 'Manage and preview your design system components',
    },
  ],
};