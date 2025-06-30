import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const activeTab = useSignal('automation');

  const workflows = [
    {
      id: 'image-optimization',
      name: 'Image Optimization',
      description: 'Auto-optimize uploaded images',
      status: 'active',
      trigger: 'File Upload',
      actions: ['Resize', 'Compress', 'Generate Thumbnails'],
      lastRun: '2 minutes ago'
    },
    {
      id: 'content-backup',
      name: 'Content Backup',
      description: 'Daily backup of all content',
      status: 'active',
      trigger: 'Schedule (Daily)',
      actions: ['Export Content', 'Upload to Storage', 'Send Report'],
      lastRun: '1 day ago'
    },
    {
      id: 'seo-analysis',
      name: 'SEO Analysis',
      description: 'Analyze pages for SEO issues',
      status: 'inactive',
      trigger: 'Page Publish',
      actions: ['Check Meta Tags', 'Analyze Content', 'Generate Report'],
      lastRun: 'Never'
    }
  ];

  const automationRules = [
    {
      name: 'Auto-publish Blog Posts',
      condition: 'Post scheduled for future date',
      action: 'Publish automatically',
      enabled: true
    },
    {
      name: 'Image Compression',
      condition: 'File size > 1MB',
      action: 'Compress to 80% quality',
      enabled: true
    },
    {
      name: 'Broken Link Detection',
      condition: 'External link returns 404',
      action: 'Send notification',
      enabled: false
    }
  ];

  const integrations = [
    {
      name: 'Builder.io',
      description: 'Visual page editor',
      status: 'connected',
      lastSync: '5 minutes ago'
    },
    {
      name: 'Cloudflare R2',
      description: 'File storage',
      status: 'connected',
      lastSync: '1 minute ago'
    },
    {
      name: 'Supabase',
      description: 'Database and auth',
      status: 'connected',
      lastSync: 'Real-time'
    },
    {
      name: 'Google Analytics',
      description: 'Website analytics',
      status: 'not-connected',
      lastSync: 'Never'
    }
  ];

  return (
    <div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Workflows & Automation</h1>
        <p class="text-gray-600 mt-2">Automate your content management processes</p>
      </div>

      {/* Tabs */}
      <div class="border-b border-gray-200 mb-8">
        <nav class="-mb-px flex space-x-8">
          {[
            { id: 'automation', label: '🤖 Automation' },
            { id: 'workflows', label: '🔄 Workflows' },
            { id: 'integrations', label: '🔌 Integrations' }
          ].map((tab) => (
            <button
              key={tab.id}
              class={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab.value === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick$={() => activeTab.value = tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Automation Tab */}
      {activeTab.value === 'automation' && (
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Automation Rules</h2>
            </div>
            <div class="divide-y">
              {automationRules.map((rule, index) => (
                <div key={index} class="px-6 py-4 flex items-center justify-between">
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-900">{rule.name}</h3>
                    <p class="text-sm text-gray-500 mt-1">
                      When: {rule.condition} → Then: {rule.action}
                    </p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      rule.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button class="text-blue-600 hover:text-blue-800 text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="font-medium text-blue-900 mb-2">🤖 AI-Powered Automation</h3>
            <p class="text-blue-800 text-sm">
              Enable intelligent automation for content optimization, SEO improvements, 
              and performance monitoring. Our AI can automatically optimize images, 
              suggest content improvements, and detect accessibility issues.
            </p>
            <button class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
              Enable AI Automation
            </button>
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab.value === 'workflows' && (
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b flex justify-between items-center">
              <h2 class="text-lg font-semibold">Active Workflows</h2>
              <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                Create Workflow
              </button>
            </div>
            <div class="divide-y">
              {workflows.map((workflow) => (
                <div key={workflow.id} class="px-6 py-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3">
                        <h3 class="font-medium text-gray-900">{workflow.name}</h3>
                        <span class={`px-2 py-1 text-xs rounded-full ${
                          workflow.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workflow.status}
                        </span>
                      </div>
                      <p class="text-sm text-gray-500 mt-1">{workflow.description}</p>
                      <div class="mt-2 text-xs text-gray-400">
                        <span>Trigger: {workflow.trigger}</span>
                        <span class="mx-2">•</span>
                        <span>Last run: {workflow.lastRun}</span>
                      </div>
                      <div class="flex flex-wrap gap-1 mt-2">
                        {workflow.actions.map((action) => (
                          <span key={action} class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button class="text-gray-600 hover:text-gray-800 text-sm">
                        Configure
                      </button>
                      <button class="text-blue-600 hover:text-blue-800 text-sm">
                        Run Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab.value === 'integrations' && (
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">Service Integrations</h2>
            </div>
            <div class="divide-y">
              {integrations.map((integration, index) => (
                <div key={index} class="px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span class="text-lg">🔌</span>
                    </div>
                    <div>
                      <h3 class="font-medium text-gray-900">{integration.name}</h3>
                      <p class="text-sm text-gray-500">{integration.description}</p>
                      <p class="text-xs text-gray-400 mt-1">
                        Last sync: {integration.lastSync}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      integration.status === 'connected' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {integration.status === 'connected' ? '✅ Connected' : '❌ Not Connected'}
                    </span>
                    <button class="text-blue-600 hover:text-blue-800 text-sm">
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 class="font-medium text-green-900 mb-2">🔗 Available Integrations</h3>
            <p class="text-green-800 text-sm mb-3">
              Connect with popular services to extend your content management capabilities.
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Zapier', 'Slack', 'Discord', 'Mailchimp', 'Stripe', 'Shopify', 'WordPress', 'GitHub'].map((service) => (
                <button key={service} class="bg-white border border-green-200 rounded-lg p-3 text-center hover:bg-green-100">
                  <span class="text-sm font-medium text-green-900">{service}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Workflows - Automation',
  meta: [
    {
      name: 'description',
      content: 'Automate your content management processes',
    },
  ],
};