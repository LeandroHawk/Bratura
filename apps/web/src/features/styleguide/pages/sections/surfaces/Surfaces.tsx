import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Card, Heading } from '@bratura/ui';
import { SURFACES_CONTENT } from './content';

/** The card: the surface a call, a portfolio piece or a notice sits on. */
export function Surfaces({ locale }: { locale: Locale }) {
  const content = SURFACES_CONTENT[locale];
  return (
    <Card className="grid gap-1">
      <Heading as="p" size="item">
        {content.title}
      </Heading>
      <span className="text-muted-foreground">{content.body}</span>
    </Card>
  );
}
