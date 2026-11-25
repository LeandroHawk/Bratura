'use client';

import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Container } from '@bratura/ui';
import { CompactHeader } from '@/features/common/components/layout/CompactHeader';
import { MAIN_CONTENT_ID } from '@/features/common/components/layout/mainContentId';
import { RESTORATION_CONTENT } from '@/features/common/components/restoration/content';
import { RoomUnderRestoration } from '@/features/common/components/restoration/RoomUnderRestoration';
import { ROUTES } from '@/features/common/config/routes';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';

/**
 * A page that broke while rendering: the room under restoration, "try again" and the way home.
 * Outside `PageShell`: an error boundary ships with every page, and so would the whole shell.
 */
export function RouteErrorPage({ locale, retry }: { locale: Locale; retry: () => void }) {
  const content = RESTORATION_CONTENT[locale];
  return (
    <>
      <CompactHeader locale={locale} />
      <Container as="main" id={MAIN_CONTENT_ID} className="pb-24">
        <h1 className="sr-only">{content.title}</h1>
        <RoomUnderRestoration locale={locale} message={content.unexpected} retry={retry}>
          <ButtonLink href={localizedPathFromLocale(locale, ROUTES.home)}>
            {content.home}
          </ButtonLink>
        </RoomUnderRestoration>
      </Container>
    </>
  );
}
