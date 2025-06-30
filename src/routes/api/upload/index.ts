import type { RequestHandler } from '@builder.io/qwik-city';
import { getCloudflareServices } from '~/lib/cloudflare';
import { supabaseStorage } from '~/lib/supabase';
import { fileUploadSchema, safeValidate } from '~/lib/validation';
import { ValidationError, handleApiError } from '~/lib/errors';

/**
 * File upload endpoint - decides between R2 and Supabase Storage
 */
export const onPost: RequestHandler = async ({ request, json, platform }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;

    // Validate input
    const validation = safeValidate(fileUploadSchema, { file, bucket });
    if (!validation.success) {
      throw new ValidationError('Invalid upload data', validation.error.flatten());
    }

    const { file: validFile, bucket: validBucket } = validation.data;

    // Generate unique filename
    const timestamp = Date.now();
    const ext = validFile.name.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
    const path = `${validBucket}/${filename}`;

    // Decide storage based on file type and size
    const useR2 = validFile.size > 1024 * 1024 * 5; // Use R2 for files > 5MB

    if (useR2 && platform?.env?.R2) {
      // Upload to Cloudflare R2
      const services = getCloudflareServices(platform);
      const arrayBuffer = await validFile.arrayBuffer();
      await services.r2!.upload(path, arrayBuffer);

      return json(200, {
        success: true,
        storage: 'r2',
        path,
        url: `/api/storage/proxy/${path}`,
        size: validFile.size,
      });
    } else {
      // Upload to Supabase Storage
      const { data, error } = await supabaseStorage.uploadFile(
        validBucket,
        filename,
        validFile
      );

      if (error) throw error;

      const { data: urlData } = supabaseStorage.getPublicUrl(validBucket, filename);

      return json(200, {
        success: true,
        storage: 'supabase',
        path: data.path,
        url: urlData.publicUrl,
        size: validFile.size,
      });
    }
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return json(statusCode, body);
  }
};
