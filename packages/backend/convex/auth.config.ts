// WorkOS AuthKit as the JWT provider: Convex verifies the token's issuer against `domain` and
// its audience against `applicationID` (the AuthKit client id — public, but read from the env
// so each deployment uses its own). Set WORKOS_CLIENT_ID before `convex dev`/`deploy` pushes
// this file. The CLI evaluates this file outside the Convex runtime, so `process` is declared
// like `lib/env.ts` does.
declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      domain: 'https://api.workos.com/',
      applicationID: process.env.WORKOS_CLIENT_ID,
    },
  ],
};
