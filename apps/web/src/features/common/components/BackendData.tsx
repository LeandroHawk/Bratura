'use client';

import { ConvexProvider } from 'convex/react';
import type { ReactNode } from 'react';
import { convexClient } from '@/features/common/data/convexClient';

/**
 * Gives its children the backend's reads. Where no backend is configured it draws `unavailable`
 * instead: a hook of `data/` never runs without a connection.
 */
export function BackendData({
  children,
  unavailable,
}: {
  children: ReactNode;
  unavailable: ReactNode;
}) {
  if (convexClient === null) return unavailable;
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
