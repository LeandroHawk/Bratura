import { api } from '@bratura/backend/api';
import {
  CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema,
  type CallNoticeHighlight,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-highlights/query';
import { registrationCloseDateText } from '@bratura/shared/messages/user-notification/deadline';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Heading } from '@bratura/ui';
import { fetchQuery } from 'convex/nextjs';
import { unstable_cache } from 'next/cache';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { ROUTES } from '@/features/common/config/routes';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { CALL_HIGHLIGHTS_CONTENT } from './content';

/** Seconds the landing keeps its highlights; the page's `revalidate` must be the same number. */
export const CALL_HIGHLIGHTS_REVALIDATE_SECONDS = 300;

// `fetchQuery` asks for no cache; the cache keeps the landing static, the calls in its HTML.
const cachedCallNoticeHighlights = unstable_cache(
  async () =>
    CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema.parse(
      await fetchQuery(api.matching.callNoticeHighlights, {}),
    ),
  ['call-notice-highlights'],
  { revalidate: CALL_HIGHLIGHTS_REVALIDATE_SECONDS },
);

/** The highlights, or `null` where no backend is configured or it does not answer. */
async function callNoticeHighlights(): Promise<CallNoticeHighlight[] | null> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return null;
  return cachedCallNoticeHighlights().catch(() => null);
}

function HighlightList({ locale, calls }: { locale: Locale; calls: CallNoticeHighlight[] }) {
  const copy = CALL_HIGHLIGHTS_CONTENT[locale];
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

export async function CallHighlights({ locale }: { locale: Locale }) {
  const copy = CALL_HIGHLIGHTS_CONTENT[locale];
  const calls = await callNoticeHighlights();
  return (
    <section aria-labelledby="call-highlights-title" className="grid gap-4">
      <Heading id="call-highlights-title" size="item">
        {copy.title}
      </Heading>
      <p className="text-small text-muted-foreground">{copy.lead}</p>
      {calls === null ? (
        <p role="status">{copy.unavailable}</p>
      ) : (
        <HighlightList locale={locale} calls={calls} />
      )}
      <div>
        <ButtonLink variant="ghost" href={localizedPathFromLocale(locale, ROUTES.signIn)}>
          {copy.viewAll}
        </ButtonLink>
      </div>
    </section>
  );
}
