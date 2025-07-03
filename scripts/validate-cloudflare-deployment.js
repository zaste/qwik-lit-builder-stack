#!/usr/bin/env node
/**
 * Script to validate Cloudflare Pages deployment locally
 * Tests the _worker.js file and deployment structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function validateDeployment() {
  console.log('🔍 Validating Cloudflare Pages deployment...');
  
  const distDir = path.join(projectRoot, 'dist');
  const issues = [];
  const warnings = [];
  
  // 1. Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    issues.push('❌ dist/ directory not found - run npm run build:cloudflare first');
    return { issues, warnings };
  }
  
  // 2. Validate required files
  const requiredFiles = [
    '_worker.js',
    'q-manifest.json',
    '@qwik-city-plan.js',
    '@qwik-city-not-found-paths.js',
    '@qwik-city-static-paths.js'
  ];
  
  console.log('\n📋 Checking required files:');
  requiredFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`  ✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
      issues.push(`❌ Missing required file: ${file}`);
    }
  });
  
  // 3. Check _worker.js content
  const workerPath = path.join(distDir, '_worker.js');
  if (fs.existsSync(workerPath)) {
    const workerContent = fs.readFileSync(workerPath, 'utf-8');
    
    console.log('\n🔧 Analyzing _worker.js:');
    
    // Check for export default
    if (workerContent.includes('export{') && workerContent.includes('as default')) {
      console.log('  ✅ Has default export');
    } else {
      issues.push('❌ _worker.js missing default export');
    }
    
    // Check for required Qwik imports (minified or not)
    const requiredImports = [
      { name: '@qwik-city-plan', alternatives: ['@qwik-city-plan', 'qwikCityPlan', 'q-B4I0aRsR'] },
      { name: '@qwik-city-not-found-paths', alternatives: ['@qwik-city-not-found-paths', 'getNotFound'] },
      { name: '@qwik-city-static-paths', alternatives: ['@qwik-city-static-paths', 'isStaticPath'] }
    ];
    
    requiredImports.forEach(({ name, alternatives }) => {
      const found = alternatives.some(alt => workerContent.includes(alt));
      if (found) {
        console.log(`  ✅ Imports ${name}`);
      } else {
        issues.push(`❌ _worker.js missing import: ${name}`);
      }
    });
    
    // Check for problematic imports
    if (workerContent.includes('node:async_hooks')) {
      warnings.push('⚠️  _worker.js contains node:async_hooks import - ensure nodejs_compat is enabled');
    }
    
    if (workerContent.includes('@supabase/supabase-js')) {
      console.log('  ✅ Includes Supabase client');
    }
    
    // Check file size
    const sizeKB = Math.round(fs.statSync(workerPath).size / 1024);
    if (sizeKB > 1000) {
      warnings.push(`⚠️  _worker.js is quite large (${sizeKB}KB) - consider code splitting`);
    } else {
      console.log(`  ✅ Reasonable size (${sizeKB}KB)`);
    }
  }
  
  // 4. Check static assets
  console.log('\n📁 Checking static assets:');
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    console.log(`  ✅ Found ${assets.length} asset(s)`);
    assets.forEach(asset => {
      if (asset.endsWith('.css')) {
        console.log(`    📄 ${asset}`);
      }
    });
  } else {
    warnings.push('⚠️  No assets directory found');
  }
  
  // 5. Check build directory
  const buildDir = path.join(distDir, 'build');
  if (fs.existsSync(buildDir)) {
    const buildFiles = fs.readdirSync(buildDir);
    const jsFiles = buildFiles.filter(f => f.endsWith('.js'));
    console.log(`  ✅ Build directory has ${jsFiles.length} JS chunks`);
  } else {
    issues.push('❌ Missing build/ directory with client chunks');
  }
  
  // 6. Check wrangler.toml compatibility
  const wranglerPath = path.join(projectRoot, 'wrangler.toml');
  if (fs.existsSync(wranglerPath)) {
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
    console.log('\n⚙️  Checking wrangler.toml:');
    
    if (wranglerContent.includes('nodejs_compat')) {
      console.log('  ✅ nodejs_compat flag enabled');
    } else {
      issues.push('❌ nodejs_compat flag missing in wrangler.toml');
    }
    
    if (wranglerContent.includes('pages_build_output_dir')) {
      console.log('  ✅ pages_build_output_dir configured');
    } else {
      warnings.push('⚠️  pages_build_output_dir not explicitly set');
    }
  }
  
  return { issues, warnings };
}

async function main() {
  try {
    const { issues, warnings } = await validateDeployment();
    
    console.log('\n📊 Validation Summary:');
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    if (issues.length > 0) {
      console.log('\n❌ Issues found:');
      issues.forEach(issue => console.log(`  ${issue}`));
      console.log('\n🔧 Fix these issues before deploying to Cloudflare Pages');
      process.exit(1);
    } else {
      console.log('\n🎉 Deployment validation passed!');
      console.log('\n🚀 Ready to deploy:');
      console.log('  1. wrangler pages deploy dist');
      console.log('  2. Or push to GitHub and connect to Cloudflare Pages');
      console.log('\n💡 Test locally with: wrangler pages dev dist');
    }
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

main();