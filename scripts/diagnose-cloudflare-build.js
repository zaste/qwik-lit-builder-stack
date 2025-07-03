#!/usr/bin/env node
/**
 * Diagnose Cloudflare Pages build configuration issues
 */

import fs from 'fs';
import path from 'path';

function diagnoseCloudflarePages() {
  console.log('🔍 CLOUDFLARE PAGES BUILD DIAGNOSIS\n');
  
  // 1. Check wrangler.toml configuration
  console.log('1. Checking wrangler.toml configuration...');
  const wranglerPath = 'wrangler.toml';
  if (fs.existsSync(wranglerPath)) {
    const config = fs.readFileSync(wranglerPath, 'utf8');
    console.log('✅ wrangler.toml exists');
    console.log('   Build output dir:', config.match(/pages_build_output_dir\s*=\s*"([^"]+)"/)?.[1] || 'not found');
    console.log('   Compatibility date:', config.match(/compatibility_date\s*=\s*"([^"]+)"/)?.[1] || 'not found');
  } else {
    console.log('❌ wrangler.toml not found');
  }
  
  // 2. Check package.json build scripts
  console.log('\n2. Checking package.json build scripts...');
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('✅ package.json exists');
    console.log('   build script:', pkg.scripts?.build || 'not found');
    console.log('   build:cloudflare script:', pkg.scripts?.['build:cloudflare'] || 'not found');
  }
  
  // 3. Check dist directory structure
  console.log('\n3. Checking dist directory structure...');
  const distPath = 'dist';
  if (fs.existsSync(distPath)) {
    console.log('✅ dist directory exists');
    const distFiles = fs.readdirSync(distPath);
    console.log('   Files in dist:');
    distFiles.forEach(file => {
      const stat = fs.statSync(path.join(distPath, file));
      console.log(`   ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
    });
    
    // Check critical files
    const criticalFiles = ['_worker.js', '_routes.json', 'q-manifest.json'];
    criticalFiles.forEach(file => {
      if (fs.existsSync(path.join(distPath, file))) {
        const size = fs.statSync(path.join(distPath, file)).size;
        console.log(`   ✅ ${file} (${size} bytes)`);
      } else {
        console.log(`   ❌ ${file} missing`);
      }
    });
  } else {
    console.log('❌ dist directory not found');
  }
  
  // 4. Check deploy directory structure
  console.log('\n4. Checking deploy directory structure...');
  const deployPath = 'deploy';
  if (fs.existsSync(deployPath)) {
    console.log('✅ deploy directory exists');
    const deployFiles = fs.readdirSync(deployPath);
    console.log('   Files in deploy:');
    deployFiles.slice(0, 10).forEach(file => {
      const stat = fs.statSync(path.join(deployPath, file));
      console.log(`   ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
    });
    if (deployFiles.length > 10) {
      console.log(`   ... and ${deployFiles.length - 10} more files`);
    }
  } else {
    console.log('❌ deploy directory not found');
  }
  
  // 5. Check _routes.json content
  console.log('\n5. Checking _routes.json configuration...');
  const routesFiles = ['dist/_routes.json', 'deploy/_routes.json'];
  routesFiles.forEach(routesPath => {
    if (fs.existsSync(routesPath)) {
      try {
        const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
        console.log(`✅ ${routesPath}:`);
        console.log('   Version:', routes.version);
        console.log('   Include:', routes.include);
        console.log('   Exclude:', routes.exclude?.slice(0, 3), routes.exclude?.length > 3 ? '...' : '');
      } catch (err) {
        console.log(`❌ ${routesPath} invalid JSON:`, err.message);
      }
    }
  });
  
  // 6. Check _worker.js content
  console.log('\n6. Checking _worker.js content...');
  const workerFiles = ['dist/_worker.js', 'deploy/_worker.js'];
  workerFiles.forEach(workerPath => {
    if (fs.existsSync(workerPath)) {
      const content = fs.readFileSync(workerPath, 'utf8');
      console.log(`✅ ${workerPath}:`);
      console.log('   Size:', content.length, 'characters');
      console.log('   First line:', content.split('\n')[0]);
      if (content.includes('export default')) {
        console.log('   ✅ Contains export default');
      } else {
        console.log('   ❌ Missing export default');
      }
    }
  });
  
  // 7. Recommendations
  console.log('\n7. RECOMMENDATIONS:');
  
  if (!fs.existsSync('dist/_worker.js')) {
    console.log('❌ CRITICAL: dist/_worker.js missing - run npm run build:cloudflare');
  }
  
  if (!fs.existsSync('dist/_routes.json')) {
    console.log('❌ CRITICAL: dist/_routes.json missing - Cloudflare Pages routing will fail');
  }
  
  console.log('\n📋 CLOUDFLARE PAGES SETUP CHECKLIST:');
  console.log('1. Build command should be: npm run build:cloudflare');
  console.log('2. Output directory should be: dist');
  console.log('3. Node.js version should be: 18 or 20');
  console.log('4. Environment variables should be set in CF Pages dashboard');
  console.log('5. Branch for deployment should be: main');
  
  console.log('\n🔧 If Cloudflare Pages is not updating:');
  console.log('1. Check CF Pages dashboard for failed builds');
  console.log('2. Verify the build command is npm run build:cloudflare');
  console.log('3. Check that wrangler.toml points to the correct output dir');
  console.log('4. Ensure all environment variables are set in CF dashboard');
  console.log('5. Try triggering a manual rebuild in CF Pages');
}

diagnoseCloudflarePages();