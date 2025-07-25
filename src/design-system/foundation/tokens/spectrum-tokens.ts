/**
 * Extracted Spectrum Design Tokens
 * Generated on: 2025-07-01T15:04:38.470Z
 * Sources: 8 repositories
 */

export interface SpectrumToken {
  name: string;
  value: string | number;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'duration' | 'other';
  category: string;
  description?: string;
  path: string;
}

export const spectrumTokens: SpectrumToken[] = [
  {
    "name": "0",
    "value": "src/typography.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "1",
    "value": "src/semantic-color-palette.json",
    "type": "dimension",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "2",
    "value": "src/layout.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "3",
    "value": "src/layout-component.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "4",
    "value": "src/icons.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "5",
    "value": "src/color-palette.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "6",
    "value": "src/color-component.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "7",
    "value": "src/color-aliases.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/manifest.json"
  },
  {
    "name": "name",
    "value": "@adobe/spectrum-tokens",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "version",
    "value": "13.10.1",
    "type": "other",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "description",
    "value": "Design tokens for Spectrum, Adobe's design system",
    "type": "dimension",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "type",
    "value": "module",
    "type": "other",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "main",
    "value": "index.js",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "tokens",
    "value": "dist/json/variables.json",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "type",
    "value": "git",
    "type": "other",
    "category": "root.repository",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "url",
    "value": "git+https://github.com/adobe/spectrum-tokens.git",
    "type": "duration",
    "category": "root.repository",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "author",
    "value": "Garth Braithwaite <garthdb@gmail.com> (http://garthdb.com/)",
    "type": "other",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "license",
    "value": "Apache-2.0",
    "type": "other",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "url",
    "value": "https://github.com/adobe/spectrum-tokens/issues",
    "type": "duration",
    "category": "root.bugs",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "homepage",
    "value": "https://github.com/adobe/spectrum-tokens/tree/main/packages/tokens#readme",
    "type": "duration",
    "category": "root",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "@adobe/token-diff-generator",
    "value": "workspace:*",
    "type": "duration",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "ajv",
    "value": "^8.17.1",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "ajv-formats",
    "value": "^3.0.1",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "deep-object-diff",
    "value": "^1.1.9",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "find-duplicated-property-keys",
    "value": "^1.2.9",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "style-dictionary",
    "value": "^3.9.2",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "style-dictionary-sets",
    "value": "^2.3.0",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "tar",
    "value": "^7.4.3",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "tmp-promise",
    "value": "^3.0.3",
    "type": "other",
    "category": "root.devDependencies",
    "path": "packages/tokens/package.json"
  },
  {
    "name": "name",
    "value": "@spectrum-css/tokens",
    "type": "duration",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "version",
    "value": "16.0.2",
    "type": "other",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "description",
    "value": "The Spectrum CSS tokens package",
    "type": "duration",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "license",
    "value": "Apache-2.0",
    "type": "other",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "author",
    "value": "Adobe",
    "type": "other",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "homepage",
    "value": "https://opensource.adobe.com/spectrum-css",
    "type": "duration",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "type",
    "value": "git",
    "type": "other",
    "category": "root.repository",
    "path": "tokens/package.json"
  },
  {
    "name": "url",
    "value": "https://github.com/adobe/spectrum-css.git",
    "type": "duration",
    "category": "root.repository",
    "path": "tokens/package.json"
  },
  {
    "name": "directory",
    "value": "tokens",
    "type": "duration",
    "category": "root.repository",
    "path": "tokens/package.json"
  },
  {
    "name": "url",
    "value": "https://github.com/adobe/spectrum-css/issues",
    "type": "duration",
    "category": "root.bugs",
    "path": "tokens/package.json"
  },
  {
    "name": "type",
    "value": "module",
    "type": "other",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": ".",
    "value": "./dist/css/index.css",
    "type": "duration",
    "category": "root.exports",
    "path": "tokens/package.json"
  },
  {
    "name": "./*.md",
    "value": "./*.md",
    "type": "other",
    "category": "root.exports",
    "path": "tokens/package.json"
  },
  {
    "name": "./dist/*",
    "value": "./dist/*",
    "type": "duration",
    "category": "root.exports",
    "path": "tokens/package.json"
  },
  {
    "name": "./dist/index.css",
    "value": "./dist/css/index.css",
    "type": "duration",
    "category": "root.exports",
    "path": "tokens/package.json"
  },
  {
    "name": "./package.json",
    "value": "./package.json",
    "type": "duration",
    "category": "root.exports",
    "path": "tokens/package.json"
  },
  {
    "name": "main",
    "value": "dist/css/index.css",
    "type": "duration",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "module",
    "value": "style-dictionary.config.js",
    "type": "duration",
    "category": "root",
    "path": "tokens/package.json"
  },
  {
    "name": "@adobe/spectrum-tokens",
    "value": "0.0.0-s2-foundations-20241121221506",
    "type": "duration",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "@adobe/token-diff-generator",
    "value": "^2.0.0",
    "type": "other",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "@spectrum-tools/postcss-rgb-mapping",
    "value": "1.1.0",
    "type": "other",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "deepmerge",
    "value": "^4.3.1",
    "type": "other",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "lodash-es",
    "value": "^4.17.21",
    "type": "other",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "postcss",
    "value": "^8.5.6",
    "type": "other",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "postcss-sorting",
    "value": "^9.1.0",
    "type": "other",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "style-dictionary",
    "value": "^4.4.0",
    "type": "other",
    "category": "root.devDependencies",
    "path": "tokens/package.json"
  },
  {
    "name": "access",
    "value": "public",
    "type": "other",
    "category": "root.publishConfig",
    "path": "tokens/package.json"
  },
  {
    "name": "blue-100",
    "value": "#e6f4ff",
    "type": "color",
    "category": "color.blue",
    "description": "Light blue background",
    "path": "fallback"
  },
  {
    "name": "blue-200",
    "value": "#b3d9ff",
    "type": "color",
    "category": "color.blue",
    "description": "Lighter blue",
    "path": "fallback"
  },
  {
    "name": "blue-300",
    "value": "#80bfff",
    "type": "color",
    "category": "color.blue",
    "description": "Medium light blue",
    "path": "fallback"
  },
  {
    "name": "blue-400",
    "value": "#378ef0",
    "type": "color",
    "category": "color.blue",
    "description": "Primary blue",
    "path": "fallback"
  },
  {
    "name": "blue-500",
    "value": "#2680eb",
    "type": "color",
    "category": "color.blue",
    "description": "Brand blue",
    "path": "fallback"
  },
  {
    "name": "blue-600",
    "value": "#1473e6",
    "type": "color",
    "category": "color.blue",
    "description": "Dark blue",
    "path": "fallback"
  },
  {
    "name": "blue-700",
    "value": "#0d66d0",
    "type": "color",
    "category": "color.blue",
    "description": "Darker blue",
    "path": "fallback"
  },
  {
    "name": "gray-50",
    "value": "#fafafa",
    "type": "color",
    "category": "color.gray",
    "description": "Lightest gray",
    "path": "fallback"
  },
  {
    "name": "gray-100",
    "value": "#f5f5f5",
    "type": "color",
    "category": "color.gray",
    "description": "Light gray background",
    "path": "fallback"
  },
  {
    "name": "gray-200",
    "value": "#e1e1e1",
    "type": "color",
    "category": "color.gray",
    "description": "Border gray",
    "path": "fallback"
  },
  {
    "name": "gray-300",
    "value": "#b3b3b3",
    "type": "color",
    "category": "color.gray",
    "description": "Medium gray",
    "path": "fallback"
  },
  {
    "name": "gray-400",
    "value": "#808080",
    "type": "color",
    "category": "color.gray",
    "description": "Text gray",
    "path": "fallback"
  },
  {
    "name": "gray-500",
    "value": "#606060",
    "type": "color",
    "category": "color.gray",
    "description": "Secondary text",
    "path": "fallback"
  },
  {
    "name": "gray-600",
    "value": "#464646",
    "type": "color",
    "category": "color.gray",
    "description": "Dark text",
    "path": "fallback"
  },
  {
    "name": "gray-700",
    "value": "#323232",
    "type": "color",
    "category": "color.gray",
    "description": "Primary text",
    "path": "fallback"
  },
  {
    "name": "gray-800",
    "value": "#1f1f1f",
    "type": "color",
    "category": "color.gray",
    "description": "Darkest gray",
    "path": "fallback"
  },
  {
    "name": "red-400",
    "value": "#e34850",
    "type": "color",
    "category": "color.red",
    "description": "Error red",
    "path": "fallback"
  },
  {
    "name": "red-500",
    "value": "#d7373f",
    "type": "color",
    "category": "color.red",
    "description": "Primary red",
    "path": "fallback"
  },
  {
    "name": "green-400",
    "value": "#2d9d78",
    "type": "color",
    "category": "color.green",
    "description": "Success green",
    "path": "fallback"
  },
  {
    "name": "green-500",
    "value": "#268e6c",
    "type": "color",
    "category": "color.green",
    "description": "Primary green",
    "path": "fallback"
  },
  {
    "name": "orange-400",
    "value": "#e68619",
    "type": "color",
    "category": "color.orange",
    "description": "Warning orange",
    "path": "fallback"
  },
  {
    "name": "orange-500",
    "value": "#da7b11",
    "type": "color",
    "category": "color.orange",
    "description": "Primary orange",
    "path": "fallback"
  },
  {
    "name": "size-25",
    "value": "2px",
    "type": "dimension",
    "category": "size",
    "description": "Smallest spacing",
    "path": "fallback"
  },
  {
    "name": "size-50",
    "value": "4px",
    "type": "dimension",
    "category": "size",
    "description": "Extra small spacing",
    "path": "fallback"
  },
  {
    "name": "size-65",
    "value": "5px",
    "type": "dimension",
    "category": "size",
    "description": "Small spacing variant",
    "path": "fallback"
  },
  {
    "name": "size-100",
    "value": "8px",
    "type": "dimension",
    "category": "size",
    "description": "Small spacing",
    "path": "fallback"
  },
  {
    "name": "size-115",
    "value": "9px",
    "type": "dimension",
    "category": "size",
    "description": "Small spacing variant",
    "path": "fallback"
  },
  {
    "name": "size-125",
    "value": "10px",
    "type": "dimension",
    "category": "size",
    "description": "Medium small spacing",
    "path": "fallback"
  },
  {
    "name": "size-130",
    "value": "11px",
    "type": "dimension",
    "category": "size",
    "description": "Medium small spacing",
    "path": "fallback"
  },
  {
    "name": "size-150",
    "value": "12px",
    "type": "dimension",
    "category": "size",
    "description": "Base spacing",
    "path": "fallback"
  },
  {
    "name": "size-160",
    "value": "13px",
    "type": "dimension",
    "category": "size",
    "description": "Medium spacing variant",
    "path": "fallback"
  },
  {
    "name": "size-175",
    "value": "14px",
    "type": "dimension",
    "category": "size",
    "description": "Medium spacing",
    "path": "fallback"
  },
  {
    "name": "size-200",
    "value": "16px",
    "type": "dimension",
    "category": "size",
    "description": "Large spacing",
    "path": "fallback"
  },
  {
    "name": "size-225",
    "value": "18px",
    "type": "dimension",
    "category": "size",
    "description": "Large spacing variant",
    "path": "fallback"
  },
  {
    "name": "size-250",
    "value": "20px",
    "type": "dimension",
    "category": "size",
    "description": "Extra large spacing",
    "path": "fallback"
  },
  {
    "name": "size-300",
    "value": "24px",
    "type": "dimension",
    "category": "size",
    "description": "Section spacing",
    "path": "fallback"
  },
  {
    "name": "size-400",
    "value": "32px",
    "type": "dimension",
    "category": "size",
    "description": "Component spacing",
    "path": "fallback"
  },
  {
    "name": "size-500",
    "value": "40px",
    "type": "dimension",
    "category": "size",
    "description": "Layout spacing",
    "path": "fallback"
  },
  {
    "name": "size-600",
    "value": "48px",
    "type": "dimension",
    "category": "size",
    "description": "Page spacing",
    "path": "fallback"
  },
  {
    "name": "font-family-sans",
    "value": "adobe-clean, \"Source Sans Pro\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
    "type": "fontFamily",
    "category": "font",
    "description": "Primary font family",
    "path": "fallback"
  },
  {
    "name": "font-family-serif",
    "value": "\"Source Serif Pro\", Georgia, serif",
    "type": "fontFamily",
    "category": "font",
    "description": "Serif font family",
    "path": "fallback"
  },
  {
    "name": "font-family-mono",
    "value": "\"Source Code Pro\", Monaco, monospace",
    "type": "fontFamily",
    "category": "font",
    "description": "Monospace font family",
    "path": "fallback"
  },
  {
    "name": "font-weight-light",
    "value": "300",
    "type": "fontWeight",
    "category": "font",
    "description": "Light font weight",
    "path": "fallback"
  },
  {
    "name": "font-weight-regular",
    "value": "400",
    "type": "fontWeight",
    "category": "font",
    "description": "Regular font weight",
    "path": "fallback"
  },
  {
    "name": "font-weight-medium",
    "value": "500",
    "type": "fontWeight",
    "category": "font",
    "description": "Medium font weight",
    "path": "fallback"
  },
  {
    "name": "font-weight-bold",
    "value": "700",
    "type": "fontWeight",
    "category": "font",
    "description": "Bold font weight",
    "path": "fallback"
  },
  {
    "name": "font-weight-black",
    "value": "900",
    "type": "fontWeight",
    "category": "font",
    "description": "Black font weight",
    "path": "fallback"
  },
  {
    "name": "animation-duration-100",
    "value": "130ms",
    "type": "duration",
    "category": "animation",
    "description": "Fast animation",
    "path": "fallback"
  },
  {
    "name": "animation-duration-200",
    "value": "160ms",
    "type": "duration",
    "category": "animation",
    "description": "Medium animation",
    "path": "fallback"
  },
  {
    "name": "animation-duration-300",
    "value": "190ms",
    "type": "duration",
    "category": "animation",
    "description": "Slow animation",
    "path": "fallback"
  },
  {
    "name": "animation-duration-400",
    "value": "220ms",
    "type": "duration",
    "category": "animation",
    "description": "Extra slow animation",
    "path": "fallback"
  }
];

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
export const tokenStats = {
  "totalTokens": 107,
  "colorTokens": 22,
  "dimensionTokens": 19,
  "fontTokens": 8,
  "otherTokens": 58
};
