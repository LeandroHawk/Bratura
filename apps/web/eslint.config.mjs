import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { tsconfigRootDirConfig } from '@bratura/eslint-config';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts']),
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                "Outside the current folder, import with '@/' (AGENTS.md, Code conventions).",
            },
          ],
        },
      ],
    },
  },
  tsconfigRootDirConfig(import.meta.dirname),
]);
