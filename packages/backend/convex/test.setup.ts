// Every Convex module, generated ones included, for convex-test. Tests and this file are not
// modules: the Convex CLI skips any file name with two dots too.
export const modules = import.meta.glob([
  './**/*.{ts,js}',
  '!./**/*.d.ts',
  '!./**/*.test.ts',
  '!./test.setup.ts',
]);

// Vitest (through Vite) replaces `import.meta.glob` at build time; `vite/client` would declare it,
// but pnpm keeps vite out of this package's reach, so only the call used here is typed.
declare global {
  interface ImportMeta {
    glob(patterns: string[]): Record<string, () => Promise<unknown>>;
  }
}
