import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, ClosedRoom } from '@bratura/ui';
import type { ReactNode } from 'react';
import { RESTORATION_CONTENT } from './content';

/**
 * What every screen shows when something did not work: the room closed for restoration, with
 * `message` saying what failed. `retry` adds "try again"; `children` add other ways on (a link
 * home). Without a retry, there is nothing to try again (no backend configured).
 */
export function RoomUnderRestoration({
  locale,
  message,
  retry,
  children,
}: {
  locale: Locale;
  message: string;
  retry?: () => void;
  children?: ReactNode;
}) {
  const content = RESTORATION_CONTENT[locale];
  const hasAction = retry !== undefined || children !== undefined;
  return (
    <ClosedRoom
      title={content.title}
      message={message}
      action={
        hasAction && (
          <div className="flex flex-wrap justify-center gap-3">
            {retry && (
              <Button variant="ghost" onClick={retry}>
                {content.retry}
              </Button>
            )}
            {children}
          </div>
        )
      }
    />
  );
}
