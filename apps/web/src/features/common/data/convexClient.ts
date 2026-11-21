import { ConvexReactClient } from 'convex/react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * The connection to the backend; `null` where no deployment is configured (a build with no
 * `NEXT_PUBLIC_CONVEX_URL`), so a screen says the calls are unavailable instead of breaking.
 */
export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;
