import type { ReactNode } from 'react';

/**
 * A museum corridor seen from the side: one door per room standing on the floor, the room's name
 * lettered on it, a lit sconce on the wall between two doors, and the building's exit at the end,
 * where `exit` (an `ExitSign`) hangs on the last door. `children` are `CorridorDoor`s, a list.
 */
export function Corridor({
  exit,
  children,
  className = '',
}: {
  exit?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bt-corridor ${className}`}>
      <ul className="bt-corridor-doors">{children}</ul>
      {exit && (
        <div className="bt-corridor-exit">
          <span className="bt-door is-exit" aria-hidden="true">
            <span className="bt-door-leaf">
              <span className="bt-door-bar" />
            </span>
          </span>
          <span className="bt-door-label">{exit}</span>
        </div>
      )}
    </div>
  );
}

/**
 * One room's double door, lettered with `caption` on a small plaque over `children`, the room's
 * link, which covers the door. The name stays still while the leaves turn: the current room's door
 * stands open, its name on the lit back wall; the others open a little on hover.
 */
export function CorridorDoor({
  caption,
  current = false,
  children,
}: {
  caption: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <li className={`bt-corridor-room ${current ? 'is-current' : ''}`}>
      <span className="bt-door" aria-hidden="true">
        <span className="bt-door-room" />
        <span className="bt-door-leaf">
          <span className="bt-door-panel" />
          <span className="bt-door-panel" />
        </span>
        <span className="bt-door-leaf is-right">
          <span className="bt-door-panel" />
          <span className="bt-door-panel" />
        </span>
      </span>
      <span className="bt-door-label">
        <span className="bt-door-caption walnut-plaque">{caption}</span>
        <span className="bt-door-name">{children}</span>
      </span>
    </li>
  );
}
