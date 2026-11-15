import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The same `@/` the app's tsconfig declares.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
