# Component Generator

## Purpose
Generate new LIT components with Spectrum-inspired patterns and Qwik integration.

## Features
- Scaffold new components with proper structure
- Generate TypeScript types and interfaces
- Create Qwik wrapper components automatically
- Include Storybook stories and unit tests
- Apply Spectrum design patterns

## Usage
```bash
# Generate new component
npm run generate:component -- --name Button --type primitive

# Generate complex component
npm run generate:component -- --name DataTable --type complex

# Generate with custom options
npm run generate:component -- --name ProductCard --type composite --features="validation,async"
```

## Component Types
- **primitive**: Basic UI elements (Button, Input, Card)
- **composite**: Combined components (Form, Modal, Dialog)  
- **complex**: Advanced components (DataTable, Calendar, Editor)

## Generated Structure
```
src/design-system/components/button/
├── Button.ts              # Main LIT component
├── Button.stories.ts      # Storybook stories
├── Button.test.ts         # Unit tests
├── Button.types.ts        # TypeScript interfaces
├── index.ts               # Barrel export
└── README.md              # Component documentation
```