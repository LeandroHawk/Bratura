import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Pins typescript-eslint to the package's own tsconfig: editors lint every workspace in one
 * process, and without it the parser cannot tell which package a file belongs to.
 */
export const tsconfigRootDirConfig = (packageDir) => ({
  languageOptions: { parserOptions: { tsconfigRootDir: packageDir } },
});

/**
 * Comments stop at 100 columns, like the code: Prettier wraps code but never a comment. Code
 * length stays Prettier's (`code` is set past it), and a long regex or URL is not a comment.
 */
export const commentWidthConfig = {
  rules: {
    'max-len': [
      'error',
      { code: 1000, comments: 100, ignoreUrls: true, ignoreRegExpLiterals: true },
    ],
  },
};

/** The base of every TypeScript package here: typescript-eslint's recommended rules, its own root. */
export const typescriptPackageConfig = (packageDir) => [
  globalIgnores(['coverage/**']),
  ...tseslint.configs.recommended,
  tsconfigRootDirConfig(packageDir),
  commentWidthConfig,
];
