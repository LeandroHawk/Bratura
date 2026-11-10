import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, Card, Eyebrow, Heading } from '@bratura/ui';
import { HERO_CONTENT } from './content';

/**
 * What the creator sees for one call: the gaps, not just the listing. An illustration (figure), so
 * the call's name is not a heading of this page.
 */
export function ExampleCall({ locale }: { locale: Locale }) {
  const content = HERO_CONTENT[locale].exampleCall;
  return (
    <Card as="figure" className="grid max-w-[520px] gap-4 shadow-lifted lg:rotate-1">
      <Eyebrow as="figcaption">{content.caption}</Eyebrow>
      <div className="grid gap-1">
        <Heading as="p" size="card">
          {content.name}
        </Heading>
        <p className="text-sm text-muted-foreground">{content.issuer}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="open">{content.open}</Badge>
        <Badge tone="soon">{content.soon}</Badge>
        <Badge tone="missing">{content.missingBadge}</Badge>
      </div>
      <ul className="grid gap-3 border-t border-border pt-4 text-small">
        <li className="flex items-center justify-between gap-4">
          <span>{content.photos}</span>
          <span className="font-semibold">{content.photosCount}</span>
        </li>
        <li className="grid gap-2">
          <span className="flex items-center justify-between gap-4">
            <span>{content.yearsActive}</span>
            <span className="font-semibold">{content.yearsActiveCount}</span>
          </span>
          {/* The text above already says 2 of 3; the bar is decoration. */}
          <span className="h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <span className="block h-full w-2/3 rounded-full bg-status-open" />
          </span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <span>{content.meiCertificate}</span>
          <span className="font-semibold text-status-missing">{content.missing}</span>
        </li>
      </ul>
    </Card>
  );
}
