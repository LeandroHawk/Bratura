import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Pins typescript-eslint to the package's own tsconfig: editors lint every workspace in one
 * process, and without it the parser cannot tell which package a file belongs to.
 */
export const tsconfigRootDirConfig = (packageDir) => ({
  languageOptions: { parserOptions: { tsconfigRootDir: packageDir } },
});

/** The base of every TypeScript package here: typescript-eslint's recommended rules, its own root. */
export const typescriptPackageConfig = (packageDir) => [
  globalIgnores(['coverage/**']),
  ...tseslint.configs.recommended,
  tsconfigRootDirConfig(packageDir),
];
