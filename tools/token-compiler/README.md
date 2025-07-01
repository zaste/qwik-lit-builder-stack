# Token Compiler

## Purpose
Compile extracted Spectrum-inspired tokens into multiple formats for cross-platform use.

## Features
- CSS Custom Properties
- SCSS Variables
- JavaScript/TypeScript objects
- JSON format
- Swift (iOS)
- Kotlin (Android)

## Usage
```bash
# Compile tokens to all formats
npm run tokens:compile

# Compile specific format
npm run tokens:css
npm run tokens:js
npm run tokens:json
```

## Output Formats
- `dist/tokens/tokens.css` - CSS custom properties
- `dist/tokens/tokens.scss` - SCSS variables
- `dist/tokens/tokens.js` - JS/TS objects
- `dist/tokens/tokens.json` - JSON format