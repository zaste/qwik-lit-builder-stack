#!/usr/bin/env node

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('\n🔧 SETTING UP R2 DEVELOPMENT ENVIRONMENT');
console.log('============================================================');

// Create development R2 mock/emulation setup
const devR2Config = {
    // Development storage directory
    storageDir: './dev-storage',
    
    // Mock R2 configuration for local development
    r2Config: {
        bucket: 'dev-qwik-files',
        endpoint: 'http://localhost:8787', // Wrangler dev server
        accessKeyId: 'dev-access-key',
        secretAccessKey: 'dev-secret-key',
        region: 'auto'
    }
};

// Create development storage directory
const storageDir = join(process.cwd(), 'dev-storage');
if (!existsSync(storageDir)) {
    mkdirSync(storageDir, { recursive: true });
    console.log('✅ Created development storage directory');
}

// Create subdirectories for file organization
const subdirs = ['images', 'videos', 'audio', 'documents', 'temp'];
for (const subdir of subdirs) {
    const path = join(storageDir, subdir);
    if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
    }
}
console.log('✅ Created file organization directories');

// Create development R2 mock service
const r2MockService = `// Development R2 Mock Service
// This provides a local file system mock for R2 during development

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';

export class DevR2Mock {
    constructor(options = {}) {
        this.storageDir = options.storageDir || './dev-storage';
        this.baseUrl = options.baseUrl || 'http://localhost:5173/dev-files';
        
        // Ensure storage directory exists
        if (!existsSync(this.storageDir)) {
            mkdirSync(this.storageDir, { recursive: true });
        }
    }
    
    async put(key, value, options = {}) {
        try {
            const filePath = join(this.storageDir, key);
            const dir = dirname(filePath);
            
            // Ensure directory exists
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            
            // Handle different value types
            let data;
            if (value instanceof ArrayBuffer) {
                data = Buffer.from(value);
            } else if (value instanceof Uint8Array) {
                data = Buffer.from(value);
            } else if (typeof value === 'string') {
                data = Buffer.from(value);
            } else {
                data = Buffer.from(JSON.stringify(value));
            }
            
            writeFileSync(filePath, data);
            
            console.log(\`[DevR2] Stored file: \${key} (\${data.length} bytes)\`);
            
            return {
                success: true,
                key,
                size: data.length,
                etag: randomUUID(),
                httpMetadata: options.httpMetadata || {}
            };
        } catch (error) {
            console.error(\`[DevR2] Error storing file \${key}:\`, error);
            throw error;
        }
    }
    
    async get(key) {
        try {
            const filePath = join(this.storageDir, key);
            
            if (!existsSync(filePath)) {
                return null;
            }
            
            const data = readFileSync(filePath);
            
            return {
                body: data,
                arrayBuffer: () => Promise.resolve(data.buffer),
                text: () => Promise.resolve(data.toString()),
                json: () => Promise.resolve(JSON.parse(data.toString())),
                blob: () => Promise.resolve(new Blob([data]))
            };
        } catch (error) {
            console.error(\`[DevR2] Error reading file \${key}:\`, error);
            return null;
        }
    }
    
    async delete(key) {
        try {
            const filePath = join(this.storageDir, key);
            
            if (existsSync(filePath)) {
                unlinkSync(filePath);
                console.log(\`[DevR2] Deleted file: \${key}\`);
                return { success: true };
            }
            
            return { success: false, error: 'File not found' };
        } catch (error) {
            console.error(\`[DevR2] Error deleting file \${key}:\`, error);
            throw error;
        }
    }
    
    async list(options = {}) {
        try {
            // This is a simplified implementation
            // In a real scenario, you'd recursively scan the directory
            return {
                objects: [],
                truncated: false
            };
        } catch (error) {
            console.error('[DevR2] Error listing files:', error);
            throw error;
        }
    }
    
    // Generate public URL for development
    getPublicUrl(key) {
        return \`\${this.baseUrl}/\${key}\`;
    }
}

export function createDevR2Binding(options = {}) {
    return new DevR2Mock(options);
}
`;

writeFileSync('./src/lib/storage/dev-r2-mock.ts', r2MockService);
console.log('✅ Created development R2 mock service');

// Create development environment configuration
const devEnvConfig = `# Development Environment - R2 Configuration
# Add these to your .env.local file for development

# R2 Development Mode
R2_DEV_MODE=true
R2_DEV_STORAGE_DIR=./dev-storage
R2_DEV_BASE_URL=http://localhost:5173/dev-files

# Development R2 Mock Settings
DEV_R2_BUCKET=dev-qwik-files
DEV_R2_ENDPOINT=http://localhost:8787
DEV_R2_ACCESS_KEY_ID=dev-access-key
DEV_R2_SECRET_ACCESS_KEY=dev-secret-key
`;

writeFileSync('./.env.development', devEnvConfig);
console.log('✅ Created development environment configuration');

// Update the R2 client to use mock in development
const updatedR2Client = `import { DevR2Mock } from './dev-r2-mock';

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
    console.log('🔧 Using R2 development mock');
} else {
    // Use real R2 binding (production/preview)
    r2Instance = globalThis.R2;
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
            url: useR2Mock ? R2.getPublicUrl(key) : \`https://files.yourdomain.com/\${key}\`,
            size: result.size,
            etag: result.etag
        };
    } catch (error) {
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
        console.error('R2 delete error:', error);
        throw error;
    }
}

export function getPublicUrl(key) {
    if (useR2Mock && R2.getPublicUrl) {
        return R2.getPublicUrl(key);
    }
    
    // Production URL
    return \`https://files.yourdomain.com/\${key}\`;
}
`;

writeFileSync('./src/lib/storage/r2-client-updated.ts', updatedR2Client);
console.log('✅ Created updated R2 client with development support');

// Create development file server middleware
const devFileServer = `// Development file server for R2 mock
// Add this to your vite.config.ts middleware

import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { lookup } from 'mime-types';

export function devFileServerMiddleware(storageDir = './dev-storage') {
    return {
        name: 'dev-file-server',
        configureServer(server) {
            server.middlewares.use('/dev-files', (req, res, next) => {
                try {
                    const filePath = join(process.cwd(), storageDir, req.url);
                    
                    if (!existsSync(filePath)) {
                        res.statusCode = 404;
                        res.end('File not found');
                        return;
                    }
                    
                    const stat = statSync(filePath);
                    if (!stat.isFile()) {
                        res.statusCode = 404;
                        res.end('Not a file');
                        return;
                    }
                    
                    const mimeType = lookup(filePath) || 'application/octet-stream';
                    const data = readFileSync(filePath);
                    
                    res.setHeader('Content-Type', mimeType);
                    res.setHeader('Content-Length', data.length);
                    res.setHeader('Cache-Control', 'public, max-age=31536000');
                    
                    res.end(data);
                } catch (error) {
                    console.error('Dev file server error:', error);
                    res.statusCode = 500;
                    res.end('Internal server error');
                }
            });
        }
    };
}
`;

writeFileSync('./src/lib/storage/dev-file-server.ts', devFileServer);
console.log('✅ Created development file server middleware');

// Create installation instructions
const instructions = `# R2 Development Setup - Installation Instructions

## ✅ Files Created:
- \`src/lib/storage/dev-r2-mock.ts\` - Development R2 mock service
- \`src/lib/storage/r2-client-updated.ts\` - Updated R2 client with dev support
- \`src/lib/storage/dev-file-server.ts\` - Development file server middleware
- \`.env.development\` - Development environment configuration
- \`dev-storage/\` - Local file storage directory

## 🔧 Next Steps:

1. **Update your R2 client import:**
   Replace the import in \`src/lib/storage/storage-router.ts\`:
   \`\`\`typescript
   // OLD
   import { R2 } from './r2-client';
   
   // NEW
   import { R2, uploadToR2, getFromR2, deleteFromR2, getPublicUrl } from './r2-client-updated';
   \`\`\`

2. **Add development file server to vite.config.ts:**
   \`\`\`typescript
   import { devFileServerMiddleware } from './src/lib/storage/dev-file-server';
   
   export default defineConfig({
     plugins: [
       // ... your existing plugins
       devFileServerMiddleware('./dev-storage')
     ]
   });
   \`\`\`

3. **Copy environment variables:**
   Copy contents of \`.env.development\` to your \`.env\` file

4. **Test file upload:**
   Try uploading a file through the development server - it should work now!

## 🎯 How It Works:

- **Development**: Files stored in \`./dev-storage/\` directory
- **Production**: Real Cloudflare R2 storage
- **Auto-detection**: Automatically chooses the right storage based on environment
- **File serving**: Development files served at \`http://localhost:5173/dev-files/\`

## 🧪 Testing:

Run your development server and try uploading files through your application. They should now work locally!
`;

writeFileSync('./R2_DEVELOPMENT_SETUP_INSTRUCTIONS.md', instructions);
console.log('✅ Created installation instructions');

console.log('\n============================================================');
console.log('🎉 R2 DEVELOPMENT SETUP COMPLETE!');
console.log('============================================================');
console.log('');
console.log('📋 NEXT STEPS:');
console.log('1. Follow instructions in: R2_DEVELOPMENT_SETUP_INSTRUCTIONS.md');
console.log('2. Update your imports and vite config');
console.log('3. Test file uploads in development');
console.log('');
console.log('⚡ This will enable file uploads to work in development mode!');