import type { ReactNode } from 'react';

/** What a call's status means to the creator. Each maps to one status token (same hue in both themes). */
export type BadgeTone = 'open' | 'soon' | 'missing';

const TONE: Record<BadgeTone, string> = {
  open: 'bg-status-open text-status-open-foreground',
  soon: 'bg-status-soon text-status-soon-foreground',
  missing: 'bg-status-missing text-status-missing-foreground',
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-caption font-semibold ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
