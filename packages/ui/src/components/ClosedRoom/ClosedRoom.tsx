import type { ReactNode } from 'react';

/**
 * Something that did not work, as a room closed for restoration: two brass stanchions, a velvet
 * rope across the doorway and a plaque hanging from it (`title`), then what happened in plain
 * words (`message`) and, when there is one, the way to try again (`action`, a button).
 */
export function ClosedRoom({
  title,
  message,
  action,
  className = '',
}: {
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={`bt-closed ${className}`}>
      <div className="bt-closed-scene">
        <span className="bt-closed-post is-left" aria-hidden="true" />
        <span className="bt-closed-post is-right" aria-hidden="true" />
        <svg className="bt-closed-rope" viewBox="0 0 200 40" aria-hidden="true">
          <path d="M6 6 Q100 46 194 6" />
        </svg>
        <p className="bt-closed-plaque walnut-plaque">{title}</p>
      </div>
      <p className="bt-closed-message">{message}</p>
      {action}
    </div>
  );
}
