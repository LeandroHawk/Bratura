'use client';

import { Button, Eyebrow } from '@bratura/ui';
import { useState } from 'react';
import { TICKET_KINDS, type TicketKind, type TicketsContent } from './content';
import { Ticket } from './Ticket';

/** Front sits square; the one behind is lifted and turned so its label shows above the front one. */
const FRONT = 'z-10 translate-x-0 translate-y-0 -rotate-1';
const BEHIND = 'z-0 translate-x-3 -translate-y-20 rotate-2 saturate-75 hover:-translate-y-22';
const MOVE = 'transition-transform duration-500 ease-out motion-reduce:transition-none';

/** A hand pressing, drawn in the text colour so it keeps the label's contrast on any theme. */
function PointingHand({ bouncing }: { bouncing: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-4 fill-none stroke-current ${bouncing ? 'motion-safe:animate-bounce' : ''}`}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 12V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M12 10.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M15 11.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M18 12.5a1.5 1.5 0 0 1 3 0v3a6.5 6.5 0 0 1-6.5 6.5h-1a6.5 6.5 0 0 1-5-2.4l-3.2-4a1.6 1.6 0 0 1 2.4-2.1L9 15.5V12" />
    </svg>
  );
}

/**
 * Both tickets stacked, "without" in front; the button swaps them. Both stay in the page, so a
 * screen reader reads both and, without JavaScript, the one behind still shows its label.
 */
export function TicketStack({ tickets }: { tickets: TicketsContent }) {
  const [front, setFront] = useState<TicketKind>('without');
  const [touched, setTouched] = useState(false);
  const swap = () => {
    setFront((current) => (current === 'with' ? 'without' : 'with'));
    setTouched(true);
  };

  return (
    <figure className="grid max-w-140 gap-4">
      <Eyebrow as="figcaption">{tickets.caption}</Eyebrow>
      <div className="grid items-start pt-24">
        {TICKET_KINDS.map((kind) => {
          const inFront = kind === front;
          return (
            <div
              key={kind}
              className={`relative [grid-area:1/1] ${MOVE} ${inFront ? FRONT : BEHIND}`}
            >
              <Ticket tickets={tickets} kind={kind} topNotch={!inFront} />
              {!inFront && (
                // A mouse shortcut over the ticket behind; keyboard and screen readers use the
                // labelled button below, so this one stays out of the tab order and the a11y tree.
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={swap}
                  className="absolute inset-0 cursor-pointer"
                />
              )}
            </div>
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={swap}
        aria-pressed={front === 'with'}
        className="justify-self-start"
      >
        <PointingHand bouncing={!touched} />
        {tickets[front].showOther}
      </Button>
    </figure>
  );
}
