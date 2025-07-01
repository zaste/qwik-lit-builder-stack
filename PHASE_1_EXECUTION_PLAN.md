/**
 * Analyze extracted Spectrum tokens for categorization and prioritization
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface TokenAnalysis {
  essential: any[];
  extended: any[];
  categories: Record<string, number>;
  recommendations: string[];
}

export function analyzeExtractedTokens(): TokenAnalysis {
  const tokensPath = join(process.cwd(), 'src/design-system/foundation/tokens/spectrum-extracted.json');
  
  try {
    const data = JSON.parse(readFileSync(tokensPath, 'utf-8'));
    const tokens = data.tokens || [];
    
    const analysis: TokenAnalysis = {
      essential: [],
      extended: [],
      categories: {},
      recommendations: []
    };
    
    // Categorize tokens
    tokens.forEach((token: any) => {
      const category = token.category || 'other';
      analysis.categories[category] = (analysis.categories[category] || 0) + 1;
      
      // Determine if essential or extended
      if (isEssentialToken(token)) {
        analysis.essential.push(token);
      } else {
        analysis.extended.push(token);
      }
    });
    
    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);
    
    return analysis;
  } catch (error) {
    console.error('❌ Could not analyze tokens:', error.message);
    return {
      essential: [],
      extended: [],
      categories: {},
      recommendations: ['Run token extraction first: npx tsx tools/spectrum-extractor/index.ts']
    };
  }
}

function isEssentialToken(token: any): boolean {
  const name = token.name.toLowerCase();
  const category = token.category.toLowerCase();
  
  // Essential color tokens
  if (token.type === 'color') {
    return name.includes('blue') || name.includes('gray') || name.includes('white') || name.includes('black');
  }
  
  // Essential dimension tokens
  if (token.type === 'dimension') {
    return name.includes('size') || name.includes('space') || category.includes('spacing');
  }
  
  // Essential font tokens
  if (token.type === 'fontFamily' || token.type === 'fontWeight') {
    return true; // All font tokens are essential
  }
  
  return false;
}

function generateRecommendations(analysis: TokenAnalysis): string[] {
  const recommendations: string[] = [];
  
  if (analysis.essential.length > 0) {
    recommendations.push(`✅ ${analysis.essential.length} essential tokens identified for immediate implementation`);
  }
  
  if (analysis.extended.length > 0) {
    recommendations.push(`📋 ${analysis.extended.length} extended tokens available for future phases`);
  }
  
  // Category-specific recommendations
  const colorCount = analysis.categories['color'] || 0;
  if (colorCount > 20) {
    recommendations.push(`🎨 ${colorCount} color tokens found - consider creating semantic color groups`);
  }
  
  const dimensionCount = analysis.categories['dimension'] || 0;
  if (dimensionCount > 15) {
    recommendations.push(`📏 ${dimensionCount} dimension tokens found - create spacing/sizing scales`);
  }
  
  return recommendations;
}

// CLI execution
if (require.main === module) {
  console.log('🔍 Analyzing extracted Spectrum tokens...');
  
  const analysis = analyzeExtractedTokens();
  
  console.log('\n📊 Token Analysis Results:');
  console.log(`Essential tokens: ${analysis.essential.length}`);
  console.log(`Extended tokens: ${analysis.extended.length}`);
  
  console.log('\n📋 Categories:');
  Object.entries(analysis.categories).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} tokens`);
  });
  
  console.log('\n💡 Recommendations:');
  analysis.recommendations.forEach(rec => console.log(`  ${rec}`));
  
  console.log('\n✅ Analysis complete!');
}