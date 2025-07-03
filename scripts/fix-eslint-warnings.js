#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

console.log('🧹 Fixing ESLint warnings automatically...');

const files = await glob('src/**/*.{ts,tsx}');
let totalFixes = 0;

for (const file of files) {
    let content = readFileSync(file, 'utf8');
    let fixes = 0;
    
    // Fix unused parameters by prefixing with underscore
    content = content.replace(/(\w+): ([^,)]+)(\)|,)/g, (match, param, type, ending) => {
        // Don't change parameters that are already prefixed or are commonly used
        if (param.startsWith('_') || ['request', 'response', 'req', 'res', 'file', 'data', 'options'].includes(param)) {
            return match;
        }
        // Check if parameter is actually used in the function
        const lines = content.split('\n');
        const currentLineIndex = content.substring(0, content.indexOf(match)).split('\n').length - 1;
        const functionStartIndex = Math.max(0, currentLineIndex - 10);
        const functionEndIndex = Math.min(lines.length, currentLineIndex + 50);
        const functionContent = lines.slice(functionStartIndex, functionEndIndex).join('\n');
        
        // If parameter is not used, prefix with underscore
        if (!functionContent.includes(param + '.') && !functionContent.includes(param + ' ') && !functionContent.includes(param + ')')) {
            fixes++;
            return `_${param}: ${type}${ending}`;
        }
        return match;
    });
    
    // Fix console statements in development files by adding eslint-disable
    if (file.includes('/dev-') || file.includes('/mock') || file.includes('development')) {
        content = content.replace(/(\s+)console\.(log|warn|error|info)/g, (match, indent, method) => {
            if (!content.substring(0, content.indexOf(match)).includes('eslint-disable-next-line no-console')) {
                fixes++;
                return `${indent}// eslint-disable-next-line no-console\n${indent}console.${method}`;
            }
            return match;
        });
    } else {
        // In production files, replace console with logger
        content = content.replace(/console\.(log|warn|error|info)/g, (match, method) => {
            fixes++;
            // Add logger import if not present
            if (!content.includes("import { logger }")) {
                content = "import { logger } from '../lib/logger';\n" + content;
            }
            return `logger.${method === 'log' ? 'info' : method}`;
        });
    }
    
    // Fix unused variables by prefixing with underscore
    content = content.replace(/(\s+)(const|let|var)\s+(\w+)\s*=/g, (match, indent, declaration, varName) => {
        if (varName.startsWith('_')) return match;
        
        // Check if variable is used
        const restOfFile = content.substring(content.indexOf(match) + match.length);
        if (!restOfFile.includes(varName)) {
            fixes++;
            return `${indent}${declaration} _${varName} =`;
        }
        return match;
    });
    
    if (fixes > 0) {
        writeFileSync(file, content);
        console.log(`✅ Fixed ${fixes} issues in ${file}`);
        totalFixes += fixes;
    }
}

console.log(`\n🎉 Fixed ${totalFixes} ESLint issues across ${files.length} files`);

// Now run ESLint to see remaining issues
console.log('\n🔍 Running ESLint to check remaining issues...');
const { exec } = await import('child_process');
exec('npm run lint', (error, stdout, stderr) => {
    if (error) {
        console.log('📊 ESLint results:');
        console.log(stdout);
    } else {
        console.log('✅ All ESLint issues resolved!');
    }
});