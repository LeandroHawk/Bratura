import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { COLOR_TOKENS } from '@bratura/ui';
import { StyleguideBlock } from '@/features/styleguide/pages/sections/common/StyleguideBlock';
import { COLORS_CONTENT } from './content';

/** Token groups in the order tokens.ts lists them. */
const COLOR_GROUPS = [...new Set(COLOR_TOKENS.map((token) => token.group))];

/** Every colour token, grouped, painted by its own variable in the panel's theme. */
export function Colors({ locale }: { locale: Locale }) {
  const content = COLORS_CONTENT[locale];
  return (
    <StyleguideBlock title={content.title}>
      {COLOR_GROUPS.map((group) => (
        <div key={group} className="grid gap-2">
          <p className="font-display text-small italic">{content.groups[group]}</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {COLOR_TOKENS.filter((token) => token.group === group).map((token) => (
              <li key={token.name} className="grid gap-1 text-xs">
                <span
                  className="block h-12 rounded-xl border border-border"
                  style={{ background: `var(--bt-${token.name})` }}
                />
                <span className="font-semibold">{content.tokens[token.name]}</span>
                <code className="text-muted-foreground">--bt-{token.name}</code>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </StyleguideBlock>
  );
}
