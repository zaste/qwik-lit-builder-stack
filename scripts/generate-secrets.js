#!/usr/bin/env node

/**
 * 🔐 Secret Generator for Qwik LIT Builder Stack
 * Generates cryptographically secure secrets for production use
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

console.log('🔐 GENERATING PRODUCTION SECRETS...\n');

// Validate Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 16) {
  console.error('❌ Node.js 16+ is required for crypto.randomBytes');
  process.exit(1);
}

try {
  const secrets = {
    'JWT_SECRET': crypto.randomBytes(64).toString('hex'),
    'SESSION_SECRET': crypto.randomBytes(64).toString('hex'),
    'ENCRYPTION_KEY': crypto.randomBytes(32).toString('hex'),
    'API_RATE_LIMIT_SECRET': crypto.randomBytes(32).toString('hex'),
    'WEBHOOK_SECRET': crypto.randomBytes(32).toString('hex')
  };

  // Validate generated secrets
  Object.entries(secrets).forEach(([key, value]) => {
    if (!value || value.length < 32) {
      console.error(`❌ Failed to generate secure ${key}`);
      process.exit(1);
    }
  });

  // Create secrets file for automation
  const secretsContent = Object.entries(secrets)
    .map(([key, value]) => `export ${key}="${value}"`)
    .join('\n');

  const secretsFile = path.join(process.cwd(), '.secrets-generated.env');
  fs.writeFileSync(secretsFile, secretsContent + '\n');

  // Add to .gitignore if not already there
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.secrets-generated.env')) {
      fs.appendFileSync(gitignorePath, '\n# Generated secrets\n.secrets-generated.env\n');
      console.log('✅ Added .secrets-generated.env to .gitignore');
    }
  }

  console.log('✅ Secrets generated successfully!');
  console.log(`📁 Saved to: ${secretsFile}`);
  console.log('⚠️  SECURITY: Never commit this file to version control\n');

  // Output for manual copying
  console.log('=== COPY TO GITHUB SECRETS ===');
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  console.log('===============================\n');

  console.log('🎯 Next steps (HYBRID APPROACH):');
  console.log('1. GitHub Secrets (CI/CD): Copy crypto secrets above to GitHub Repository Settings');
  console.log('2. Run: npm run cloudflare:setup');
  console.log('3. Run: npm run secrets:upload-github (CI/CD secrets)');
  console.log('4. Run: npm run secrets:upload-cloudflare (Runtime secrets)');

} catch (error) {
  console.error('❌ Error generating secrets:', error.message);
  process.exit(1);
}