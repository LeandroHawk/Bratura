import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Logo } from '@bratura/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@/features/common/config/routes';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { LAYOUT_CONTENT } from './content';

/**
 * The header of every page but the landing and the 404: the small logo home in the top-left
 * corner, and `children` (the compact sign and cord) hanging from the top edge on the right.
 */
export function CompactHeader({ locale, children }: { locale: Locale; children?: ReactNode }) {
  return (
    // Hidden in print: the portfolio exports to PDF through window.print().
    <Container as="header" className="relative h-20 md:h-24 print:hidden">
      <Link
        href={localizedPathFromLocale(locale, ROUTES.home)}
        aria-label={LAYOUT_CONTENT[locale].homeLink}
        className="absolute top-4 left-4 rounded-sm focus-ring sm:left-6 md:top-6"
      >
        <Logo slogan={false} className="text-2xl sm:text-3xl" />
      </Link>
      {children}
    </Container>
  );
}
