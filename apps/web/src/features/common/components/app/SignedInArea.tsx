'use client';

import type { Creator } from '@bratura/shared/entities/creator/entity';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Card, Heading } from '@bratura/ui';
import type { ReactNode } from 'react';
import { ROUTES } from '@/features/common/config/routes';
import { useDemoState, type DemoState } from '@/features/common/data/demoStore';
import { localizedPathFromLocale, type SitePath } from '@/features/common/utils/locale-path';
import { AppNav } from './AppNav';
import { APP_CONTENT } from './content';

export type SignedInState = DemoState & { creator: Creator };

/**
 * The frame of a page behind the sign-in: the area's navigation and the page, drawn with the
 * creator's data; a visitor who is not signed in gets the way in instead.
 */
export function SignedInArea({
  locale,
  currentPath,
  children,
}: {
  locale: Locale;
  currentPath: SitePath;
  children: (state: SignedInState) => ReactNode;
}) {
  const content = APP_CONTENT[locale];
  const state = useDemoState();

  // Before the browser's storage is read (the server's HTML and the first paint).
  if (state === null) return <p className="text-muted-foreground">{content.loading}</p>;

  if (!state.isSignedIn || state.creator === null)
    return (
      <Card as="section" className="rise-in grid max-w-xl justify-items-start gap-4 p-6 sm:p-8">
        <Heading as="h1" size="card">
          {content.gateTitle}
        </Heading>
        <p className="text-muted-foreground">{content.gateLead}</p>
        <ul className="flex flex-wrap gap-3">
          <li>
            <ButtonLink href={localizedPathFromLocale(locale, ROUTES.signIn)}>
              {content.signIn}
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href={localizedPathFromLocale(locale, ROUTES.signUp)} variant="ghost">
              {content.signUp}
            </ButtonLink>
          </li>
        </ul>
      </Card>
    );

  return (
    <div className="grid gap-10">
      <AppNav locale={locale} currentPath={currentPath} />
      {children({ ...state, creator: state.creator })}
    </div>
  );
}
