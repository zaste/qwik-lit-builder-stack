# Spectrum Extractor Tools

## Purpose
Extract design tokens, CSS patterns, and component behaviors from Adobe Spectrum repositories using GitHub API.

## Structure
- `extract-tokens.ts` - Extract design tokens from Spectrum repos
- `extract-css.ts` - Analyze CSS patterns and methodologies  
- `github-client.ts` - GitHub API wrapper for repository access
- `extract-behaviors.ts` - Extract A11y and interaction patterns

## Usage
```bash
# Extract Spectrum tokens
npm run extract:tokens

# Extract CSS patterns
npm run extract:css

# Extract all patterns
npm run extract:all
```

## Output
Generated files will be placed in `src/design-system/foundation/` for integration.