/**
 * Token Compiler - Convert extracted Spectrum tokens to multiple formats
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ExtractedToken {
  name: string;
  value: string | number;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'other';
  category: string;
  description?: string;
  path: string;
}

interface CompiledToken extends ExtractedToken {
  cssVar: string;
  jsVar: string;
  scssVar: string;
}

interface CompilationResult {
  css: string;
  scss: string;
  js: string;
  ts: string;
  json: string;
  stats: {
    totalTokens: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

export class TokenCompiler {
  private tokens: CompiledToken[] = [];
  
  constructor(private inputPath: string) {}
  
  /**
   * Load and process extracted tokens
   */
  loadTokens(): void {
    try {
      const data = JSON.parse(readFileSync(this.inputPath, 'utf-8'));
      const extractedTokens: ExtractedToken[] = data.tokens || [];
      
      this.tokens = extractedTokens.map(token => ({
        ...token,
        cssVar: this.generateCSSVar(token),
        jsVar: this.generateJSVar(token),
        scssVar: this.generateSCSSVar(token)
      }));
      
      console.log(`📦 Loaded ${this.tokens.length} tokens for compilation`);
    } catch (error) {
      throw new Error(`Failed to load tokens: ${error.message}`);
    }
  }
  
  /**
   * Compile tokens to all formats
   */
  compileAll(): CompilationResult {
    if (this.tokens.length === 0) {
      throw new Error('No tokens loaded. Call loadTokens() first.');
    }
    
    console.log('🔄 Compiling tokens to all formats...');
    
    const result: CompilationResult = {
      css: this.generateCSS(),
      scss: this.generateSCSS(),
      js: this.generateJS(),
      ts: this.generateTS(),
      json: this.generateJSON(),
      stats: this.generateStats()
    };
    
    console.log('✅ Token compilation complete');
    return result;
  }
  
  /**
   * Generate CSS custom properties
   */
  private generateCSS(): string {
    const header = `/**
 * Design System Tokens - CSS Custom Properties
 * Generated from Spectrum-inspired token extraction
 * Usage: var(--token-name)
 */

:root {`;
    
    const properties = this.tokens
      .map(token => `  ${token.cssVar}: ${token.value};`)
      .join('\n');
    
    const footer = `
}

/* Token Categories */`;
    
    const categories = this.generateCSSCategories();
    
    return `${header}\n${properties}\n${footer}\n${categories}`;
  }
  
  /**
   * Generate SCSS variables
   */
  private generateSCSS(): string {
    const header = `/**
 * Design System Tokens - SCSS Variables
 * Generated from Spectrum-inspired token extraction
 * Usage: $token-name
 */

// Base tokens`;
    
    const variables = this.tokens
      .map(token => `${token.scssVar}: ${token.value};`)
      .join('\n');
    
    return `${header}\n${variables}`;
  }
  
  /**
   * Generate JavaScript object
   */
  private generateJS(): string {
    const header = `/**
 * Design System Tokens - JavaScript Objects
 * Generated from Spectrum-inspired token extraction
 * Usage: tokens.COLOR_BLUE_500
 */

export const tokens = {`;
    
    const properties = this.tokens
      .map(token => `  ${token.jsVar}: '${token.value}',`)
      .join('\n');
    
    const footer = `};

// Token access helpers
export const getToken = (name) => tokens[name];
export const getCSSVar = (name) => \`var(--\${name.toLowerCase().replace(/_/g, '-')})\`;`;
    
    return `${header}\n${properties}\n${footer}`;
  }
  
  /**
   * Generate TypeScript definitions
   */
  private generateTS(): string {
    const header = `/**
 * Design System Tokens - TypeScript Definitions
 * Generated from Spectrum-inspired token extraction
 */

export interface DesignToken {
  name: string;
  value: string | number;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'other';
  category: string;
  cssVar: string;
  jsVar: string;
  description?: string;
}

export const designTokens: DesignToken[] = [`;
    
    const tokenObjects = this.tokens
      .map(token => `  {
    name: '${token.name}',
    value: '${token.value}',
    type: '${token.type}',
    category: '${token.category}',
    cssVar: '${token.cssVar}',
    jsVar: '${token.jsVar}',
    description: '${token.description || ''}'
  }`)
      .join(',\n');
    
    const footer = `
];

// Type-safe token access
export type TokenType = 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'other';
export type TokenName = ${this.tokens.map(t => `'${t.jsVar}'`).join(' | ')};

export const getTypedToken = (name: TokenName): DesignToken | undefined => 
  designTokens.find(token => token.jsVar === name);

export const getTokensByType = (type: TokenType): DesignToken[] =>
  designTokens.filter(token => token.type === type);`;
    
    return `${header}\n${tokenObjects}\n${footer}`;
  }
  
  /**
   * Generate JSON format
   */
  private generateJSON(): string {
    const output = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      source: 'Spectrum-inspired extraction',
      tokens: this.tokens.reduce((acc, token) => {
        acc[token.name] = {
          value: token.value,
          type: token.type,
          category: token.category,
          cssVar: token.cssVar,
          jsVar: token.jsVar,
          description: token.description
        };
        return acc;
      }, {} as Record<string, any>),
      stats: this.generateStats()
    };
    
    return JSON.stringify(output, null, 2);
  }
  
  /**
   * Generate CSS category sections
   */
  private generateCSSCategories(): string {
    const categoriesSet = new Set(this.tokens.map(t => t.category));
    const categories = Array.from(categoriesSet);
    
    return categories.map(category => {
      const categoryTokens = this.tokens.filter(t => t.category === category);
      return `
/* ${category.toUpperCase()} TOKENS */
${categoryTokens.map(token => `/* ${token.cssVar}: ${token.value}; */`).join('\n')}`;
    }).join('\n');
  }
  
  /**
   * Generate CSS variable name
   */
  private generateCSSVar(token: ExtractedToken): string {
    const name = token.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `--${name}`;
  }
  
  /**
   * Generate JavaScript variable name
   */
  private generateJSVar(token: ExtractedToken): string {
    return token.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
  
  /**
   * Generate SCSS variable name
   */
  private generateSCSSVar(token: ExtractedToken): string {
    const name = token.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `$${name}`;
  }
  
  /**
   * Generate compilation statistics
   */
  private generateStats() {
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    this.tokens.forEach(token => {
      byType[token.type] = (byType[token.type] || 0) + 1;
      byCategory[token.category] = (byCategory[token.category] || 0) + 1;
    });
    
    return {
      totalTokens: this.tokens.length,
      byType,
      byCategory
    };
  }
}

/**
 * Write compilation results to files
 */
export function writeCompiledTokens(result: CompilationResult, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  
  const files = [
    { name: 'tokens.css', content: result.css },
    { name: 'tokens.scss', content: result.scss },
    { name: 'tokens.js', content: result.js },
    { name: 'tokens.ts', content: result.ts },
    { name: 'tokens.json', content: result.json }
  ];
  
  files.forEach(file => {
    const filePath = join(outputDir, file.name);
    writeFileSync(filePath, file.content);
    console.log(`📄 Generated: ${filePath}`);
  });
  
  // Write stats file
  const statsPath = join(outputDir, 'compilation-stats.json');
  writeFileSync(statsPath, JSON.stringify(result.stats, null, 2));
  console.log(`📊 Stats: ${statsPath}`);
}

/**
 * Main compilation function
 */
export async function compileTokens(): Promise<void> {
  const inputPath = join(process.cwd(), 'src/design-system/foundation/tokens/spectrum-extracted.json');
  const outputDir = join(process.cwd(), 'src/design-system/foundation/tokens/dist');
  
  try {
    console.log('🔧 Starting token compilation...');
    
    const compiler = new TokenCompiler(inputPath);
    compiler.loadTokens();
    
    const result = compiler.compileAll();
    writeCompiledTokens(result, outputDir);
    
    console.log('\n✅ Token compilation successful!');
    console.log(`📊 Compiled ${result.stats.totalTokens} tokens to 5 formats`);
    console.log(`📁 Output directory: ${outputDir}`);
    
    // Display stats
    console.log('\n📋 Compilation Statistics:');
    console.log('By Type:');
    Object.entries(result.stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} tokens`);
    });
    
    console.log('By Category:');
    Object.entries(result.stats.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} tokens`);
    });
    
  } catch (error) {
    console.error('❌ Token compilation failed:', error.message);
    process.exit(1);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  compileTokens().catch(console.error);
}