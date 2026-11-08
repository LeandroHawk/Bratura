'use client';

import { useState, type MouseEvent } from 'react';
import { prefersReducedMotion } from '../../utils/motion';

export type HangingSignFace = {
  /** Big word on the board. */
  label: string;
  /** Small line under it. */
  hint: string;
  /** BCP 47 tag the face is written in. */
  lang: string;
};

export type HangingSignProps = {
  href: string;
  /** Language of the page the link opens. */
  hrefLang?: string;
  /** What the board says now: names where the link goes. */
  front: HangingSignFace;
  /** What it says once turned: the face the next page will show, so the swap looks seamless. */
  back: HangingSignFace;
  className?: string;
};

/** How long the board takes to turn before the link is followed. Matches the transition on `.bt-sign-faces` in hanging-sign.css. */
const TURN_MS = 450;

/**
 * A two-sided board hanging from a nail, like a market stall's "Aberto / Fechado" sign. It is a
 * plain link: on a normal click the board turns over first, then the browser follows `href`.
 * Modified clicks (new tab, new window) and reduced motion skip the turn.
 */
export function HangingSign({ href, hrefLang, front, back, className = '' }: HangingSignProps) {
  const [turned, setTurned] = useState(false);

  function turnThenFollow(event: MouseEvent<HTMLAnchorElement>) {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (modified || event.button !== 0 || prefersReducedMotion()) return;
    event.preventDefault();
    setTurned(true);
    window.setTimeout(() => window.location.assign(href), TURN_MS);
  }

  return (
    <a
      href={href}
      hrefLang={hrefLang}
      lang={front.lang}
      className={`bt-sign focus-ring ${className}`}
      onClick={turnThenFollow}
    >
      <span className="bt-sign-swing">
        <span className="bt-sign-nail" aria-hidden="true" />
        <svg className="bt-sign-strings" viewBox="0 0 110 34" aria-hidden="true">
          <path d="M55 2 L14 33 M55 2 L96 33" />
        </svg>
        <span className="bt-sign-turn">
          <span className={`bt-sign-faces ${turned ? 'is-turned' : ''}`}>
            <span className="bt-sign-board">
              <span className="bt-sign-label">{front.label}</span>
              <span className="bt-sign-hint">{front.hint}</span>
            </span>
            <span className="bt-sign-board is-back" lang={back.lang} aria-hidden="true">
              <span className="bt-sign-label">{back.label}</span>
              <span className="bt-sign-hint">{back.hint}</span>
            </span>
          </span>
        </span>
      </span>
    </a>
  );
}
