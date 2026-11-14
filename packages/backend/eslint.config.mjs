import { defineConfig, globalIgnores } from 'eslint/config';
import { typescriptPackageConfig } from '@bratura/eslint-config';

export default defineConfig([
  globalIgnores(['convex/_generated/**']),
  ...typescriptPackageConfig(import.meta.dirname),
  {
    files: ['convex/**/*.ts'],
    ignores: ['convex/**/*.test.ts', 'convex/**/*.fixture.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // A table grows with every ingestion; past 32,000 documents read the query fails.
          selector:
            "CallExpression[callee.property.name='collect'][callee.object.callee.property.name='query']",
          message:
            'A whole-table scan: read through an index range (withIndex) instead (docs/review.md, Backend).',
        },
        {
          // A source that never answers would hang the action until Convex kills it.
          selector: "CallExpression[callee.name='fetch']:not(:has(Property[key.name='signal']))",
          message:
            'Every fetch to the outside carries a timeout: { signal: AbortSignal.timeout(ms) }.',
        },
      ],
    },
  },
]);
