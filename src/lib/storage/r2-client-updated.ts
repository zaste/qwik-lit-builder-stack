import { DevR2Mock } from './dev-r2-mock';

// Check if we're in development and R2 is not available
const isDevelopment = process.env.NODE_ENV === 'development';
const useR2Mock = isDevelopment && (!globalThis.R2 || process.env.R2_DEV_MODE === 'true');

let r2Instance;

if (useR2Mock) {
    // Use development mock
    r2Instance = new DevR2Mock({
        storageDir: process.env.R2_DEV_STORAGE_DIR || './dev-storage',
        baseUrl: process.env.R2_DEV_BASE_URL || 'http://localhost:5173/dev-files'
    });
    // eslint-disable-next-line no-console
    console.log('🔧 Using R2 development mock');
} else {
    // Use real R2 binding (production/preview)
    r2Instance = globalThis.R2;
    // eslint-disable-next-line no-console
    console.log('☁️ Using real Cloudflare R2');
}

export const R2 = r2Instance;

// Helper functions for file operations
export async function uploadToR2(key, file, metadata = {}) {
    try {
        if (!R2) {
            throw new Error('R2 storage not available');
        }
        
        const result = await R2.put(key, file, {
            httpMetadata: {
                contentType: metadata.contentType || 'application/octet-stream',
                ...metadata
            }
        });
        
        return {
            success: true,
            key,
            url: useR2Mock ? R2.getPublicUrl(key) : `https://files.yourdomain.com/${key}`,
            size: result.size,
            etag: result.etag
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('R2 upload error:', error);
        throw error;
    }
}

export async function getFromR2(key) {
    try {
        if (!R2) {
            throw new Error('R2 storage not available');
        }
        
        return await R2.get(key);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('R2 get error:', error);
        throw error;
    }
}

export async function deleteFromR2(key) {
    try {
        if (!R2) {
            throw new Error('R2 storage not available');
        }
        
        return await R2.delete(key);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('R2 delete error:', error);
        throw error;
    }
}

export function getPublicUrl(key) {
    if (useR2Mock && R2.getPublicUrl) {
        return R2.getPublicUrl(key);
    }
    
    // Production URL
    return `https://files.yourdomain.com/${key}`;
}
