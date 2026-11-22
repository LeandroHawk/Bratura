'use client';

import { ConvexProvider } from 'convex/react';
import { Component, type ReactNode } from 'react';
import { convexClient } from '@/features/common/data/convexClient';

class BackendErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

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
  return (
    <BackendErrorBoundary fallback={unavailable}>
      <ConvexProvider client={convexClient}>{children}</ConvexProvider>
    </BackendErrorBoundary>
  );
}
