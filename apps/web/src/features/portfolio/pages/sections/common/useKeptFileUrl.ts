'use client';

import { useEffect, useState } from 'react';
import { keptFile } from '@/features/common/data/demoFileStore';

/**
 * A URL for the bytes kept under `storageKey`, valid while the component is mounted: `undefined`
 * while they are read, `null` when this browser does not have them.
 */
export function useKeptFileUrl(storageKey: string | undefined): string | null | undefined {
  const [found, setFound] = useState<{ storageKey: string; url: string | null } | null>(null);

  useEffect(() => {
    if (storageKey === undefined) return;
    let url: string | null = null;
    let isCurrent = true;
    keptFile(storageKey)
      .catch(() => null)
      .then((file) => {
        if (!isCurrent) return;
        url = file ? URL.createObjectURL(file) : null;
        setFound({ storageKey, url });
      });
    return () => {
      isCurrent = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [storageKey]);

  if (storageKey === undefined) return null;
  return found?.storageKey === storageKey ? found.url : undefined;
}
