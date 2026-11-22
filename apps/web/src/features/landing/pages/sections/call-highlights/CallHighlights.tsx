'use client';

import { registrationCloseDateText } from '@bratura/shared/messages/user-notification/deadline';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Heading } from '@bratura/ui';
import { BackendData } from '@/features/common/components/BackendData';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { ROUTES } from '@/features/common/config/routes';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { CALL_HIGHLIGHTS_CONTENT } from './content';
import { useCallNoticeHighlights } from './useCallNoticeHighlights';

function HighlightList({ locale }: { locale: Locale }) {
  const copy = CALL_HIGHLIGHTS_CONTENT[locale];
  const calls = useCallNoticeHighlights();
  if (calls === null) return <p role="status">{copy.loading}</p>;
  if (calls.length === 0) return <p>{copy.empty}</p>;
  return (
    <ul className="divide-y divide-border border-y border-border">
      {calls.map((call) => (
        <li key={call.callNoticeId} className="grid gap-2 py-4">
          <h3 className="font-display text-lg font-bold" lang="pt-BR">
            {call.title}
          </h3>
          <p lang="pt-BR" className="text-small text-muted-foreground">
            {call.organizer}
          </p>
          {call.registrationCloses && (
            <p>{registrationCloseDateText(call.registrationCloses, locale)}</p>
          )}
          <a
            href={call.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm underline underline-offset-4 focus-ring"
          >
            {copy.officialPage}
            <NewTabHint locale={locale} />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CallHighlights({ locale }: { locale: Locale }) {
  const copy = CALL_HIGHLIGHTS_CONTENT[locale];
  return (
    <section aria-labelledby="call-highlights-title" className="grid gap-4">
      <Heading id="call-highlights-title" size="item">
        {copy.title}
      </Heading>
      <p className="text-small text-muted-foreground">{copy.lead}</p>
      <BackendData unavailable={<p role="status">{copy.unavailable}</p>}>
        <HighlightList locale={locale} />
      </BackendData>
      <div>
        <ButtonLink variant="ghost" href={localizedPathFromLocale(locale, ROUTES.signIn)}>
          {copy.viewAll}
        </ButtonLink>
      </div>
    </section>
  );
}
