#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getDepth(filePath) {
  return filePath.split('/').length - 2; // -2 for src/ and filename
}

function getCorrectImportPath(depth, target) {
  const goUp = '../'.repeat(depth);
  return `${goUp}${target}`;
}

function fixImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const depth = getDepth(filePath);
  
  let newContent = content
    .replace(/from '\.\.\/\.\.\/lib\//g, `from '${getCorrectImportPath(depth, 'lib/')}'`)
    .replace(/from '\.\.\/\.\.\/lib'/g, `from '${getCorrectImportPath(depth, 'lib')}'`)
    .replace(/from '\.\.\/\.\.\/middleware\//g, `from '${getCorrectImportPath(depth, 'middleware/')}'`)
    .replace(/from '\.\.\/\.\.\/middleware'/g, `from '${getCorrectImportPath(depth, 'middleware')}'`)
    .replace(/from '\.\.\/\.\.\/components\//g, `from '${getCorrectImportPath(depth, 'components/')}'`)
    .replace(/from '\.\.\/\.\.\/integrations\//g, `from '${getCorrectImportPath(depth, 'integrations/')}'`);
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed imports in ${filePath}`);
  }
}

// Find all TypeScript files
function findTSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findTSFiles(fullPath));
    } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const tsFiles = findTSFiles('src');
tsFiles.forEach(fixImports);
console.log('Import fixing complete!');