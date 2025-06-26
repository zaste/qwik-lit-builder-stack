import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { getCurrentUser } from '~/middleware/auth';
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

  return {
    user,
    stats: {
      postsCount: postsCount || 0,
    },
    recentPosts: recentPosts || [],
  };
});

export default component$(() => {
  const dashboardData = useDashboardData();

  if (!dashboardData.value) {
    return <div>Loading...</div>;
  }

  const { user, stats, recentPosts } = dashboardData.value;

  return (
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-8">
        Welcome back, {user.email}!
      </h1>
      
      {/* Stats Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Total Posts</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{stats.postsCount}</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Storage Used</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">0 MB</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Active Sessions</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">1</p>
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