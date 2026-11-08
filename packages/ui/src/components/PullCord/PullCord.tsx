'use client';

import { useState } from 'react';
import { switchTheme, useTheme } from '../../theme/useTheme';

/**
 * Theme toggle shaped like a light pull cord. Place it at the very top of the page. The visible
 * label says what pulling does, which is also its accessible name. The light theme spreads out from
 * the pull when the lights go on, and shrinks back into it when they go off.
 */
export type PullCordCopy = {
  /** Visible label while the light theme is on. */
  turnOff: string;
  /** Visible label while the dark theme is on. */
  turnOn: string;
  /** Read out after switching to dark. */
  turnedOff: string;
  /** Read out after switching to light. */
  turnedOn: string;
};

export function PullCord({ copy, className = '' }: { copy: PullCordCopy; className?: string }) {
  const dark = useTheme() === 'dark';
  // Bumped on every pull; used as a key so the tug animation restarts each time.
  const [pulls, setPulls] = useState(0);
  // Read out after a pull: focus stays on the cord, so the page change itself is not announced.
  const [announcement, setAnnouncement] = useState('');
  return (
    <div className={`bt-pull ${dark ? 'is-dark' : ''} ${className}`}>
      <span className="bt-pull-beam" aria-hidden="true" />
      <button
        type="button"
        className="bt-pull-cord focus-ring"
        onClick={(event) => {
          setPulls((n) => n + 1);
          setAnnouncement(dark ? copy.turnedOn : copy.turnedOff);
          const knob = event.currentTarget.querySelector('.bt-pull-knob')?.getBoundingClientRect();
          switchTheme(
            dark ? 'light' : 'dark',
            knob && { x: knob.left + knob.width / 2, y: knob.top + knob.height / 2 },
          );
        }}
      >
        <span className="bt-pull-mount" aria-hidden="true" />
        <span
          key={pulls}
          className={`bt-pull-body ${pulls > 0 ? 'is-tugged' : ''}`}
          aria-hidden="true"
        >
          <span className="bt-pull-string" />
          <svg className="bt-pull-knob" viewBox="0 0 16 26">
            <rect x="5" y="0" width="6" height="4" rx="1.5" className="bt-brass-dark" />
            <path
              d="M8 3 C4 3 3.5 9 3 15 C2.6 19 1 21 1 23 C1 25 15 25 15 23 C15 21 13.4 19 13 15 C12.5 9 12 3 8 3 Z"
              className="bt-brass"
            />
            <path
              d="M6.2 6 C5 9 4.8 14 4.3 18"
              fill="none"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="bt-pull-shine"
            />
            <ellipse cx="8" cy="23.4" rx="7" ry="1.6" className="bt-brass-dark" />
          </svg>
        </span>
        <span className="bt-pull-label">{dark ? copy.turnOn : copy.turnOff}</span>
      </button>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  );
}
