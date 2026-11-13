import { defineConfig } from 'eslint/config';
import { typescriptPackageConfig } from '@bratura/eslint-config';

// The contract is imported by the web app and by Convex alike, so it depends on neither.
// convex-helpers enters through one file, the table reference (primitives/code/id/fields.ts).
const frameworkImports = {
  group: [
    'convex',
    'convex/*',
    'convex-helpers',
    'convex-helpers/*',
    'next',
    'next/*',
    'react',
    'react/*',
    'react-dom',
    'react-dom/*',
  ],
  message:
    'packages/shared must be importable by both sides: no Convex, Next or React here. A table reference is documentId (primitives/code/id/fields.ts).',
};

export default defineConfig([
  ...typescriptPackageConfig(import.meta.dirname),
  {
    rules: {
      'no-restricted-imports': ['error', { patterns: [frameworkImports] }],
    },
  },
  {
    files: ['src/primitives/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            frameworkImports,
            {
              group: ['**/entities/**'],
              message:
                'A primitive has no identity: it never depends on an entity (primitives/AGENTS.md).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/primitives/code/id/fields.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
