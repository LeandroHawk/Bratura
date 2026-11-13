import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// The contract is imported by the web app and by Convex alike, so it depends on neither.
const frameworkImports = {
  group: ['convex', 'convex/*', 'next', 'next/*', 'react', 'react/*', 'react-dom', 'react-dom/*'],
  message: 'packages/shared must be importable by both sides: no Convex, Next or React here.',
};

export default defineConfig([
  globalIgnores(['coverage/**']),
  ...tseslint.configs.recommended,
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
]);
