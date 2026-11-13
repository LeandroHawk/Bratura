import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Convex runs functions outside Node; convex-test emulates it in the edge runtime.
    environment: 'edge-runtime',
    server: { deps: { inline: ['convex-test'] } },
  },
});
