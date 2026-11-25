import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Eyebrow, Heading } from '@bratura/ui';
import { StyleguideBlock } from '@/features/styleguide/pages/sections/common/StyleguideBlock';
import { TYPOGRAPHY_CONTENT } from './content';

/** The two typefaces in their roles: headings, captions, running text, the label. */
export function Typography({ locale }: { locale: Locale }) {
  const content = TYPOGRAPHY_CONTENT[locale];
  return (
    <StyleguideBlock title={content.title}>
      <Heading as="p" size="section">
        {content.display}
      </Heading>
      <p className="font-display text-lg italic">{content.caption}</p>
      <p>{content.body}</p>
      <Eyebrow>{content.eyebrow}</Eyebrow>
    </StyleguideBlock>
  );
}
