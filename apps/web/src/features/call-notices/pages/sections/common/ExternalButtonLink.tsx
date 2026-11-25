import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink } from '@bratura/ui';
import type { ComponentProps } from 'react';
import { NewTabHint } from '@/features/common/components/NewTabHint';

/** A button to another site (the official page, the pass checkout): a new tab, said so. */
export function ExternalButtonLink({
  locale,
  children,
  ...props
}: Omit<ComponentProps<typeof ButtonLink>, 'target' | 'rel'> & { locale: Locale }) {
  return (
    <ButtonLink target="_blank" rel="noreferrer" {...props}>
      {children}
      <NewTabHint locale={locale} />
    </ButtonLink>
  );
}
