import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const selectedTemplate = useSignal('landing-page');

  const templates = [
    {
      id: 'landing-page',
      name: 'Landing Page',
      description: 'Hero section with features and CTA',
      components: ['ds-button', 'ds-card'],
      preview: '/images/templates/landing-preview.jpg'
    },
    {
      id: 'blog-post',
      name: 'Blog Post',
      description: 'Article layout with sidebar',
      components: ['ds-card'],
      preview: '/images/templates/blog-preview.jpg'
    },
    {
      id: 'dashboard-layout',
      name: 'Dashboard Layout',
      description: 'Admin interface with navigation',
      components: ['ds-button', 'ds-input', 'ds-card'],
      preview: '/images/templates/dashboard-preview.jpg'
    },
    {
      id: 'contact-form',
      name: 'Contact Form',
      description: 'Form with validation and file upload',
      components: ['ds-input', 'ds-file-upload', 'ds-button'],
      preview: '/images/templates/contact-preview.jpg'
    }
  ];

  const templateStructures = {
    'landing-page': {
      sections: [
        {
          name: 'Hero Section',
          components: ['Heading', 'ds-button'],
          code: `<section class="hero">
  <h1>Welcome to Our Platform</h1>
  <ds-button variant="primary" size="large">Get Started</ds-button>
</section>`
        },
        {
          name: 'Features Grid',
          components: ['ds-card'],
          code: `<section class="features">
  <ds-card variant="elevated">
    <h3>Feature 1</h3>
    <p>Description of feature</p>
  </ds-card>
  <ds-card variant="elevated">
    <h3>Feature 2</h3>
    <p>Description of feature</p>
  </ds-card>
</section>`
        }
      ]
    },
    'blog-post': {
      sections: [
        {
          name: 'Article Header',
          components: ['Heading'],
          code: `<header class="article-header">
  <h1>Article Title</h1>
  <p class="meta">Published on Date</p>
</header>`
        },
        {
          name: 'Content Area',
          components: ['ds-card'],
          code: `<main class="article-content">
  <ds-card variant="default">
    <p>Article content goes here...</p>
  </ds-card>
</main>`
        }
      ]
    }
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate.value);
  const currentStructure = templateStructures[selectedTemplate.value as keyof typeof templateStructures];

  return (
    <div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Page Templates</h1>
        <p class="text-gray-600 mt-2">Pre-built page layouts using your design system components</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        {/* Template List */}
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Available Templates</h2>
            </div>
            <div class="divide-y">
              {templates.map((template) => (
                <button
                  key={template.id}
                  class={`w-full px-6 py-4 text-left hover:bg-gray-50 ${
                    selectedTemplate.value === template.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick$={() => selectedTemplate.value = template.id}
                >
                  <h3 class="font-medium text-gray-900">{template.name}</h3>
                  <p class="text-sm text-gray-500 mt-1">{template.description}</p>
                  <div class="flex flex-wrap gap-1 mt-2">
                    {template.components.map((comp) => (
                      <span key={comp} class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {comp}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Actions */}
          <div class="bg-white rounded-lg shadow-sm border mt-6">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Template Actions</h2>
            </div>
            <div class="p-6 space-y-3">
              <button class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                Create Page from Template
              </button>
              <button class="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                Export Template
              </button>
              <button class="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">
                Duplicate Template
              </button>
            </div>
          </div>
        </div>

        {/* Template Preview & Structure */}
        <div class="lg:col-span-2 space-y-6">
          {/* Template Preview */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Template Preview - {currentTemplate?.name}</h2>
            </div>
            <div class="p-6">
              <div class="bg-gray-100 rounded-lg p-8 min-h-64 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-6xl mb-4">📄</div>
                  <p class="text-gray-600">Template Preview</p>
                  <p class="text-sm text-gray-500 mt-2">{currentTemplate?.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Template Structure */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Template Structure</h2>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                {currentStructure?.sections.map((section, index) => (
                  <div key={index} class="border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="font-medium text-gray-900">{section.name}</h3>
                      <div class="flex flex-wrap gap-1">
                        {section.components.map((comp) => (
                          <span key={comp} class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                    <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      <code>{section.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Template Components */}
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Used Components</h2>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 gap-4">
                {currentTemplate?.components.map((comp) => (
                  <div key={comp} class="border rounded-lg p-4 text-center">
                    <div class="text-2xl mb-2">🧩</div>
                    <h3 class="font-medium text-gray-900">{comp}</h3>
                    <button class="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                      Configure →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Templates - Page Templates',
  meta: [
    {
      name: 'description',
      content: 'Pre-built page layouts using design system components',
    },
  ],
};