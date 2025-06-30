import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const posts = useSignal<any[]>([]);
  const loading = useSignal(true);
  const showCreateForm = useSignal(false);
  const newPost = useSignal({ title: '', content: '', published: false });

  const loadPosts = $(async () => {
    try {
      const response = await fetch('/api/content/posts');
      if (response.ok) {
        const data = await response.json();
        posts.value = data.posts || [];
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(() => {
    loadPosts();
  });

  const createPost = $(async () => {
    try {
      const response = await fetch('/api/content/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost.value)
      });

      if (response.ok) {
        newPost.value = { title: '', content: '', published: false };
        showCreateForm.value = false;
        await loadPosts();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  });

  return (
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Posts</h1>
          <p class="text-gray-600 mt-2">Manage your blog posts and articles</p>
        </div>
        <button 
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick$={() => showCreateForm.value = !showCreateForm.value}
        >
          {showCreateForm.value ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {/* Create Post Form */}
      {showCreateForm.value && (
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 class="text-xl font-semibold mb-4">Create New Post</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newPost.value.title}
                onInput$={(e) => newPost.value = { ...newPost.value, title: (e.target as HTMLInputElement).value }}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                rows={6}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newPost.value.content}
                onInput$={(e) => newPost.value = { ...newPost.value, content: (e.target as HTMLTextAreaElement).value }}
              />
            </div>
            <div class="flex items-center">
              <input
                type="checkbox"
                id="published"
                class="mr-2"
                checked={newPost.value.published}
                onChange$={(e) => newPost.value = { ...newPost.value, published: (e.target as HTMLInputElement).checked }}
              />
              <label for="published" class="text-sm font-medium text-gray-700">
                Publish immediately
              </label>
            </div>
            <div class="flex space-x-3">
              <button
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick$={createPost}
              >
                Create Post
              </button>
              <button
                class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                onClick$={() => showCreateForm.value = false}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold">Your Posts</h2>
        </div>
        <div class="divide-y">
          {loading.value ? (
            <div class="px-6 py-8 text-center text-gray-500">
              Loading posts...
            </div>
          ) : posts.value.length === 0 ? (
            <div class="px-6 py-8 text-center text-gray-500">
              <p>No posts found.</p>
              <p class="text-sm mt-2">Create your first blog post above.</p>
            </div>
          ) : (
            posts.value.map((post) => (
              <div key={post.id} class="px-6 py-4 hover:bg-gray-50">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900">{post.title}</h3>
                    <p class="text-sm text-gray-500 mt-1">
                      {post.content?.substring(0, 100)}...
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                      Created: {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      post.published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    <a 
                      href={`/posts/${post.slug}`}
                      class="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View →
                    </a>
                  </div>
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
  title: 'Posts - Content Management',
  meta: [
    {
      name: 'description',
      content: 'Manage your blog posts and articles',
    },
  ],
};