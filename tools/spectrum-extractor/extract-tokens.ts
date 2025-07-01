/**
 * Extract Design Tokens from Adobe Spectrum Repositories
 */

import { createGitHubClient, type GitHubClient } from './github-client.js';

export interface SpectrumToken {
  name: string;
  value: string | number;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'other';
  category: string;
  description?: string;
  path: string;
}

export interface TokenExtractionResult {
  tokens: SpectrumToken[];
  sources: string[];
  extractedAt: string;
  stats: {
    totalTokens: number;
    colorTokens: number;
    dimensionTokens: number;
    fontTokens: number;
    otherTokens: number;
  };
}

export class SpectrumTokenExtractor {
  private client: GitHubClient;
  
  constructor(githubToken?: string) {
    this.client = createGitHubClient(githubToken);
  }

  /**
   * Extract tokens from Adobe Spectrum repositories
   */
  async extractTokens(): Promise<TokenExtractionResult> {
    const tokens: SpectrumToken[] = [];
    const sources: string[] = [];

    console.log('🔍 Extracting tokens from Adobe Spectrum repositories...');

    try {
      // Extract from main spectrum-tokens repository
      const spectrumTokens = await this.extractFromRepository('adobe', 'spectrum-tokens');
      tokens.push(...spectrumTokens.tokens);
      sources.push(...spectrumTokens.sources);

      // Extract from spectrum-css repository  
      const spectrumCSS = await this.extractFromRepository('adobe', 'spectrum-css');
      tokens.push(...spectrumCSS.tokens);
      sources.push(...spectrumCSS.sources);

    } catch (error) {
      console.warn('⚠️ GitHub API access limited. Using fallback token extraction.');
      // Fallback to hardcoded essential tokens
      tokens.push(...this.getFallbackTokens());
      sources.push('fallback-essential-tokens');
    }

    // If we only got file paths and not actual tokens, use fallback
    const actualTokens = tokens.filter(token => 
      token.type === 'color' || 
      token.type === 'dimension' || 
      token.type === 'fontFamily' || 
      token.type === 'fontWeight'
    );

    if (actualTokens.length < 5) {
      console.warn('⚠️ Low quality token extraction detected. Adding fallback tokens.');
      tokens.push(...this.getFallbackTokens());
      sources.push('fallback-essential-tokens');
    }

    const stats = this.calculateStats(tokens);
    
    return {
      tokens,
      sources,
      extractedAt: new Date().toISOString(),
      stats
    };
  }

  /**
   * Extract tokens from specific repository
   */
  private async extractFromRepository(owner: string, repo: string): Promise<{ tokens: SpectrumToken[], sources: string[] }> {
    const tokens: SpectrumToken[] = [];
    const sources: string[] = [];

    try {
      console.log(`📡 Analyzing ${owner}/${repo}...`);
      
      // Look for token files in common locations
      const tokenPaths = [
        'packages/tokens',
        'tokens',
        'src/tokens',
        'packages',
        'src'
      ];

      for (const path of tokenPaths) {
        try {
          const contents = await this.client.getDirectoryContents(owner, repo, path);
          const tokenFiles = contents.filter(item => 
            item.type === 'file' && 
            (item.name.includes('token') || 
             item.name.includes('color') || 
             item.name.includes('dimension') ||
             item.name.endsWith('.json') ||
             item.name.endsWith('.js') ||
             item.name.endsWith('.css'))
          );

          for (const file of tokenFiles.slice(0, 5)) { // Limit to first 5 files
            try {
              const content = await this.client.getFileContent(owner, repo, file.path);
              const extracted = this.parseTokenFile(content, file.path);
              tokens.push(...extracted);
              sources.push(`${owner}/${repo}/${file.path}`);
            } catch (error) {
              console.warn(`⚠️ Could not extract from ${file.path}:`, error.message);
            }
          }
        } catch (error) {
          // Path doesn't exist, continue
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not access ${owner}/${repo}:`, error.message);
    }

    return { tokens, sources };
  }

  /**
   * Parse token file content
   */
  private parseTokenFile(content: string, path: string): SpectrumToken[] {
    const tokens: SpectrumToken[] = [];
    
    try {
      // Try JSON first
      if (path.endsWith('.json')) {
        const data = JSON.parse(content);
        tokens.push(...this.extractFromJSON(data, path));
      }
      
      // Try CSS custom properties
      else if (path.endsWith('.css')) {
        tokens.push(...this.extractFromCSS(content, path));
      }
      
      // Try JavaScript/TypeScript
      else if (path.endsWith('.js') || path.endsWith('.ts')) {
        tokens.push(...this.extractFromJS(content, path));
      }
    } catch (error) {
      console.warn(`⚠️ Could not parse ${path}:`, error.message);
    }

    return tokens;
  }

  /**
   * Extract tokens from JSON data
   */
  private extractFromJSON(data: any, path: string): SpectrumToken[] {
    const tokens: SpectrumToken[] = [];
    
    const extractRecursive = (obj: any, category: string = 'root') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const tokenValue = (value as any).value;
          if (tokenValue !== undefined) {
            // Design token format
            tokens.push({
              name: key,
              value: tokenValue,
              type: this.inferTokenType(key, tokenValue),
              category,
              description: (value as any).description || (value as any).comment,
              path
            });
          } else {
            // Nested category
            extractRecursive(value, `${category}.${key}`);
          }
        } else if (typeof value === 'string' || typeof value === 'number') {
          tokens.push({
            name: key,
            value,
            type: this.inferTokenType(key, value),
            category,
            path
          });
        }
      }
    };

    extractRecursive(data);
    return tokens;
  }

  /**
   * Extract tokens from CSS
   */
  private extractFromCSS(content: string, path: string): SpectrumToken[] {
    const tokens: SpectrumToken[] = [];
    
    // Match CSS custom properties
    const customPropRegex = /--([a-zA-Z0-9-_]+):\s*([^;]+);/g;
    let match;
    
    while ((match = customPropRegex.exec(content)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      
      tokens.push({
        name,
        value,
        type: this.inferTokenType(name, value),
        category: 'css-custom-properties',
        path
      });
    }

    return tokens;
  }

  /**
   * Extract tokens from JavaScript/TypeScript
   */
  private extractFromJS(content: string, path: string): SpectrumToken[] {
    const tokens: SpectrumToken[] = [];
    
    // Simple extraction for common patterns
    const constRegex = /const\s+([A-Z_][A-Z0-9_]*)\s*=\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = constRegex.exec(content)) !== null) {
      const name = match[1];
      const value = match[2];
      
      tokens.push({
        name,
        value,
        type: this.inferTokenType(name, value),
        category: 'js-constants',
        path
      });
    }

    return tokens;
  }

  /**
   * Infer token type from name and value
   */
  private inferTokenType(name: string, value: any): SpectrumToken['type'] {
    const nameLC = name.toLowerCase();
    const valueStr = String(value).toLowerCase();

    if (nameLC.includes('color') || nameLC.includes('bg') || nameLC.includes('border') || 
        valueStr.startsWith('#') || valueStr.startsWith('rgb') || valueStr.startsWith('hsl')) {
      return 'color';
    }
    
    if (nameLC.includes('size') || nameLC.includes('width') || nameLC.includes('height') || 
        nameLC.includes('margin') || nameLC.includes('padding') || 
        valueStr.includes('px') || valueStr.includes('rem') || valueStr.includes('em')) {
      return 'dimension';
    }
    
    if (nameLC.includes('font') && nameLC.includes('family')) {
      return 'fontFamily';
    }
    
    if (nameLC.includes('font') && nameLC.includes('weight')) {
      return 'fontWeight';
    }
    
    if (nameLC.includes('duration') || nameLC.includes('transition') || valueStr.includes('ms') || valueStr.includes('s')) {
      return 'duration';
    }
    
    return 'other';
  }

  /**
   * Get fallback tokens when GitHub access is limited
   */
  private getFallbackTokens(): SpectrumToken[] {
    return [
      // Essential color tokens - Spectrum Blue Scale
      { name: 'blue-100', value: '#e6f4ff', type: 'color', category: 'color.blue', description: 'Light blue background', path: 'fallback' },
      { name: 'blue-200', value: '#b3d9ff', type: 'color', category: 'color.blue', description: 'Lighter blue', path: 'fallback' },
      { name: 'blue-300', value: '#80bfff', type: 'color', category: 'color.blue', description: 'Medium light blue', path: 'fallback' },
      { name: 'blue-400', value: '#378ef0', type: 'color', category: 'color.blue', description: 'Primary blue', path: 'fallback' },
      { name: 'blue-500', value: '#2680eb', type: 'color', category: 'color.blue', description: 'Brand blue', path: 'fallback' },
      { name: 'blue-600', value: '#1473e6', type: 'color', category: 'color.blue', description: 'Dark blue', path: 'fallback' },
      { name: 'blue-700', value: '#0d66d0', type: 'color', category: 'color.blue', description: 'Darker blue', path: 'fallback' },
      
      // Essential gray scale
      { name: 'gray-50', value: '#fafafa', type: 'color', category: 'color.gray', description: 'Lightest gray', path: 'fallback' },
      { name: 'gray-100', value: '#f5f5f5', type: 'color', category: 'color.gray', description: 'Light gray background', path: 'fallback' },
      { name: 'gray-200', value: '#e1e1e1', type: 'color', category: 'color.gray', description: 'Border gray', path: 'fallback' },
      { name: 'gray-300', value: '#b3b3b3', type: 'color', category: 'color.gray', description: 'Medium gray', path: 'fallback' },
      { name: 'gray-400', value: '#808080', type: 'color', category: 'color.gray', description: 'Text gray', path: 'fallback' },
      { name: 'gray-500', value: '#606060', type: 'color', category: 'color.gray', description: 'Secondary text', path: 'fallback' },
      { name: 'gray-600', value: '#464646', type: 'color', category: 'color.gray', description: 'Dark text', path: 'fallback' },
      { name: 'gray-700', value: '#323232', type: 'color', category: 'color.gray', description: 'Primary text', path: 'fallback' },
      { name: 'gray-800', value: '#1f1f1f', type: 'color', category: 'color.gray', description: 'Darkest gray', path: 'fallback' },
      
      // Semantic colors
      { name: 'red-400', value: '#e34850', type: 'color', category: 'color.red', description: 'Error red', path: 'fallback' },
      { name: 'red-500', value: '#d7373f', type: 'color', category: 'color.red', description: 'Primary red', path: 'fallback' },
      { name: 'green-400', value: '#2d9d78', type: 'color', category: 'color.green', description: 'Success green', path: 'fallback' },
      { name: 'green-500', value: '#268e6c', type: 'color', category: 'color.green', description: 'Primary green', path: 'fallback' },
      { name: 'orange-400', value: '#e68619', type: 'color', category: 'color.orange', description: 'Warning orange', path: 'fallback' },
      { name: 'orange-500', value: '#da7b11', type: 'color', category: 'color.orange', description: 'Primary orange', path: 'fallback' },
      
      // Essential dimension tokens - Spectrum spacing scale
      { name: 'size-25', value: '2px', type: 'dimension', category: 'size', description: 'Smallest spacing', path: 'fallback' },
      { name: 'size-50', value: '4px', type: 'dimension', category: 'size', description: 'Extra small spacing', path: 'fallback' },
      { name: 'size-65', value: '5px', type: 'dimension', category: 'size', description: 'Small spacing variant', path: 'fallback' },
      { name: 'size-100', value: '8px', type: 'dimension', category: 'size', description: 'Small spacing', path: 'fallback' },
      { name: 'size-115', value: '9px', type: 'dimension', category: 'size', description: 'Small spacing variant', path: 'fallback' },
      { name: 'size-125', value: '10px', type: 'dimension', category: 'size', description: 'Medium small spacing', path: 'fallback' },
      { name: 'size-130', value: '11px', type: 'dimension', category: 'size', description: 'Medium small spacing', path: 'fallback' },
      { name: 'size-150', value: '12px', type: 'dimension', category: 'size', description: 'Base spacing', path: 'fallback' },
      { name: 'size-160', value: '13px', type: 'dimension', category: 'size', description: 'Medium spacing variant', path: 'fallback' },
      { name: 'size-175', value: '14px', type: 'dimension', category: 'size', description: 'Medium spacing', path: 'fallback' },
      { name: 'size-200', value: '16px', type: 'dimension', category: 'size', description: 'Large spacing', path: 'fallback' },
      { name: 'size-225', value: '18px', type: 'dimension', category: 'size', description: 'Large spacing variant', path: 'fallback' },
      { name: 'size-250', value: '20px', type: 'dimension', category: 'size', description: 'Extra large spacing', path: 'fallback' },
      { name: 'size-300', value: '24px', type: 'dimension', category: 'size', description: 'Section spacing', path: 'fallback' },
      { name: 'size-400', value: '32px', type: 'dimension', category: 'size', description: 'Component spacing', path: 'fallback' },
      { name: 'size-500', value: '40px', type: 'dimension', category: 'size', description: 'Layout spacing', path: 'fallback' },
      { name: 'size-600', value: '48px', type: 'dimension', category: 'size', description: 'Page spacing', path: 'fallback' },
      
      // Essential font tokens - Spectrum typography
      { name: 'font-family-sans', value: 'adobe-clean, "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', type: 'fontFamily', category: 'font', description: 'Primary font family', path: 'fallback' },
      { name: 'font-family-serif', value: '"Source Serif Pro", Georgia, serif', type: 'fontFamily', category: 'font', description: 'Serif font family', path: 'fallback' },
      { name: 'font-family-mono', value: '"Source Code Pro", Monaco, monospace', type: 'fontFamily', category: 'font', description: 'Monospace font family', path: 'fallback' },
      
      // Font weights
      { name: 'font-weight-light', value: '300', type: 'fontWeight', category: 'font', description: 'Light font weight', path: 'fallback' },
      { name: 'font-weight-regular', value: '400', type: 'fontWeight', category: 'font', description: 'Regular font weight', path: 'fallback' },
      { name: 'font-weight-medium', value: '500', type: 'fontWeight', category: 'font', description: 'Medium font weight', path: 'fallback' },
      { name: 'font-weight-bold', value: '700', type: 'fontWeight', category: 'font', description: 'Bold font weight', path: 'fallback' },
      { name: 'font-weight-black', value: '900', type: 'fontWeight', category: 'font', description: 'Black font weight', path: 'fallback' },
      
      // Duration tokens for animations
      { name: 'animation-duration-100', value: '130ms', type: 'duration', category: 'animation', description: 'Fast animation', path: 'fallback' },
      { name: 'animation-duration-200', value: '160ms', type: 'duration', category: 'animation', description: 'Medium animation', path: 'fallback' },
      { name: 'animation-duration-300', value: '190ms', type: 'duration', category: 'animation', description: 'Slow animation', path: 'fallback' },
      { name: 'animation-duration-400', value: '220ms', type: 'duration', category: 'animation', description: 'Extra slow animation', path: 'fallback' },
    ];
  }

  /**
   * Calculate extraction statistics
   */
  private calculateStats(tokens: SpectrumToken[]) {
    return {
      totalTokens: tokens.length,
      colorTokens: tokens.filter(t => t.type === 'color').length,
      dimensionTokens: tokens.filter(t => t.type === 'dimension').length,
      fontTokens: tokens.filter(t => t.type === 'fontFamily' || t.type === 'fontWeight').length,
      otherTokens: tokens.filter(t => !['color', 'dimension', 'fontFamily', 'fontWeight'].includes(t.type)).length
    };
  }
}

/**
 * Main extraction function
 */
export async function extractSpectrumTokens(githubToken?: string): Promise<TokenExtractionResult> {
  const extractor = new SpectrumTokenExtractor(githubToken);
  return await extractor.extractTokens();
}