'use client';

import { prefersReducedMotion } from '@bratura/ui';
import { type RefObject, useEffect } from 'react';

/**
 * Sets `data-curtain` on the stage: `closed` once JavaScript runs, `open` when it scrolls into view.
 * Absent (no JavaScript, reduced motion) means open and still, so nobody faces a closed curtain.
 */
export function useCurtains(stage: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = stage.current;
    if (!element || prefersReducedMotion()) return;
    element.setAttribute('data-curtain', 'closed');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.setAttribute('data-curtain', 'open');
        observer.disconnect();
      },
      { threshold: 0.45 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [stage]);
}
