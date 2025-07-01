import type { RequestHandler } from '@builder.io/qwik-city';
import { getSupabaseClient } from '~/lib/supabase';

/**
 * Unified Search API - Search across all content types
 */

export const onGet: RequestHandler = async ({ json, query }) => {
  const searchQuery = query.get('q');
  const contentType = query.get('type'); // 'pages', 'posts', 'media', or null for all

  if (!searchQuery) {
    json(400, { error: 'Search query is required' });
    return;
  }

  try {
    const results: any = {
      query: searchQuery,
      results: {
        pages: [],
        posts: [],
        media: []
      },
      total: 0
    };

    // Search Posts (Supabase)
    if (!contentType || contentType === 'posts') {
      const supabase = getSupabaseClient();
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, content, slug, created_at')
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(10);

      results.results.posts = posts?.map(post => ({
        id: post.id,
        title: post.title,
        type: 'post',
        url: `/posts/${post.slug}`,
        excerpt: post.content?.substring(0, 150) + '...',
        created_at: post.created_at
      })) || [];
    }

    // Search Pages (Mock Data)
    if (!contentType || contentType === 'pages') {
      // Use mock data for pages search
      try {
        const response = await fetch(
          `https://jsonplaceholder.typicode.com/posts?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json() as { results?: any[] };
          results.results.pages = data.results?.map((page: any) => ({
            id: page.id,
            title: page.name,
            type: 'page',
            url: page.data?.url || '/',
            excerpt: page.data?.description || '',
            created_at: page.createdDate
          })) || [];
        }
      } catch (_error) {
        // Silently handle API errors
      }
    }

    // Search Media (Supabase)
    if (!contentType || contentType === 'media') {
      const supabase = getSupabaseClient();
      const { data: media } = await supabase
        .from('uploaded_files')
        .select('id, original_name, file_type, url, uploaded_at')
        .ilike('original_name', `%${searchQuery}%`)
        .limit(10);

      results.results.media = media?.map(file => ({
        id: file.id,
        title: file.original_name,
        type: 'media',
        url: file.url,
        file_type: file.file_type,
        created_at: file.uploaded_at
      })) || [];
    }

    // Calculate totals
    results.total = results.results.pages.length + 
                   results.results.posts.length + 
                   results.results.media.length;

    json(200, results);
  } catch (error) {
    json(500, { 
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};