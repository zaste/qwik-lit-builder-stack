module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:qwik/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'prefer-spread': 'off',
    'no-case-declarations': 'off',
    'no-console': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/consistent-type-imports': 'warn',
  },
  ignorePatterns: [
    '*.cjs',
    '*.mjs',
    '**/*.log',
    '**/.DS_Store',
    '.vscode/settings.json',
    '.history',
    '.yarn',
    'bazel-*',
    'bazel-bin',
    'bazel-out',
    'bazel-qwik',
    'bazel-testlogs',
    'dist',
    'dist-dev',
    'lib',
    'lib-types',
    'etc',
    'external',
    'node_modules',
    'temp',
    'tsc-out',
    'tsdoc-metadata.json',
    'target',
    'output',
    'rollup.config.js',
    'build',
    '.cache',
    '.vscode',
    '.rollup.cache',
    'tsconfig.tsbuildinfo',
    'vite.config.ts',
    '*.spec.tsx',
    '*.spec.ts',
    'server',
  ],
};
