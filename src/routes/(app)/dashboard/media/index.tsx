import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { getCurrentUser } from '~/lib/auth';
import { getSupabaseClient } from '~/lib/supabase';
import { DSFileUpload } from '~/design-system/components/qwik-wrappers';

// Media file interface
interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  file_type: string;
  storage_backend: 'supabase' | 'r2';
  storage_path: string;
  public_url?: string;
  created_at: string;
}

export const useMediaData = routeLoader$(async ({ cookie }) => {
  const user = await getCurrentUser(cookie);
  if (!user) return null;

  const supabase = getSupabaseClient();
  
  // Get user profile for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get real file data from file_metadata table
  const { data: files, error: filesError } = await supabase
    .from('file_metadata')
    .select('*')
    .eq('user_id', user.id)
    .eq('upload_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50); // Limit for initial load

  // Get file statistics from user_file_stats view
  const { data: fileStats } = await supabase
    .from('user_file_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);
    return `${formattedSize} ${sizes[i]}`;
  };

  // Transform database records to MediaFile format
  const mediaFiles: MediaFile[] = (files || []).map(file => ({
    id: file.id,
    name: file.file_name,
    size: file.file_size,
    type: file.mime_type || 'application/octet-stream',
    url: `https://qwik-production-files.e1a6f9414e9b47f056d1731ab791f4db.r2.cloudflarestorage.com/${file.storage_path}`,
    uploadedAt: file.created_at,
    thumbnailUrl: file.thumbnail_path 
      ? `https://qwik-production-files.e1a6f9414e9b47f056d1731ab791f4db.r2.cloudflarestorage.com/${file.thumbnail_path}`
      : undefined,
    tags: file.tags || []
  }));

  return {
    user,
    profile,
    files: mediaFiles,
    stats: {
      totalFiles: fileStats?.total_files || 0,
      totalSize: fileStats?.total_size || 0,
      storageUsed: formatFileSize(fileStats?.total_size || 0)
    },
    hasError: !!filesError
  };
});

export default component$(() => {
  const mediaData = useMediaData();
  const uploadStatus = useSignal<string>('');
  const refreshKey = useSignal(0);
  const realtimeFiles = useSignal<MediaFile[]>([]);
  const isLoading = useSignal(false);

  if (!mediaData.value) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="text-gray-500">Loading...</div>
      </div>
    );
  }

  const { files, stats } = mediaData.value;

  // Function to refresh file list with real API call
  const refreshFileList = $(async () => {
    if (!mediaData.value?.user) return;
    
    isLoading.value = true;
    try {
      const response = await fetch('/api/files/list?limit=50', {
        headers: {
          'Authorization': `Bearer ${mediaData.value.user.accessToken || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        realtimeFiles.value = data.files;
      }
    } catch (error) {
      console.error('Failed to refresh file list:', error);
    } finally {
      isLoading.value = false;
    }
  });

  const handleUploadSuccess = $((event: CustomEvent) => {
    const { file } = event.detail;
    uploadStatus.value = `✅ Uploaded: ${file.name}`;
    
    // Refresh the file list with real API call
    refreshFileList();
    refreshKey.value += 1;
  });

  const handleUploadError = $((event: CustomEvent) => {
    const { file, error } = event.detail;
    uploadStatus.value = `❌ Failed: ${file.name} - ${error}`;
  });

  const handleUploadComplete = $((event: CustomEvent) => {
    const { results } = event.detail;
    const successCount = results.filter((r: any) => r.status === 'success').length;
    const errorCount = results.filter((r: any) => r.status === 'error').length;
    
    uploadStatus.value = `📊 Complete: ${successCount} uploaded, ${errorCount} failed`;
    
    setTimeout(() => {
      uploadStatus.value = '';
    }, 5000);
  });

  return (
    <div class="space-y-8">
      {/* Header */}
      <div class="border-b border-gray-200 pb-4">
        <h1 class="text-3xl font-bold text-gray-900">Media Library</h1>
        <p class="text-gray-600 mt-2">
          Upload and manage your files with intelligent storage routing
        </p>
      </div>

      {/* Storage Stats */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Total Files</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{stats.totalFiles}</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Storage Used</h3>
          <p class="text-3xl font-bold text-gray-900 mt-2">{stats.storageUsed}</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Storage Type</h3>
          <p class="text-sm text-gray-600 mt-2">
            <span class="block">✅ R2: All files (simplified architecture)</span>
            <span class="block text-gray-400">Up to 5GB per file</span>
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>
        
        <DSFileUpload
          endpoint="/api/upload"
          accept="image/*,application/pdf,text/*,video/*"
          maxSize={50 * 1024 * 1024} // 50MB
          multiple={true}
          bucket="uploads"
          class="w-full"
          onUploadSuccess$={handleUploadSuccess}
          onUploadError$={handleUploadError}
          onUploadComplete$={handleUploadComplete}
        />

        {/* Upload Status */}
        {uploadStatus.value && (
          <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p class="text-blue-800 text-sm">{uploadStatus.value}</p>
          </div>
        )}

        {/* Upload Info */}
        <div class="mt-4 text-sm text-gray-600">
          <p class="mb-2">
            <strong>Simplified Storage:</strong> All files go to Cloudflare R2 for 
            consistent performance and global CDN delivery.
          </p>
          <p>
            <strong>Supported formats:</strong> Images, PDFs, text files, videos up to 50MB
          </p>
        </div>
      </div>

      {/* File Gallery */}
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Your Files</h2>
        </div>
        
        <div class="p-6">
          {isLoading.value ? (
            <div class="text-center py-12">
              <div class="text-gray-400 text-6xl mb-4">🔄</div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Loading files...</h3>
            </div>
          ) : (realtimeFiles.value.length > 0 ? realtimeFiles.value : files).length === 0 ? (
            <div class="text-center py-12">
              <div class="text-gray-400 text-6xl mb-4">📁</div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
              <p class="text-gray-600 mb-4">
                Upload your first file using the upload area above
              </p>
              <p class="text-sm text-gray-500">
                Files will be stored securely and optimized for global delivery
              </p>
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(realtimeFiles.value.length > 0 ? realtimeFiles.value : files).map((file) => (
                <div key={file.id} class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-3">
                    <div class="text-sm font-medium text-gray-900 truncate">
                      {file.original_name}
                    </div>
                    <span class={`px-2 py-1 text-xs rounded-full ${
                      file.storage_backend === 'r2' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {file.storage_backend.toUpperCase()}
                    </span>
                  </div>
                  
                  <div class="text-sm text-gray-600 space-y-1">
                    <div>Size: {(file.file_size / 1024 / 1024).toFixed(2)} MB</div>
                    <div>Type: {file.file_type}</div>
                    <div>Uploaded: {new Date(file.created_at).toLocaleDateString()}</div>
                  </div>
                  
                  <div class="mt-4 flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Download
                    </button>
                    <button class="text-red-600 hover:text-red-800 text-sm font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Media Library - Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Upload and manage your media files with intelligent storage routing',
    },
  ],
};