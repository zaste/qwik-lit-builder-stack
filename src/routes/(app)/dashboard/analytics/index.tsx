import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const timeRange = useSignal('7d');
  const analyticsData = useSignal({
    pageViews: { value: 12543, change: '+12%' },
    uniqueVisitors: { value: 8432, change: '+8%' },
    bounceRate: { value: '34%', change: '-5%' },
    avgSessionTime: { value: '3m 42s', change: '+15%' }
  });

  const performanceData = useSignal({
    builderContent: { loadTime: '1.2s', rating: 'Excellent' },
    mediaFiles: { loadTime: '0.8s', rating: 'Excellent' },
    cacheHitRate: { value: '94%', rating: 'Good' },
    apiResponseTime: { value: '245ms', rating: 'Good' }
  });

  const contentMetrics = useSignal([
    { type: 'Pages', count: 23, views: 5642, engagement: '3.2m' },
    { type: 'Posts', count: 45, views: 8901, engagement: '5.7m' },
    { type: 'Media', count: 128, views: 2341, engagement: '1.8m' },
    { type: 'Components', count: 12, usage: 892, performance: '98%' }
  ]);

  useVisibleTask$(async () => {
    // Simulate loading analytics data
    setTimeout(() => {
      // Data would be fetched from analytics API
    }, 1000);
  });

  return (
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Analytics & Performance</h1>
          <p class="text-gray-600 mt-2">Monitor your content performance and system metrics</p>
        </div>
        <select 
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={timeRange.value}
          onChange$={(e) => timeRange.value = (e.target as HTMLSelectElement).value}
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Page Views</p>
              <p class="text-3xl font-bold text-gray-900">{analyticsData.value.pageViews.value.toLocaleString()}</p>
            </div>
            <div class="text-green-600 text-sm font-medium">
              {analyticsData.value.pageViews.change}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Unique Visitors</p>
              <p class="text-3xl font-bold text-gray-900">{analyticsData.value.uniqueVisitors.value.toLocaleString()}</p>
            </div>
            <div class="text-green-600 text-sm font-medium">
              {analyticsData.value.uniqueVisitors.change}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p class="text-3xl font-bold text-gray-900">{analyticsData.value.bounceRate.value}</p>
            </div>
            <div class="text-green-600 text-sm font-medium">
              {analyticsData.value.bounceRate.change}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Avg. Session Time</p>
              <p class="text-3xl font-bold text-gray-900">{analyticsData.value.avgSessionTime.value}</p>
            </div>
            <div class="text-green-600 text-sm font-medium">
              {analyticsData.value.avgSessionTime.change}
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Metrics */}
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">System Performance</h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Builder.io Content</h3>
                <p class="text-sm text-gray-500">Average load time</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold text-gray-900">{performanceData.value.builderContent.loadTime}</p>
                <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {performanceData.value.builderContent.rating}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Media Files</h3>
                <p class="text-sm text-gray-500">Average load time</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold text-gray-900">{performanceData.value.mediaFiles.loadTime}</p>
                <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {performanceData.value.mediaFiles.rating}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">Cache Hit Rate</h3>
                <p class="text-sm text-gray-500">Caching efficiency</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold text-gray-900">{performanceData.value.cacheHitRate.value}</p>
                <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {performanceData.value.cacheHitRate.rating}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-medium text-gray-900">API Response Time</h3>
                <p class="text-sm text-gray-500">Average response time</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold text-gray-900">{performanceData.value.apiResponseTime.value}</p>
                <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {performanceData.value.apiResponseTime.rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Analytics */}
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Content Analytics</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              {contentMetrics.value.map((metric, index) => (
                <div key={index} class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 class="font-medium text-gray-900">{metric.type}</h3>
                    <p class="text-sm text-gray-500">{metric.count} items</p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-semibold text-gray-900">
                      {metric.views ? metric.views.toLocaleString() : metric.usage}
                    </p>
                    <p class="text-xs text-gray-500">
                      {metric.engagement || metric.performance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div class="grid lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Traffic Trends</h2>
          </div>
          <div class="p-6">
            <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-2">📈</div>
                <p class="text-gray-600">Traffic Chart</p>
                <p class="text-sm text-gray-500">Integration with Google Analytics</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Component Usage</h2>
          </div>
          <div class="p-6">
            <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-2">🧩</div>
                <p class="text-gray-600">Component Usage Chart</p>
                <p class="text-sm text-gray-500">Most used design system components</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="font-medium text-blue-900 mb-4">📊 AI-Powered Insights</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-blue-800">
              <strong>Performance Tip:</strong> Your Builder.io pages load 23% faster than average. 
              Consider using this architecture for more content.
            </p>
          </div>
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-blue-800">
              <strong>Content Insight:</strong> Posts with DS Card components have 31% higher engagement rates.
            </p>
          </div>
          <div class="bg-white rounded-lg p-4">
            <p class="text-sm text-blue-800">
              <strong>Optimization:</strong> Enable image compression to reduce media load times by ~40%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Analytics - Performance Metrics',
  meta: [
    {
      name: 'description',
      content: 'Monitor your content performance and system metrics',
    },
  ],
};