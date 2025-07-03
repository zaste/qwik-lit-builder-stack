// Development R2 Mock Service
// This provides a local file system mock for R2 during development

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { logger } from '../logger';

export class DevR2Mock {
    private storageDir: string;
    private baseUrl: string;
    
    constructor(_options: { storageDir?: string; baseUrl?: string } = {}) {
        this.storageDir = _options.storageDir || './dev-storage';
        this.baseUrl = _options.baseUrl || 'http://localhost:5173/dev-files';
        
        // Ensure storage directory exists
        if (!existsSync(this.storageDir)) {
            mkdirSync(this.storageDir, { recursive: true });
        }
    }
    
    async put(key: string, value: any, options: { httpMetadata?: any } = {}) {
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
            
            logger.info('DevR2: File stored', { key, size: data.length });
            
            return {
                success: true,
                key,
                size: data.length,
                etag: randomUUID(),
                httpMetadata: options.httpMetadata || {}
            };
        } catch (error) {
            logger.error('DevR2: Error storing file', { key, error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    
    async get(key: string) {
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
            logger.error('DevR2: Error reading file', { key, error: error instanceof Error ? error.message : String(error) });
            return null;
        }
    }
    
    async delete(key: string) {
        try {
            const filePath = join(this.storageDir, key);
            
            if (existsSync(filePath)) {
                unlinkSync(filePath);
                logger.info('DevR2: File deleted', { key });
                return { success: true };
            }
            
            return { success: false, error: 'File not found' };
        } catch (error) {
            logger.error('DevR2: Error deleting file', { key, error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    
    async list(_options = {}) {
        try {
            // This is a simplified implementation
            // In a real scenario, you'd recursively scan the directory
            return {
                objects: [],
                truncated: false
            };
        } catch (error) {
            logger.error('DevR2: Error listing files', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    
    // Generate public URL for development
    getPublicUrl(key: string) {
        return `${this.baseUrl}/${key}`;
    }
    
    // File upload methods for compatibility with smart router
    async uploadFile(file: File, path: string) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await this.put(path, arrayBuffer, {
                httpMetadata: {
                    contentType: file.type || 'application/octet-stream'
                }
            });
            
            return {
                success: true,
                url: this.getPublicUrl(path),
                path,
                size: file.size,
                etag: result.etag
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    
    async uploadBuffer(buffer: Buffer, path: string, contentType: string) {
        try {
            const result = await this.put(path, buffer, {
                httpMetadata: {
                    contentType: contentType || 'application/octet-stream'
                }
            });
            
            return {
                success: true,
                url: this.getPublicUrl(path),
                path,
                size: buffer.length,
                etag: result.etag
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

export function createDevR2Binding(options: { storageDir?: string; baseUrl?: string } = {}) {
    return new DevR2Mock(options);
}
