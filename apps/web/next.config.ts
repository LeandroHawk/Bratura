import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The workspace packages ship TypeScript source; Next compiles them with the app.
  transpilePackages: ['@bratura/ui', '@bratura/shared'],
  experimental: {
    // The root layout sits under `[lang]`; without a global 404, every `notFound()` in `next dev`
    // bumps the HMR version and the 404 page reloads itself forever ("HMR hash mismatch").
    globalNotFound: true,
  },
};

export default nextConfig;
