/**
 * Dashboard Stats API - Real implementation
 * Returns actual storage and user statistics
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import { handleApiError } from '~/lib/errors';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

export const onGet: RequestHandler = async ({ json, env, request }) => {
  try {
    console.log('📊 Dashboard stats request received');
    
    // Get user from authentication header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      json(401, { error: 'Authentication required' });
      return;
    }

    // Initialize Supabase client with service role for admin queries
    const supabaseUrl = env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      json(500, { error: 'Server configuration error' });
      return;
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get user ID from JWT token (simplified - in production use proper JWT validation)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      json(401, { error: 'Invalid authentication' });
      return;
    }

    console.log('✅ User authenticated:', user.id);

    // Get user file statistics from database
    const { data: userStats, error: statsError } = await supabase
      .from('user_file_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      console.log('📊 No stats found, returning defaults');
      // Return default stats if no files exist yet
      json(200, {
        totalFiles: 0,
        totalSize: 0,
        storageUsed: '0 B',
        imageCount: 0,
        videoCount: 0,
        audioCount: 0,
        documentCount: 0,
        lastUpload: null,
        avgFileSize: 0,
        activeSessions: 1 // TODO: Get from session tracking
      });
      return;
    }

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 B';
      
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);
      return `${formattedSize} ${sizes[i]}`;
    };

    console.log('📊 Stats retrieved successfully:', {
      totalFiles: userStats.total_files,
      totalSize: userStats.total_size
    });

    // Return real statistics
    json(200, {
      totalFiles: userStats.total_files || 0,
      totalSize: userStats.total_size || 0,
      storageUsed: formatFileSize(userStats.total_size || 0),
      imageCount: userStats.image_count || 0,
      videoCount: userStats.video_count || 0,
      audioCount: userStats.audio_count || 0,
      documentCount: userStats.document_count || 0,
      lastUpload: userStats.last_upload,
      avgFileSize: Math.round(userStats.avg_file_size || 0),
      activeSessions: 1 // TODO: Implement real session tracking
    });

  } catch (error) {
    console.error('💥 Dashboard stats error:', error);
    const { statusCode, body } = handleApiError(error);
    json(statusCode, body);
  }
};