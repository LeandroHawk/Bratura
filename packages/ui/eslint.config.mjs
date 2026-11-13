import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import { typescriptPackageConfig } from '@bratura/eslint-config';

export default defineConfig([
  ...typescriptPackageConfig(import.meta.dirname),
  jsxA11y.flatConfigs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
]);
