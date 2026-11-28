import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { commentWidthConfig, tsconfigRootDirConfig } from '@bratura/eslint-config';

const parentFolderImport = {
  group: ['../*'],
  message: "Outside the current folder, import with '@/' (AGENTS.md, Code conventions).",
};

// IndexedDB bytes go through demoStore's functions, the one place to swap for Convex.
const demoFileStoreBoundary = {
  group: ['**/demoFileStore'],
  message: "Use demoStore's file functions; only demoStore reads demoFileStore.",
};

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
          patterns: [parentFolderImport, demoFileStoreBoundary],
        },
      ],
    },
  },
  {
    files: ['src/features/common/data/demoStore.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [parentFolderImport] }],
    },
  },
  tsconfigRootDirConfig(import.meta.dirname),
  commentWidthConfig,
]);
