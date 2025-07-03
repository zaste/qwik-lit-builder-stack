import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export const fileUploadSchema = z.object({
  file: z.any().refine((file) => {
    // Strict validation for File objects
    if (!file || typeof file !== 'object') {
      return false;
    }
    
    // Must be an actual File object or compatible
    const hasName = 'name' in file && typeof file.name === 'string';
    const hasSize = 'size' in file && typeof file.size === 'number';
    const hasType = 'type' in file && typeof file.type === 'string';
    
    // File size validation (max 1GB)
    if (hasSize && file.size > 1024 * 1024 * 1024) {
      return false;
    }
    
    // Basic file name validation
    if (hasName && (file.name.length === 0 || file.name.includes('../') || file.name.includes('\\'))) {
      return false;
    }
    
    return hasName && hasSize && hasType;
  }, 'Must be a valid file with name, size, and type. Max size 1GB. No path traversal characters.'),
  bucket: z.string()
    .min(1, 'Bucket name is required')
    .max(63, 'Bucket name too long') 
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid bucket name format')
    .default('uploads'),
});

export const validate = {
  user: (data: unknown) => userSchema.safeParse(data),
  fileUpload: (data: unknown) => fileUploadSchema.safeParse(data),
};

// Generic safe validation function
export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};
