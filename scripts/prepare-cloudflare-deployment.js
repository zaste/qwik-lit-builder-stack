#!/usr/bin/env node
/**
 * Script to prepare proper Cloudflare Pages deployment structure
 * 
 * Cloudflare Pages expects:
 * 1. Static assets in the root of dist/
 * 2. _worker.js as the edge function entry point
 * 3. All server-side dependencies bundled properly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function prepareCloudflareDeployment() {
  console.log('📦 Preparing Cloudflare Pages deployment structure...');
  
  const serverDir = path.join(projectRoot, 'server');
  const distDir = path.join(projectRoot, 'dist');
  
  // 1. Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // 2. Create the proper _worker.js entry point
  const workerEntry = path.join(serverDir, 'entry.cloudflare-pages.js');
  const workerDest = path.join(distDir, '_worker.js');
  
  if (fs.existsSync(workerEntry)) {
    console.log('✅ Creating _worker.js entry point...');
    
    // Create proper Cloudflare Pages worker entry
    const workerContent = `export default {
  async fetch(request, env, ctx) {
    return (await import("./entry.cloudflare-pages.js")).default(request, env, ctx);
  }
};`;
    
    fs.writeFileSync(workerDest, workerContent);
    
    // Also copy the actual entry file
    const entryDest = path.join(distDir, 'entry.cloudflare-pages.js');
    fs.copyFileSync(workerEntry, entryDest);
  } else {
    console.error('❌ Server entry point not found:', workerEntry);
    process.exit(1);
  }
  
  // 3. Copy necessary server chunks
  const serverChunks = [
    '@qwik-city-plan.js',
    '@qwik-city-not-found-paths.js', 
    '@qwik-city-static-paths.js'
  ];
  
  // Find all q-*.js files (Qwik chunks)
  const serverFiles = fs.readdirSync(serverDir);
  const qwikChunks = serverFiles.filter(file => file.startsWith('q-') && file.endsWith('.js'));
  
  const allServerFiles = [...serverChunks, ...qwikChunks];
  
  console.log('📁 Copying server chunks to dist root...');
  allServerFiles.forEach(file => {
    const src = path.join(serverDir, file);
    const dest = path.join(distDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${file}`);
    }
  });
  
  // 4. Create _headers file for proper MIME types
  const headersContent = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/build/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/assets/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.json
  Content-Type: application/json; charset=utf-8

/_worker.js
  Content-Type: application/javascript; charset=utf-8
`;
  
  fs.writeFileSync(path.join(distDir, '_headers'), headersContent);
  console.log('✅ Created _headers file');
  
  // 5. Create _routes.json for proper Cloudflare Pages routing
  const routesContent = {
    "version": 1,
    "include": [
      "/*"
    ],
    "exclude": [
      "/build/*",
      "/assets/*",
      "/*.js",
      "/*.css",
      "/*.svg",
      "/*.png",
      "/*.jpg",
      "/*.webp",
      "/*.json",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml"
    ]
  };
  
  fs.writeFileSync(path.join(distDir, '_routes.json'), JSON.stringify(routesContent, null, 2));
  console.log('✅ Created _routes.json file');
  
  // 6. Copy server assets if they exist
  const serverAssetsDir = path.join(serverDir, 'assets');
  const distAssetsDir = path.join(distDir, 'assets');
  
  if (fs.existsSync(serverAssetsDir)) {
    if (!fs.existsSync(distAssetsDir)) {
      fs.mkdirSync(distAssetsDir, { recursive: true });
    }
    
    const serverAssets = fs.readdirSync(serverAssetsDir);
    serverAssets.forEach(asset => {
      const src = path.join(serverAssetsDir, asset);
      const dest = path.join(distAssetsDir, asset);
      fs.copyFileSync(src, dest);
      console.log(`  ✓ assets/${asset}`);
    });
  }
  
  // 7. Verify deployment structure
  console.log('\n📋 Verifying deployment structure...');
  const requiredFiles = ['_worker.js', 'q-manifest.json', '_routes.json'];
  
  let valid = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(distDir, file))) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ Missing: ${file}`);
      valid = false;
    }
  });
  
  if (valid) {
    console.log('\n🎉 Cloudflare Pages deployment structure ready!');
    console.log('\nNext steps:');
    console.log('1. wrangler pages deploy dist');
    console.log('2. Or connect your GitHub repo to Cloudflare Pages dashboard');
  } else {
    console.error('\n❌ Deployment structure is incomplete');
    process.exit(1);
  }
}

prepareCloudflareDeployment().catch(console.error);