import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, ClosedRoom, Loading } from '@bratura/ui';
import { APP_CONTENT } from '@/features/common/components/app/content';
import { RESTORATION_CONTENT } from '@/features/common/components/restoration/content';
import { StyleguideBlock } from '@/features/styleguide/pages/sections/common/StyleguideBlock';
import { WAITING_CONTENT } from './content';

/** Waiting (a screen's and a list's next page) and the room closed for restoration. */
export function Waiting({ locale }: { locale: Locale }) {
  const content = WAITING_CONTENT[locale];
  const restoration = RESTORATION_CONTENT[locale];
  return (
    <StyleguideBlock title={content.title}>
      <Loading label={APP_CONTENT[locale].loading} />
      <Loading inline label={content.inline} />
      <ClosedRoom
        title={restoration.title}
        message={content.closedMessage}
        action={<Button variant="ghost">{restoration.retry}</Button>}
      />
    </StyleguideBlock>
  );
}
