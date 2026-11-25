import { api } from '@bratura/backend/api';
import {
  CallNoticeHighlightsQueryFromBraturaPortalReturnsSchema,
  type CallNoticeHighlight,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-highlights/query';
import { registrationCloseDateText } from '@bratura/shared/messages/user-notification/deadline';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Container, Heading } from '@bratura/ui';
import { fetchQuery } from 'convex/nextjs';
import { unstable_cache } from 'next/cache';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { CALL_NOTICE_FLAG_LABELS } from '@/features/common/content/call-notice-flags';
import { ROUTES } from '@/features/common/config/routes';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { SectionColumns } from '@/features/landing/pages/sections/common/SectionColumns';
import { SECTION_IDS } from '@/features/landing/pages/sections/common/sectionIds';
import { titleIdFromSectionId } from '@/features/landing/pages/sections/common/titleIdFromSectionId';
import { RUBBER_STAMP_CLASS_NAME } from '@/features/landing/pages/sections/common/rubberStampClassName';
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

/** The pins, one colour of the logo per scroll, in board order. */
const PIN_COLOURS = ['bg-logo-blue', 'bg-logo-yellow', 'bg-logo-green'] as const;

/**
 * The scroll's two sides, a gentle wave mirrored left and right (a 100×100 path stretched to the
 * sheet). It reaches at most 4% in, which the sheet's side padding always clears.
 */
const SCROLL_SIDES = 'M3 0 C0.5 35 5 65 2.5 100 L97.5 100 C95 65 99.5 35 97 0 Z';

/**
 * A scroll's rolled end: a pill with its curl showing at one tip. Its own element, not part of the
 * stretched sheet, so it stays round however tall the call's text makes the sheet.
 */
function Roll({ edge }: { edge: 'top' | 'bottom' }) {
  const isTop = edge === 'top';
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-x-0 h-5 rounded-full border border-border bg-card ${isTop ? 'top-0 border-b-4' : 'bottom-0 border-t-4'}`}
    >
      <span
        className={`absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-muted-foreground/50 ${isTop ? 'left-1.5' : 'right-1.5'}`}
      />
    </span>
  );
}

/** A rubber stamp from the call's own dates: closing soon wins over new. */
function Stamp({ call, locale }: { call: CallNoticeHighlight; locale: Locale }) {
  const copy = CALL_NOTICE_FLAG_LABELS[locale];
  if (!call.closesSoon && !call.isNew) return null;
  return (
    <span
      className={`${RUBBER_STAMP_CLASS_NAME} -rotate-6 ${call.closesSoon ? 'text-status-missing' : 'text-status-open'}`}
    >
      {call.closesSoon ? copy.closesSoon : copy.isNew}
    </span>
  );
}

/** The calls as scrolls pinned to the lobby's cork board: side by side from `lg` up. */
function HighlightList({ locale, calls }: { locale: Locale; calls: CallNoticeHighlight[] }) {
  const copy = CALL_HIGHLIGHTS_CONTENT[locale];
  return (
    <ul className="grid gap-10 rounded-xl border-[10px] border-wood bg-board p-5 pt-9 shadow-lifted outline-2 outline-wood-edge sm:p-8 sm:pt-11 lg:grid-cols-3 lg:gap-8">
      {calls.map((call, index) => (
        <li
          key={call.callNoticeId}
          className="relative isolate grid content-start gap-3 px-10 pt-10 pb-10"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-x-2 top-2.5 bottom-2.5 -z-10 h-[calc(100%-1.25rem)] w-[calc(100%-1rem)] overflow-visible"
          >
            {/* The sheet's shadow on the cork: the same outline, nudged down and right. */}
            <path d={SCROLL_SIDES} transform="translate(1 1.2)" className="fill-wood-shadow/35" />
            <path
              d={SCROLL_SIDES}
              className="fill-card stroke-border"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <Roll edge="top" />
          <Roll edge="bottom" />
          <span
            aria-hidden="true"
            className={`absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full border-2 border-foreground shadow-cutout ${PIN_COLOURS[index % PIN_COLOURS.length]}`}
          />
          <Stamp call={call} locale={locale} />
          <h3 className="font-display text-base leading-snug font-bold" lang="pt-BR">
            {call.title}
          </h3>
          <p lang="pt-BR" className="text-small text-muted-foreground">
            {call.organizer}
          </p>
          {call.registrationCloses && (
            <p className="text-small">
              {registrationCloseDateText(call.registrationCloses, locale)}
            </p>
          )}
          <a
            href={call.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="justify-self-start rounded-sm underline underline-offset-4 focus-ring"
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
  const intro = (
    <div className="grid content-start gap-4">
      <Heading id={titleIdFromSectionId(SECTION_IDS.callHighlights)} className="max-w-[24ch]">
        {copy.title}
      </Heading>
      <p className="max-w-[54ch] text-muted-foreground">{copy.lead}</p>
    </div>
  );
  const viewAll = (
    <ButtonLink variant="ghost" href={localizedPathFromLocale(locale, ROUTES.signIn)}>
      {copy.viewAll}
    </ButtonLink>
  );

  // No calls to show: one sentence beside the title, like the other two-column sections.
  if (calls === null || calls.length === 0)
    return (
      <SectionColumns id={SECTION_IDS.callHighlights}>
        {intro}
        <div className="grid content-start justify-items-start gap-6">
          {calls === null ? <p role="status">{copy.unavailable}</p> : <p>{copy.empty}</p>}
          {viewAll}
        </div>
      </SectionColumns>
    );

  // The calls pinned side by side from `lg` up, one under the other on a phone.
  return (
    <Container
      as="section"
      id={SECTION_IDS.callHighlights}
      aria-labelledby={titleIdFromSectionId(SECTION_IDS.callHighlights)}
      className="grid justify-items-start gap-10 py-20"
    >
      {intro}
      <div className="w-full">
        <HighlightList locale={locale} calls={calls} />
      </div>
      {viewAll}
    </Container>
  );
}
