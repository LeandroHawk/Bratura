import { Heading, Tag } from '@bratura/ui';
import type { TicketKind, TicketsContent } from './content';

/** A punched notch on the perforation, cut in the page's background colour. */
function Notch({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <span
      className={`absolute right-[calc(38%-12px)] size-6 rounded-full border border-ticket-edge bg-background sm:right-[calc(32%-12px)] ${edge === 'top' ? '-top-3' : '-bottom-3'}`}
      aria-hidden="true"
    />
  );
}

/** Small label on the ticket, in the ticket's own muted ink. */
const LABEL = 'text-caption text-ticket-muted';

/**
 * A theatre ticket for a public call, paid in documents. Label and stamp: red without Bratura, green
 * with it. `topNotch` off for the ticket in front of a stack, or it cuts a hole over the one behind.
 */
export function Ticket({
  tickets,
  kind,
  topNotch,
}: {
  tickets: TicketsContent;
  kind: TicketKind;
  topNotch: boolean;
}) {
  const side = tickets[kind];
  const accent = kind === 'with' ? 'text-ticket-stamp-ready' : 'text-ticket-stamp';
  return (
    <div
      className="relative grid grid-cols-[62%_38%] rounded-2xl border border-ticket-edge text-ticket-ink shadow-lifted shadow-ticket-edge sm:grid-cols-[68%_32%]"
      style={{
        background:
          'linear-gradient(115deg, var(--bt-ticket) 0%, var(--bt-ticket-shine) 45%, var(--bt-ticket) 70%)',
      }}
    >
      {topNotch && <Notch edge="top" />}
      <Notch edge="bottom" />
      <div className="grid content-start gap-3 p-5">
        <p className="grid">
          <span className="font-body text-xs tracking-[0.1em] text-ticket-muted uppercase">
            {tickets.admits}
          </span>
          <span className={`font-display text-2xl leading-tight font-bold ${accent}`}>
            {side.label}
          </span>
        </p>
        <Heading as="p" size="card">
          {tickets.show}
        </Heading>
        <div className="grid gap-2">
          <span className={LABEL}>{tickets.priceLabel}</span>
          <ul className="flex flex-wrap gap-1.5">
            {tickets.price.map((item) => (
              <Tag key={item} as="li">
                {item}
              </Tag>
            ))}
          </ul>
          {side.priceNote && <p className="text-small font-semibold">{side.priceNote}</p>}
        </div>
      </div>
      <div className="@container relative grid content-start gap-3 border-l-2 border-dashed border-ticket-edge p-5">
        {side.stub.map((line) => (
          <p key={line.label} className="grid">
            <span className={LABEL}>{line.label}</span>
            <span className="text-small font-semibold">{line.value}</span>
          </p>
        ))}
        <Stamp text={side.stamp} accent={accent} />
      </div>
    </div>
  );
}

/**
 * The stub's rubber stamp. Where one line does not fit the stub, the last word drops to a second
 * line so the border keeps hugging the text: a wrapped inline box would stretch to the stub's full
 * width and stop reading as a stamp. On narrow stubs it sits by the perforation and its type
 * shrinks with the stub (`cqi`), so the rotated corner never crosses the ticket's edge.
 */
function Stamp({ text, accent }: { text: string; accent: string }) {
  const cut = text.lastIndexOf(' ');
  const lines = [text.slice(0, cut), text.slice(cut + 1)];
  const longestLine = Math.max(...lines.map((line) => line.length));
  // 142cqi per character of the longest line: measured fit, 6px clear of the edge, 280–1280px.
  const fontSize = `min(var(--text-caption), ${(142 / longestLine).toFixed(2)}cqi)`;
  const line = 'block @min-[156px]:inline';
  return (
    <span
      className={`-ml-4 -rotate-12 justify-self-start rounded-md border-2 border-current px-2 py-0.5 font-display text-caption font-bold whitespace-nowrap uppercase @min-[96px]:-ml-3 @min-[156px]:ml-0 ${accent}`}
      style={{ fontSize }}
    >
      <span className={line}>{lines[0]}</span> <span className={line}>{lines[1]}</span>
    </span>
  );
}
