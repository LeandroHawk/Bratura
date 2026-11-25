'use client';

import { createContext, use, useId, useRef, useState, type ReactNode } from 'react';
import { DialogCloseButton, useModalDialog } from '../Dialog/Dialog';

export type MuseumMapCopy = {
  /** The word beside the folded map on the plaque ("Mapa"). */
  label: string;
  /** The unfolded map's heading. */
  title: string;
  /** The close button's accessible name. */
  closeLabel: string;
  /** The mark on the current room ("Você está aqui"). */
  here: string;
};

/** `copy.here`, handed down to the rooms so each one does not take it again. */
const HereLabelContext = createContext('');

/** The room the visitor stands in, as its door plaque shows it. */
export type MuseumMapPlaque = {
  /** The number on the plaque's brass disc; left out for a room without one (a lobby). */
  number?: string;
  /** The small line over the name ("Sala 2"). */
  caption: string;
  name: string;
};

/**
 * The current room's plaque, fixed at the bottom of a phone; tapping it unfolds the map, a modal
 * `<dialog>` with `aside` beside its heading and `children` (a `MuseumMapRooms` plan) under it.
 */
export function MuseumMap({
  copy,
  plaque,
  aside,
  children,
  className = '',
}: {
  copy: MuseumMapCopy;
  plaque: MuseumMapPlaque;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Focus lands on the close button, not on the first link (the language sign), so opening the
  // map never reads as a step towards switching language.
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalDialog(open, closeRef);
  const titleId = useId();

  return (
    <div className={`bt-map ${className}`}>
      <button
        type="button"
        className="bt-map-plaque focus-ring"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="bt-map-screws" aria-hidden="true" />
        {plaque.number && (
          <span className="bt-map-number" aria-hidden="true">
            {plaque.number}
          </span>
        )}
        <span className="bt-map-room-name">
          <span className="bt-map-caption">{plaque.caption}</span>
          <span className="bt-map-name">{plaque.name}</span>
        </span>
        <span className="bt-map-open">
          <svg className="bt-map-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z" />
            <path d="M9 4v14M15 6v14" />
          </svg>
          {copy.label}
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className="bt-modal bt-map-sheet"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
      >
        <div className="bt-map-paper">
          <div className="flex items-start gap-3">
            <h2
              id={titleId}
              className="min-w-0 flex-1 pt-1 font-display text-xl leading-tight font-bold"
            >
              {copy.title}
            </h2>
            {aside}
            <DialogCloseButton
              ref={closeRef}
              label={copy.closeLabel}
              onClick={() => setOpen(false)}
              className="-mr-1"
            />
          </div>
          <HereLabelContext value={copy.here}>{children}</HereLabelContext>
        </div>
      </dialog>
    </div>
  );
}

/**
 * The floor plan: rooms stacked wall to wall with doorways between them, and the building's door
 * at the bottom, where `exit` (an `ExitSign`) hangs. `children` are `MuseumMapRoom`s.
 */
export function MuseumMapRooms({ exit, children }: { exit?: ReactNode; children: ReactNode }) {
  return (
    <div className="bt-map-plan">
      <ul className="bt-map-rooms">{children}</ul>
      {exit && <div className="bt-map-exit">{exit}</div>}
    </div>
  );
}

/**
 * One room on the plan: its number over its name (a link, or plain text for the room the visitor
 * is in when it has no page). The current room is drawn taller, marked "you are here", and holds
 * `fixture` (the light cord hanging from its ceiling).
 */
export function MuseumMapRoom({
  caption,
  current = false,
  fixture,
  children,
}: {
  caption: string;
  current?: boolean;
  fixture?: ReactNode;
  children: ReactNode;
}) {
  const hereLabel = use(HereLabelContext);
  return (
    <li className={`bt-map-room ${current ? 'is-current' : ''}`}>
      <span className="bt-map-room-label">
        <span className="bt-map-room-caption">{caption}</span>
        <span className="bt-map-room-title">{children}</span>
        {current && (
          <span className="bt-map-here" aria-hidden="true">
            <svg viewBox="0 0 12 16" className="bt-map-pin" aria-hidden="true">
              <path d="M6 15s5-5.5 5-9A5 5 0 0 0 1 6c0 3.5 5 9 5 9Z" />
              <circle cx="6" cy="6" r="1.8" />
            </svg>
            {hereLabel}
          </span>
        )}
      </span>
      {fixture && <span className="bt-map-fixture">{fixture}</span>}
    </li>
  );
}
