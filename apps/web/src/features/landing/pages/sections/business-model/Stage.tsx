'use client';

import { type ReactNode, useRef } from 'react';
import { Drapes, FOLDS_BACKGROUND } from './Curtains';
import { useCurtains } from './useCurtains';

/** Closed: panels cover the stage at once. Open: they slide away; without the attribute they are already away. */
const PANEL_MOTION =
  'group-data-[curtain=closed]:translate-x-0 group-data-[curtain=open]:transition-transform group-data-[curtain=open]:duration-[1600ms] group-data-[curtain=open]:ease-[cubic-bezier(0.65,0,0.35,1)]';

/**
 * The lit stage the free creator stands on. When it scrolls into view, two velvet panels part and
 * the spotlight comes up; the content is in the page all along, the panels only cover it.
 */
export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useCurtains(ref);
  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-t-2xl border border-b-0 border-border bg-background"
    >
      <div
        className="pointer-events-none absolute inset-0 group-data-[curtain=closed]:opacity-0 group-data-[curtain=open]:transition-opacity group-data-[curtain=open]:delay-700 group-data-[curtain=open]:duration-1000"
        style={{
          background:
            'radial-gradient(ellipse 45% 85% at 50% 0%, color-mix(in oklab, var(--bt-glow) 70%, transparent), transparent 75%)',
        }}
        aria-hidden="true"
      />
      <Drapes />
      <div className="relative">{children}</div>
      {(['left', 'right'] as const).map((side) => (
        <div
          key={side}
          className={`pointer-events-none absolute inset-y-0 z-20 w-1/2 shadow-[0_0_24px_color-mix(in_oklab,var(--bt-curtain-shadow)_35%,transparent)] ${side === 'left' ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} ${PANEL_MOTION}`}
          style={{ background: FOLDS_BACKGROUND }}
          aria-hidden="true"
        />
      ))}
      {/* The stage floor's front edge, in front of the curtains. */}
      <div className="relative z-30 h-4 border-t-4 border-wood-edge bg-wood" aria-hidden="true" />
    </div>
  );
}
