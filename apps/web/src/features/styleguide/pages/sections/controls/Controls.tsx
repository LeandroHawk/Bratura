import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, Button, Tag } from '@bratura/ui';
import Link from 'next/link';
import { ROUTES } from '@/features/common/config/routes';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { StyleguideBlock } from '@/features/styleguide/pages/sections/common/StyleguideBlock';
import { CONTROLS_CONTENT } from './content';

/** Buttons, the link in running text, status badges and neutral tags. */
export function Controls({ locale }: { locale: Locale }) {
  const content = CONTROLS_CONTENT[locale];
  return (
    <StyleguideBlock title={content.title}>
      <div className="flex flex-wrap gap-3">
        <Button>{content.buttons.primary}</Button>
        <Button variant="ghost">{content.buttons.ghost}</Button>
        <Button variant="ghost" size="sm">
          {content.buttons.small}
        </Button>
      </div>
      <p>
        {content.link.before}{' '}
        <Link href={localizedPathFromLocale(locale, ROUTES.callNotices)} className="text-link">
          {content.link.text}
        </Link>
        {content.link.after}
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge tone="open">{content.badges.open}</Badge>
        <Badge tone="soon">{content.badges.soon}</Badge>
        <Badge tone="missing">{content.badges.missing}</Badge>
        <Badge tone="neutral">{content.badges.neutral}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="open" variant="dot">
          {content.badges.dotOpen}
        </Badge>
        <Badge tone="soon" variant="dot">
          {content.badges.dotSoon}
        </Badge>
        <Badge tone="neutral" variant="dot">
          {content.badges.dotNeutral}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Tag>{content.tags.portfolio}</Tag>
        <Tag>{content.tags.sicab}</Tag>
        <Tag size="md">{content.tags.kit}</Tag>
      </div>
    </StyleguideBlock>
  );
}
