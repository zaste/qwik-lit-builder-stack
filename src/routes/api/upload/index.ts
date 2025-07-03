import type { RequestHandler } from '@builder.io/qwik-city';
import { handleApiError } from '../../../lib/errors';
import { fileUploadSchema, safeValidate } from '../../../schemas';
import { createStorageRouter } from '../../../lib/storage/storage-router';
import { FileSecurityValidator } from '../../../lib/security/file-validator';
import { CloudflareImageProcessor } from '../../../lib/image/cloudflare-image-processor';

/**
 * File upload endpoint - uploads all files to R2 storage
 */

export const onGet: RequestHandler = async ({ json }) => {
  json(405, { error: 'Method not allowed. Use POST to upload files.' });
};

export const onPost: RequestHandler = async ({ request, json, env, cookie }) => {
  try {
    // Authentication check - CRITICAL SECURITY FIX
    const { getCurrentUser } = await import('../../../lib/auth');
    const user = await getCurrentUser(cookie);
    
    if (!user) {
      json(401, { error: 'Authentication required for file uploads' });
      return;
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    
    // Use authenticated user's ID instead of client-provided userId
    const userId = user.id;
    
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
    
    // Enhanced security validation
    const securityValidation = await FileSecurityValidator.validateFile(validFile, {
      maxSize: 1024 * 1024 * 1024, // 1GB limit
      checkMagicNumbers: true,
      sanitizeFileName: true
    });
    
    if (!securityValidation.valid) {
      json(400, {
        success: false,
        error: 'File security validation failed',
        details: securityValidation.errors,
        warnings: securityValidation.warnings
      });
      return;
    }
    
    // Log security warnings if any
    if (securityValidation.warnings && securityValidation.warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.warn('File upload security warnings:', securityValidation.warnings);
    }
    
    // Initialize simplified R2-only storage router
    // In development, this will automatically use the mock
    const storageRouter = createStorageRouter({
      r2Bucket: env.get('R2'), // Cloudflare R2 binding (may be undefined in dev)
      cloudflareAccountId: env.get('CLOUDFLARE_ACCOUNT_ID') || ''
    });
    
    // Check if file is an image for processing
    const isImage = validFile.type.startsWith('image/');
    
    if (isImage) {
      // Upload original image to R2 first
      const originalUpload = await storageRouter.uploadFile(validFile, userId);
      
      if (!originalUpload.success) {
        json(500, {
          success: false,
          error: originalUpload.error || 'Original image upload failed'
        });
        return;
      }
      
      // Generate Cloudflare Images transformation URLs using the uploaded R2 URL
      const processedImages = await CloudflareImageProcessor.processImage(validFile);
      
      // Return success response with Cloudflare Images URLs for thumbnails
      json(200, {
        success: true,
        storage: 'r2',
        type: 'image',
        original: {
          path: originalUpload.path,
          url: originalUpload.url,
          size: originalUpload.size
        },
        thumbnails: {
          thumbnail: {
            url: processedImages.thumbnails.thumbnail.url,
            size: 0, // Size calculated by Cloudflare Images
            dimensions: {
              width: processedImages.thumbnails.thumbnail.width,
              height: processedImages.thumbnails.thumbnail.height
            }
          },
          medium: {
            url: processedImages.thumbnails.medium.url,
            size: 0, // Size calculated by Cloudflare Images
            dimensions: {
              width: processedImages.thumbnails.medium.width,
              height: processedImages.thumbnails.medium.height
            }
          },
          large: {
            url: processedImages.thumbnails.large.url,
            size: 0, // Size calculated by Cloudflare Images
            dimensions: {
              width: processedImages.thumbnails.large.width,
              height: processedImages.thumbnails.large.height
            }
          }
        },
        metadata: processedImages.metadata,
        message: 'Image uploaded with Cloudflare transformations available',
        processingType: 'cloudflare-images',
        security: {
          validated: true,
          detectedType: securityValidation.detectedType,
          sanitizedName: securityValidation.sanitizedName,
          warnings: securityValidation.warnings?.length > 0 ? securityValidation.warnings : undefined
        }
      });
    } else {
      // Non-image file: upload normally
      const uploadResult = await storageRouter.uploadFile(validFile, userId);
      
      if (!uploadResult.success) {
        json(500, {
          success: false,
          error: uploadResult.error || 'Upload failed'
        });
        return;
      }
      
      // Return success response for non-image files
      json(200, {
        success: true,
        storage: 'r2',
        type: 'file',
        path: uploadResult.path,
        url: uploadResult.url,
        size: uploadResult.size,
        message: 'File uploaded successfully to R2',
        security: {
          validated: true,
          detectedType: securityValidation.detectedType,
          sanitizedName: securityValidation.sanitizedName,
          warnings: securityValidation.warnings?.length > 0 ? securityValidation.warnings : undefined
        }
      });
    }
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    json(statusCode, body);
  }
};