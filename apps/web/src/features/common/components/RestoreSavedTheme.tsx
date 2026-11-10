'use client';

import { restoreSavedTheme } from '@bratura/ui';
import { useLayoutEffect } from 'react';

/**
 * Applies the saved theme on documents the client renders (every 404), where the `<head>` script
 * never runs; without it a 404 opens light for a visitor who chose dark. Before the first paint.
 */
export function RestoreSavedTheme() {
  useLayoutEffect(() => restoreSavedTheme(), []);
  return null;
}
