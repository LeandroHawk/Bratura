import { callNoticeCounterCeiling } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-counters/query';
import type { CSSProperties } from 'react';

/**
 * A row of counted things: the number large, what it counts under it. A `null` count is still
 * loading; the server stops counting at a ceiling, shown as "500+".
 */
export function Counters({ counters }: { counters: { label: string; count: number | null }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {counters.map(({ label, count }, index) => (
        <div
          key={label}
          className="rise-in flex flex-col-reverse rounded-2xl border border-border bg-card p-4"
          style={{ '--rise-index': index } as CSSProperties}
        >
          <dt className="text-small text-muted-foreground">{label}</dt>
          <dd className="font-display text-4xl leading-none font-bold">
            {count === null
              ? '…'
              : count >= callNoticeCounterCeiling
                ? `${callNoticeCounterCeiling}+`
                : count}
          </dd>
        </div>
      ))}
    </dl>
  );
}
