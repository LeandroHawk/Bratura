'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from '../../utils/motion';
import { Heading } from '../Heading/Heading';

type CollapseProps = {
  /** The heading's text; it is also the toggle's accessible name. */
  title: ReactNode;
  /** The document level of the heading that holds the toggle. */
  headingAs?: 'h2' | 'h3';
  /** How many items the block holds, shown beside the title so a closed block still informs. */
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
};

function DrawerPull() {
  return (
    <svg viewBox="0 0 52 18" className="bt-drawer-pull" aria-hidden="true">
      <rect x="1" y="1" width="50" height="5" rx="2.5" className="fill-cord-shade" />
      <path d="M8 4h36a18 13 0 0 1-36 0Z" className="fill-cord" />
      <path
        d="M14 9h24"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="stroke-cord-highlight"
      />
      <circle cx="4.5" cy="3.5" r="1.3" className="fill-cord-highlight" />
      <circle cx="47.5" cy="3.5" r="1.3" className="fill-cord-highlight" />
    </svg>
  );
}

/**
 * A block that folds, drawn as a drawer of the collection's card catalogue: the label plate stays
 * on top and the edge with the pull slides down as the contents open. The plate is the one button
 * (heading + `aria-expanded`); the pull closes it too, for a pointer only.
 *
 * A closed drawer is `hidden="until-found"`, so find-in-page still reaches its text and opens it
 * (`beforematch`); a browser without it treats it as plain `hidden`. React would render the value
 * as `hidden=""`, so it is set on the element once the closing slide ends.
 */
export function Collapse({
  title,
  headingAs = 'h3',
  count,
  defaultOpen = false,
  children,
}: CollapseProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLButtonElement>(null);
  const toggle = () => setOpen((wasOpen) => !wasOpen);
  // Closing from the pull, below the contents: bring the plate back into view and give it the
  // focus, or the page would stay where the pull was and the plate would end up off screen.
  const toggleFromPull = () => {
    const front = frontRef.current;
    if (open && front) {
      front.scrollIntoView({ block: 'nearest' });
      front.focus({ preventScroll: true });
    }
    toggle();
  };

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const openOnFind = () => setOpen(true);
    box.addEventListener('beforematch', openOnFind);
    return () => box.removeEventListener('beforematch', openOnFind);
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    const box = boxRef.current;
    if (!body || !box) return;
    const hide = () => box.setAttribute('hidden', 'until-found');
    if (open) {
      box.removeAttribute('hidden');
      return;
    }
    // Already hidden (first render) or no slide to wait for: hide at once.
    if (box.hasAttribute('hidden') || prefersReducedMotion()) {
      hide();
      return;
    }
    const hideAfterSlide = (event: TransitionEvent) => {
      if (event.target === body) hide();
    };
    body.addEventListener('transitionend', hideAfterSlide);
    return () => body.removeEventListener('transitionend', hideAfterSlide);
  }, [open]);

  return (
    <div className="bt-drawer" data-open={open ? '' : undefined}>
      <Heading as={headingAs} size="item">
        <button
          type="button"
          ref={frontRef}
          className="bt-drawer-front focus-ring"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggle}
        >
          <span className="bt-drawer-label">
            <span className="bt-drawer-title">
              {title}
              {count !== undefined && <span className="font-body font-normal"> ({count})</span>}
            </span>
          </span>
        </button>
      </Heading>
      <div ref={bodyRef} className="bt-drawer-body">
        <div ref={boxRef} id={contentId} className="bt-drawer-box" hidden={!defaultOpen}>
          <div className="bt-drawer-inside">{children}</div>
        </div>
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="bt-drawer-edge"
        // A click must not focus a button hidden from assistive technology.
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggleFromPull}
      >
        <DrawerPull />
      </button>
    </div>
  );
}
