// WorkOS AuthKit as the JWT provider, in the form Convex documents for it: AuthKit access
// tokens carry no `aud` claim, so the OIDC shorthand ({ domain, applicationID }) can never
// match — the provider is a customJwt that checks the issuer against the WorkOS JWKS instead.
// WORKOS_CLIENT_ID must be set on the deployment; the CLI evaluates this file outside the
// Convex runtime, so `process` is declared like `lib/env.ts` does.
declare const process: { env: Record<string, string | undefined> };

const clientId = process.env.WORKOS_CLIENT_ID;

export default {
  providers: [
    {
      type: 'customJwt',
      issuer: 'https://api.workos.com/',
      algorithm: 'RS256',
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    {
      // AuthKit session tokens: iss is the user_management URL and there is no `aud`.
      type: 'customJwt',
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: 'RS256',
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
};
