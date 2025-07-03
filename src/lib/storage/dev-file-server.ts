// Development file server for R2 mock
// Add this to your vite.config.ts middleware

import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { lookup } from 'mime-types';

export function devFileServerMiddleware(storageDir = './dev-storage') {
    return {
        name: 'dev-file-server',
        configureServer(server: any) {
            server.middlewares.use('/dev-files', (req: any, res: any, _next: any) => {
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
                    // eslint-disable-next-line no-console
                    console.error('Dev file server error:', error);
                    res.statusCode = 500;
                    res.end('Internal server error');
                }
            });
        }
    };
}
