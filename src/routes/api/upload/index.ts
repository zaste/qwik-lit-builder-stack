import type { RequestHandler } from '@builder.io/qwik-city';
import { handleApiError } from '~/lib/errors';
import { fileUploadSchema, safeValidate } from '~/schemas';
import { createStorageRouter } from '~/lib/storage/storage-router';

/**
 * File upload endpoint - uploads all files to R2 storage
 */

export const onGet: RequestHandler = async ({ json }) => {
  json(405, { error: 'Method not allowed. Use POST to upload files.' });
};

export const onPost: RequestHandler = async ({ request, json, env }) => {
  try {
    console.log('🔍 Real upload request received');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const userId = formData.get('userId') as string | undefined;
    
    console.log('📁 File info:', { 
      name: file?.name, 
      size: file?.size, 
      type: file?.type, 
      bucket,
      userId 
    });
    
    // Validate using schema
    const validation = safeValidate(fileUploadSchema, { file, bucket });
    if (!validation.success) {
      console.error('❌ File validation failed:', validation.error.issues);
      json(400, { 
        error: 'Invalid file upload data',
        details: validation.error.issues.map(issue => issue.message)
      });
      return;
    }
    
    console.log('✅ File validation passed');
    
    const validatedData = validation.data;
    const validFile = validatedData.file;
    
    // Initialize simplified R2-only storage router
    const storageRouter = createStorageRouter({
      r2Bucket: env.get('R2'), // Cloudflare R2 binding
      cloudflareAccountId: env.get('CLOUDFLARE_ACCOUNT_ID') || ''
    });
    
    // Upload file to R2 storage
    console.log('🚀 Starting R2 upload...');
    const uploadResult = await storageRouter.uploadFile(validFile, userId);
    
    if (!uploadResult.success) {
      console.error('❌ Upload failed:', uploadResult.error);
      json(500, {
        success: false,
        error: uploadResult.error || 'Upload failed'
      });
      return;
    }
    
    console.log('✅ R2 upload successful:', {
      size: uploadResult.size,
      path: uploadResult.path,
      url: uploadResult.url
    });
    
    // Return success response with R2 data
    json(200, {
      success: true,
      storage: 'r2',
      path: uploadResult.path,
      url: uploadResult.url,
      size: uploadResult.size,
      message: 'File uploaded successfully to R2'
    });
  } catch (error) {
    console.error('💥 Upload endpoint error:', error);
    const { statusCode, body } = handleApiError(error);
    json(statusCode, body);
  }
};