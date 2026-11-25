import { handleAuth } from '@workos-inc/authkit-nextjs';

// Where WorkOS returns the user after sign-in (the redirect URI registered in its dashboard).
export const GET = handleAuth();
