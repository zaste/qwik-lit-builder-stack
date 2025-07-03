/**
 * Files List API - Real implementation
 * Returns actual user files from database and storage
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import { handleApiError } from '../../../../lib/errors';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../types/database.types';

export interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  tags: string[];
}

export const onGet: RequestHandler = async ({ json, env, request, url }) => {
  try {
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const filter = url.searchParams.get('filter') || 'all'; // all, images, videos, documents
    const search = url.searchParams.get('search') || '';

    // Get user from authentication header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      json(401, { error: 'Authentication required' });
      return;
    }

    // Initialize Supabase client
    const supabaseUrl = env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      json(500, { error: 'Server configuration error' });
      return;
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      json(401, { error: 'Invalid authentication' });
      return;
    }

    // Build query based on filters
    let query = supabase
      .from('file_metadata')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('upload_status', 'completed')
      .order('created_at', { ascending: false });

    // Apply MIME type filter
    if (filter !== 'all') {
      switch (filter) {
        case 'images':
          query = query.like('mime_type', 'image/%');
          break;
        case 'videos':
          query = query.like('mime_type', 'video/%');
          break;
        case 'audio':
          query = query.like('mime_type', 'audio/%');
          break;
        case 'documents':
          query = query.or('mime_type.like.application/%,mime_type.like.text/%');
          break;
      }
    }

    // Apply search filter
    if (search) {
      query = query.textSearch('search_vector', search);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: files, error: filesError, count } = await query;

    if (filesError) {
      json(500, { error: 'Failed to fetch files' });
      return;
    }

    // Generate file URLs (R2 public URLs)
    const cloudflareAccountId = env.get('CLOUDFLARE_ACCOUNT_ID') || '';
    const generateFileUrl = (storagePath: string): string => {
      return `https://qwik-production-files.${cloudflareAccountId}.r2.cloudflarestorage.com/${storagePath}`;
    };

    // Transform database records to MediaFile format
    const mediaFiles: MediaFile[] = (files || []).map(file => ({
      id: file.id,
      name: file.file_name,
      size: file.file_size,
      type: file.mime_type || 'application/octet-stream',
      url: generateFileUrl(file.storage_path),
      uploadedAt: file.created_at,
      thumbnailUrl: file.thumbnail_path ? generateFileUrl(file.thumbnail_path) : undefined,
      tags: file.tags || []
    }));

    // Calculate pagination info
    const totalFiles = count || 0;
    const totalPages = Math.ceil(totalFiles / limit);
    const hasMore = page < totalPages;

    // Files response prepared successfully

    // Return real file list
    json(200, {
      files: mediaFiles,
      pagination: {
        page,
        limit,
        total: totalFiles,
        totalPages,
        hasMore
      },
      stats: {
        totalFiles,
        filteredCount: mediaFiles.length
      }
    });

  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    json(statusCode, body);
  }
};