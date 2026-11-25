import type { ReactNode } from 'react';

/**
 * What a status means to the creator. The three colours map to one status token each (same hue in
 * both themes); `neutral` is the absence of a status (not informed, still to check), so it is
 * drawn in the muted text colour instead of borrowing an alert's.
 */
export type BadgeTone = 'open' | 'soon' | 'missing' | 'neutral';

/**
 * `solid` fills the pill with the tone; `dot` keeps the pill outlined and puts the tone in a dot,
 * so two badges answering different questions side by side (a deadline, a fit) never look alike.
 */
export type BadgeVariant = 'solid' | 'dot';

const SOLID: Record<BadgeTone, string> = {
  open: 'bg-status-open text-status-open-foreground',
  soon: 'bg-status-soon text-status-soon-foreground',
  missing: 'bg-status-missing text-status-missing-foreground',
  neutral: 'border border-current/30 text-muted-foreground',
};

const DOT: Record<BadgeTone, string> = {
  open: 'bg-status-open',
  soon: 'bg-status-soon',
  missing: 'bg-status-missing',
  neutral: 'bg-muted-foreground',
};

export function Badge({
  tone,
  variant = 'solid',
  children,
}: {
  tone: BadgeTone;
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  const look =
    variant === 'dot'
      ? `gap-1.5 border border-current/30 ${tone === 'neutral' ? 'text-muted-foreground' : 'text-foreground'}`
      : SOLID[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-caption font-semibold ${look}`}
    >
      {variant === 'dot' && (
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${DOT[tone]}`} />
      )}
      {children}
    </span>
  );
}
