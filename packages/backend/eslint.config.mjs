import { defineConfig, globalIgnores } from 'eslint/config';
import { typescriptPackageConfig } from '@bratura/eslint-config';

export default defineConfig([
  globalIgnores(['convex/_generated/**']),
  ...typescriptPackageConfig(import.meta.dirname),
]);
