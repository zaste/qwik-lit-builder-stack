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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const userId = formData.get('userId') as string | undefined;
    
    // Validate using schema
    const validation = safeValidate(fileUploadSchema, { file, bucket });
    if (!validation.success) {
      json(400, { 
        error: 'Invalid file upload data',
        details: validation.error.issues.map(issue => issue.message)
      });
      return;
    }
    
    const validatedData = validation.data;
    const validFile = validatedData.file;
    
    // Initialize simplified R2-only storage router
    const storageRouter = createStorageRouter({
      r2Bucket: env.get('R2'), // Cloudflare R2 binding
      cloudflareAccountId: env.get('CLOUDFLARE_ACCOUNT_ID') || ''
    });
    
    // Upload file to R2 storage
    const uploadResult = await storageRouter.uploadFile(validFile, userId);
    
    if (!uploadResult.success) {
      json(500, {
        success: false,
        error: uploadResult.error || 'Upload failed'
      });
      return;
    }
    
    // R2 upload successful
    
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
    const { statusCode, body } = handleApiError(error);
    json(statusCode, body);
  }
};