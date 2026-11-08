import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([globalIgnores(['coverage/**']), ...tseslint.configs.recommended]);
