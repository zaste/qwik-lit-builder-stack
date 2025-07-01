/**
 * Dashboard Stats API - Real implementation
 * Returns actual storage and user statistics
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import { handleApiError } from '~/lib/errors';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';
import { logger } from '~/lib/logger';

/**
 * Get active session count for user from database
 */
async function getActiveSessionCount(userId: string, supabase: any): Promise<number> {
  try {
    // Get active sessions from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Query user sessions table
    const { data, error } = await supabase
      .from('user_sessions')
      .select('session_id')
      .eq('user_id', userId)
      .gte('last_activity', fiveMinutesAgo)
      .eq('active', true);
    
    if (error) {
      logger.warn('Failed to get session count', { userId, error: error.message });
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    logger.warn('Session count query failed', { userId, error: error instanceof Error ? error.message : String(error) });
    return 0;
  }
}

export const onGet: RequestHandler = async ({ json, env, request }) => {
  try {
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
      json(500, { error: 'Server configuration error' });
      return;
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Get user ID from JWT token (simplified - in production use proper JWT validation)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      json(401, { error: 'Invalid authentication' });
      return;
    }

    // Get user file statistics from database
    const { data: userStats, error: statsError } = await supabase
      .from('user_file_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
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
        activeSessions: await getActiveSessionCount(user.id, supabase)
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

    // Stats retrieved successfully

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
      activeSessions: await getActiveSessionCount(user.id, supabase)
    });

  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    json(statusCode, body);
  }
};