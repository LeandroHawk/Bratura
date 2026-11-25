import type { ReactNode } from 'react';

/**
 * A museum corridor seen from the side: one door per room standing on the floor, its plaque over
 * the lintel, and the building's exit at the end, where `exit` (an `ExitSign`) hangs over the
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
          {exit}
          <span className="bt-door is-exit" aria-hidden="true">
            <span className="bt-door-leaf">
              <span className="bt-door-bar" />
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * One room's door: the plaque (`caption` over `children`, the room's link, which covers the whole
 * door) and the door under it. The current room's door stands open, its light spilling out; the
 * others open a little on hover.
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
      <span className="bt-room-plaque walnut-plaque">
        <span className="bt-room-plaque-caption">{caption}</span>
        <span className="bt-room-plaque-name">{children}</span>
      </span>
      <span className="bt-door" aria-hidden="true">
        <span className="bt-door-room" />
        <span className="bt-door-leaf">
          <span className="bt-door-panel" />
          <span className="bt-door-panel" />
          <span className="bt-door-knob" />
        </span>
      </span>
    </li>
  );
}
