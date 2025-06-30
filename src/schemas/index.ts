import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export const fileUploadSchema = z.object({
  file: z.any().refine((file) => {
    // Accept File objects or objects with name and size properties
    return file && 
           typeof file === 'object' && 
           ('name' in file || 'filename' in file) && 
           ('size' in file || 'length' in file);
  }, 'Must be a valid file'),
  bucket: z.string().optional().default('uploads'),
});

export const validate = {
  user: (data: unknown) => userSchema.safeParse(data),
  fileUpload: (data: unknown) => fileUploadSchema.safeParse(data),
};

// Generic safe validation function
export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};
