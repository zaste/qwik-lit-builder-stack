import type { RequestHandler } from '@builder.io/qwik-city';
import { getSupabaseClient } from '~/lib/supabase';

/**
 * Posts Content API - Unified routing for Supabase posts
 */

export const onGet: RequestHandler = async ({ json, query }) => {
  try {
    const supabase = getSupabaseClient();
    const page = parseInt(query.get('page') || '1');
    const limit = parseInt(query.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get posts with pagination
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    json(200, {
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    json(500, { 
      error: 'Failed to fetch posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const supabase = getSupabaseClient();
    const postData = await request.json();

    const { data: post, error } = await supabase
      .from('posts')
      .insert([{
        title: postData.title,
        content: postData.content,
        slug: postData.slug || postData.title?.toLowerCase().replace(/\s+/g, '-'),
        published: postData.published || false,
        author_id: postData.author_id
      }])
      .select()
      .single();

    if (error) throw error;

    json(201, { post });
  } catch (error) {
    console.error('Failed to create post:', error);
    json(500, { 
      error: 'Failed to create post',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};