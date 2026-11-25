'use client';

import { api } from '@bratura/backend/convex/_generated/api';
import { AuthKitProvider, useAccessToken, useAuth } from '@workos-inc/authkit-nextjs/components';
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvexAuth,
  useMutation,
} from 'convex/react';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl === undefined ? null : new ConvexReactClient(convexUrl);

/** The WorkOS session as Convex's auth hook (Convex's documented pattern for AuthKit). */
function useAuthFromWorkos() {
  const { user, loading } = useAuth();
  const { getAccessToken, refresh } = useAccessToken();
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) return null;
      try {
        if (forceRefreshToken) return (await refresh()) ?? null;
        return (await getAccessToken()) ?? null;
      } catch {
        return null;
      }
    },
    [user, refresh, getAccessToken],
  );
  return { isLoading: loading, isAuthenticated: user !== null, fetchAccessToken };
}

/** On every sign-in, `users:store` find-or-creates the caller's row — the first login needs it. */
function StoreUserOnSignIn() {
  const { isAuthenticated } = useConvexAuth();
  const store = useMutation(api.users.store);
  const stored = useRef(false);
  useEffect(() => {
    if (!isAuthenticated) {
      stored.current = false;
      return;
    }
    if (stored.current) return;
    stored.current = true;
    void store({}).catch((error: unknown) => {
      stored.current = false;
      console.error('users:store failed', error);
    });
  }, [isAuthenticated, store]);
  return null;
}

/**
 * Sign-in (WorkOS) and data (Convex) for every page: AuthKit keeps the session, Convex carries
 * its JWT to the backend. Without `NEXT_PUBLIC_CONVEX_URL` the site still renders, backend off.
 */
export function ConvexSessionProvider({ children }: { children: ReactNode }) {
  return (
    <AuthKitProvider>
      {convex === null ? (
        children
      ) : (
        <ConvexProviderWithAuth client={convex} useAuth={useAuthFromWorkos}>
          <StoreUserOnSignIn />
          {children}
        </ConvexProviderWithAuth>
      )}
    </AuthKitProvider>
  );
}
