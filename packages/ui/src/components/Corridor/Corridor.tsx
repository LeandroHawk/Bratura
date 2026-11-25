import type { ReactNode } from 'react';

/**
 * A museum corridor seen from the side: one door per room standing on the floor, the room's name
 * lettered on it, and the building's exit at the end, where `exit` (an `ExitSign`) hangs on the
 * last door. `children` are `CorridorDoor`s; it is a list.
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
 * One room's door with its name (`caption` over `children`, the room's link, which covers the
 * door) lettered on it. The name stays still while the leaf turns: the current room's door stands
 * open, so the name reads on its lit back wall; the others open a little on hover.
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
          <span className="bt-door-knob" />
        </span>
      </span>
      <span className="bt-door-label">
        <span className="bt-door-caption">{caption}</span>
        <span className="bt-door-name">{children}</span>
      </span>
    </li>
  );
}
