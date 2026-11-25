import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import type { CSSProperties } from 'react';
import { StyleguideBlock } from '@/features/styleguide/pages/sections/common/StyleguideBlock';
import { MOTION_CONTENT } from './content';

/** `rise-in`: a list's items rise one after the other, staggered by `--rise-index`. */
export function Motion({ locale }: { locale: Locale }) {
  const content = MOTION_CONTENT[locale];
  return (
    <StyleguideBlock title={content.title}>
      <ul className="grid grid-cols-3 gap-3">
        {content.items.map((text, index) => (
          <li
            key={text}
            className="rise-in rounded-xl border border-border bg-card p-3 text-small"
            style={{ '--rise-index': index } as CSSProperties}
          >
            {text}
          </li>
        ))}
      </ul>
      <p className="text-small text-muted-foreground">{content.note}</p>
    </StyleguideBlock>
  );
}
