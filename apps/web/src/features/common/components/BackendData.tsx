'use client';

import { ConvexProvider } from 'convex/react';
import { Component, type ReactNode } from 'react';
import { convexClient } from '@/features/common/data/convexClient';

class BackendErrorBoundary extends Component<
  { children: ReactNode; fallback: (retry: () => void) => ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    // Trying again mounts the children afresh, so their queries subscribe again.
    return this.state.failed
      ? this.props.fallback(() => this.setState({ failed: false }))
      : this.props.children;
  }
}

/**
 * Gives its children the backend's reads. Where no backend is configured it draws `unavailable`
 * instead: a hook of `data/` never runs without a connection. When a child throws while rendering
 * (a failed read, or a bug) it draws `failed`, whose `retry` mounts the children again.
 */
export function BackendData({
  children,
  unavailable,
  failed,
}: {
  children: ReactNode;
  unavailable: ReactNode;
  failed: (retry: () => void) => ReactNode;
}) {
  if (convexClient === null) return unavailable;
  return (
    <BackendErrorBoundary fallback={failed}>
      <ConvexProvider client={convexClient}>{children}</ConvexProvider>
    </BackendErrorBoundary>
  );
}
