import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { getCurrentUser } from '~/lib/auth';
import { getSupabaseClient } from '~/lib/supabase';

export const useDashboardData = routeLoader$(async ({ cookie }) => {
  const user = await getCurrentUser(cookie);
  if (!user) return null;

  const supabase = getSupabaseClient();
  
  // Get user's posts count
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id);

  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, title, published, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get file statistics from user_file_stats view
  const { data: fileStats } = await supabase
    .from('user_file_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return {
    user,
    stats: {
      postsCount: postsCount || 0,
      // Real file statistics
      totalFiles: fileStats?.total_files || 0,
      totalSize: fileStats?.total_size || 0,
      storageUsed: formatFileSize(fileStats?.total_size || 0),
      activeSessions: 1 // TODO: Implement real session tracking
    },
    recentPosts: recentPosts || [],
  };
});

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${formattedSize} ${sizes[i]}`;
}

export default component$(() => {
  const data = useDashboardData();
  const realtimeStats = useSignal<any>(null);

  // Fetch realtime stats from API
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${data.value?.user.accessToken || ''}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        realtimeStats.value = stats;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch realtime stats:', error);
    }
  });

  if (!data.value) {
    return <div>Loading...</div>;
  }

  const { user, stats, recentPosts } = data.value;

  return (
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-8">
        Welcome back, {user.email}!
      </h1>
      
      {/* Stats Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="text-2xl mr-3">📝</div>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Posts</h3>
              <p class="text-3xl font-bold text-gray-900">{stats.postsCount}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="text-2xl mr-3">📄</div>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Pages</h3>
              <p class="text-3xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="text-2xl mr-3">🧩</div>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Components</h3>
              <p class="text-3xl font-bold text-gray-900">4</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="text-2xl mr-3">📁</div>
            <div>
              <h3 class="text-sm font-medium text-gray-500">Media Files</h3>
              <p class="text-3xl font-bold text-gray-900">{realtimeStats.value?.totalFiles || stats.totalFiles || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="grid lg:grid-cols-3 gap-8 mb-8">
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div class="p-6 space-y-3">
            <a href="/dashboard/pages" class="block bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors">
              <div class="flex items-center">
                <span class="text-xl mr-3">📄</span>
                <div>
                  <h3 class="font-medium text-gray-900">Create Page</h3>
                  <p class="text-sm text-gray-600">Build with Builder.io</p>
                </div>
              </div>
            </a>
            <a href="/dashboard/posts" class="block bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors">
              <div class="flex items-center">
                <span class="text-xl mr-3">📝</span>
                <div>
                  <h3 class="font-medium text-gray-900">Write Post</h3>
                  <p class="text-sm text-gray-600">Create blog content</p>
                </div>
              </div>
            </a>
            <a href="/dashboard/media" class="block bg-purple-50 hover:bg-purple-100 p-4 rounded-lg transition-colors">
              <div class="flex items-center">
                <span class="text-xl mr-3">📁</span>
                <div>
                  <h3 class="font-medium text-gray-900">Upload Media</h3>
                  <p class="text-sm text-gray-600">Add files and images</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Design System Status</h2>
          </div>
          <div class="p-6 space-y-3">
            {['DS Button', 'DS Card', 'DS Input', 'DS File Upload'].map((component) => (
              <div key={component} class="flex items-center justify-between">
                <span class="text-sm font-medium">{component}</span>
                <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  ✅ Active
                </span>
              </div>
            ))}
            <a href="/dashboard/components" class="block text-center bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors text-sm text-blue-600 font-medium">
              Manage Components →
            </a>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">System Health</h2>
          </div>
          <div class="p-6 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Builder.io</span>
              <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                ✅ Connected
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Supabase</span>
              <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                ✅ Connected
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">R2 Storage</span>
              <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                ✅ Connected
              </span>
            </div>
            <a href="/dashboard/analytics" class="block text-center bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-colors text-sm text-blue-600 font-medium">
              View Analytics →
            </a>
          </div>
        </div>
      </div>
      
      {/* Recent Posts */}
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Posts</h2>
        </div>
        <div class="divide-y divide-gray-200">
          {recentPosts.length === 0 ? (
            <div class="px-6 py-4 text-gray-500">No posts yet</div>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} class="px-6 py-4 hover:bg-gray-50">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">{post.title}</h3>
                    <p class="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span class={`px-2 py-1 text-xs rounded-full ${
                    post.published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Dashboard - Qwik + LIT + Builder.io',
  meta: [
    {
      name: 'description',
      content: 'User dashboard',
    },
  ],
};