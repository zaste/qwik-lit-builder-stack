#!/usr/bin/env node

/**
 * Spectrum Token Extractor CLI
 * Extract design tokens from Adobe Spectrum repositories
 */

import { extractSpectrumTokens } from './extract-tokens.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🎨 Spectrum Token Extractor');
  console.log('==========================');

  try {
    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      console.log('ℹ️ No GITHUB_TOKEN found. Using public API (rate limited).');
    }

    // Extract tokens
    const result = await extractSpectrumTokens(githubToken);
    
    // Create output directory
    const outputDir = join(process.cwd(), 'src', 'design-system', 'foundation', 'tokens');
    mkdirSync(outputDir, { recursive: true });
    
    // Write extracted tokens
    const outputPath = join(outputDir, 'spectrum-extracted.json');
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    // Write TypeScript types
    const typesPath = join(outputDir, 'spectrum-tokens.ts');
    const tsContent = generateTypeScriptTokens(result);
    writeFileSync(typesPath, tsContent);
    
    // Print summary
    console.log('\n✅ Token extraction complete!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📁 Types: ${typesPath}`);
    console.log('\n📊 Extraction Summary:');
    console.log(`   • Total tokens: ${result.stats.totalTokens}`);
    console.log(`   • Color tokens: ${result.stats.colorTokens}`);
    console.log(`   • Dimension tokens: ${result.stats.dimensionTokens}`);
    console.log(`   • Font tokens: ${result.stats.fontTokens}`);
    console.log(`   • Other tokens: ${result.stats.otherTokens}`);
    console.log(`   • Sources: ${result.sources.length}`);
    
    console.log('\n🚀 Ready to integrate with your design system!');
    
  } catch (error) {
    console.error('❌ Token extraction failed:', error.message);
    process.exit(1);
  }
}

function generateTypeScriptTokens(result: any): string {
  return `/**
 * Extracted Spectrum Design Tokens
 * Generated on: ${result.extractedAt}
 * Sources: ${result.sources.length} repositories
 */

export interface SpectrumToken {
  name: string;
  value: string | number;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'other';
  category: string;
  description?: string;
  path: string;
}

export const spectrumTokens: SpectrumToken[] = ${JSON.stringify(result.tokens, null, 2)};

// Token utilities
export const getTokensByType = (type: SpectrumToken['type']) => 
  spectrumTokens.filter(token => token.type === type);

export const getTokensByCategory = (category: string) => 
  spectrumTokens.filter(token => token.category.includes(category));

export const getTokenValue = (name: string) => 
  spectrumTokens.find(token => token.name === name)?.value;

// Color tokens
export const colorTokens = getTokensByType('color');

// Dimension tokens  
export const dimensionTokens = getTokensByType('dimension');

// Font tokens
export const fontTokens = spectrumTokens.filter(token => 
  token.type === 'fontFamily' || token.type === 'fontWeight'
);

// Statistics
export const tokenStats = ${JSON.stringify(result.stats, null, 2)};
`;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runExtractor };