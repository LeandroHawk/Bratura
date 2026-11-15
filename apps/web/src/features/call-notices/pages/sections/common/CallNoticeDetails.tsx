'use client';

import type { SavedCallNotice } from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice/mutation';
import type {
  CallNoticeWithMatch,
  MatchRequirement,
  MatchRequirementStatus,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, Button, ButtonLink, Checkbox, Dialog, Heading, type BadgeTone } from '@bratura/ui';
import type { ReactNode } from 'react';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { ROUTES } from '@/features/common/config/routes';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { setSavedCallNotice } from '@/features/common/data/demoStore';
import { formattedAmountInCents, formattedDayOfInstant } from '@/features/common/utils/format';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { CLASSIFICATION_TONE, STATUS_TONE } from './CallNoticeCard';
import { artFormName, askedText, justificationText, locationText } from './callNoticeTexts';
import { CALL_NOTICES_CONTENT } from './content';
import { callNoticeStatus } from './filtering';

const REQUIREMENT_TONE: Record<MatchRequirementStatus, BadgeTone> = {
  met: 'open',
  notMet: 'missing',
  needsConfirmation: 'soon',
};

const LINK = 'rounded-sm font-semibold underline underline-offset-4 focus-ring';

function guidanceText(requirement: MatchRequirement, locale: Locale) {
  const { guidance } = CALL_NOTICES_CONTENT[locale].details;
  if (requirement.status === 'met') return null;
  if (requirement.kind === 'residence') return guidance.residence;
  if (requirement.kind === 'applicantType') return guidance.applicantType;
  if (requirement.kind === 'artForm')
    return requirement.status === 'notMet' ? guidance.artForm : guidance.artFormToConfirm;
  return requirement.documentKind === null
    ? guidance.documentToConfirm
    : guidance.documentMissing(CREATOR_LABELS[locale].documentKind[requirement.documentKind]);
}

/**
 * Everything about one call, in a dialog: what it is, how it fits the portfolio requirement by
 * requirement, what the application needs, and the reminders.
 */
export function CallNoticeDetails({
  locale,
  callNotice,
  saved,
  onClose,
}: {
  locale: Locale;
  callNotice: CallNoticeWithMatch;
  /** `null` while the call is not saved. */
  saved: SavedCallNotice | null;
  onClose: () => void;
}) {
  const content = CALL_NOTICES_CONTENT[locale];
  const copy = content.details;
  const { notInformed } = CREATOR_LABELS[locale];
  const { match, extraction, registrationOpens, registrationCloses, callNoticeId } = callNotice;
  const status = callNoticeStatus(callNotice);
  const documents = match?.requirements.filter((requirement) => requirement.kind === 'document');
  const day = (instant: { at: number } | null) =>
    instant && formattedDayOfInstant(instant.at, locale);

  const about: [string, ReactNode][] = [
    [content.card.organizer, callNotice.organizer],
    [copy.summary, callNotice.summary],
    [
      copy.opportunityKind,
      callNotice.opportunityKind && content.opportunityKind[callNotice.opportunityKind],
    ],
    [
      copy.artForms,
      extraction?.artForms.map((artForm) => artFormName(artForm.value, locale)).join(', '),
    ],
    [content.card.location, locationText(callNotice, locale)],
    [
      copy.applicantTypes,
      extraction?.applicantTypes?.value.map((type) => content.applicantType[type]).join(', '),
    ],
    [
      copy.totalBudget,
      extraction?.totalBudget &&
        formattedAmountInCents(extraction.totalBudget.amountInCents, locale),
    ],
    [
      copy.amountPerProject,
      extraction?.amountsPerProject
        .map(
          (amount) => `${amount.category}: ${formattedAmountInCents(amount.amountInCents, locale)}`,
        )
        .join('; '),
    ],
    [content.card.published, formattedDayOfInstant(callNotice.firstSeenAt, locale)],
    [content.card.opens, day(registrationOpens)],
    [content.card.closes, day(registrationCloses)],
    [
      copy.criteria,
      extraction?.evaluationCriteria.map((criterion) => criterion.criterion).join('; '),
    ],
    [copy.lastUpdated, formattedDayOfInstant(callNotice.lastSeenAt, locale)],
  ];

  const setSaved = (change: Partial<SavedCallNotice> | null) =>
    setSavedCallNotice(
      callNoticeId,
      change === null
        ? null
        : {
            callNoticeId,
            remindersOn: false,
            notifiesByEmail: false,
            notifiesByWhatsApp: false,
            ...saved,
            ...change,
          },
    );

  const documentList = (title: string, wanted: boolean) => {
    const listed = documents?.filter((document) => (document.status === 'met') === wanted) ?? [];
    return (
      <div className="grid content-start gap-1.5">
        <h4 className="font-display font-bold">{title}</h4>
        {listed.length === 0 ? (
          <p className="text-small text-muted-foreground">{copy.documentsNone}</p>
        ) : (
          <ul className="grid gap-1 text-small">
            {listed.map((document) => (
              <li key={document.asked}>
                <span aria-hidden="true">{wanted ? '✓ ' : '○ '}</span>
                {document.asked}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <Dialog open onClose={onClose} title={callNotice.title} closeLabel={copy.close}>
      <div className="grid gap-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[status]}>{content.status[status]}</Badge>
          {match ? (
            <Badge tone={CLASSIFICATION_TONE[match.classification]}>
              {content.classification[match.classification]}
            </Badge>
          ) : (
            <span className="text-small text-muted-foreground">{content.notAnalyzed}</span>
          )}
        </div>

        <section className="grid gap-3">
          <Heading as="h3" size="item">
            {copy.aboutTitle}
          </Heading>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {about.map(([label, value]) => (
              <div key={label} className={label === copy.summary ? 'sm:col-span-2' : ''}>
                <dt className="text-caption font-semibold text-muted-foreground">{label}</dt>
                <dd>{value || <span className="text-muted-foreground">{notInformed}</span>}</dd>
              </div>
            ))}
          </dl>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-small">
            <li>
              <a href={callNotice.officialUrl} target="_blank" rel="noreferrer" className={LINK}>
                {content.card.officialSource}
                <NewTabHint locale={locale} />
              </a>
            </li>
            {callNotice.documentUrls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className={LINK}>
                  {copy.originalDocument}
                  <NewTabHint locale={locale} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-3">
          <div className="grid gap-1">
            <Heading as="h3" size="item">
              {copy.eligibilityTitle}
            </Heading>
            <p className="text-small text-muted-foreground">
              {copy.eligibilityLead}{' '}
              {match && copy.analyzedOn(formattedDayOfInstant(match.analyzedAt, locale))}
            </p>
          </div>
          <p>{justificationText(callNotice, locale)}</p>
          {match && (
            <ul className="divide-y divide-border border-y border-border">
              {match.requirements.map((requirement) => {
                const guidance = guidanceText(requirement, locale);
                return (
                  <li
                    key={`${requirement.kind}-${requirement.asked}`}
                    className="grid gap-1.5 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={REQUIREMENT_TONE[requirement.status]}>
                        {copy.requirementStatus[requirement.status]}
                      </Badge>
                      <p className="font-semibold">
                        {copy.requirementKind[requirement.kind]}: {askedText(requirement, locale)}
                      </p>
                    </div>
                    <p className="text-small text-muted-foreground">
                      {copy.quoteLabel} <q lang="pt-BR">{requirement.quote}</q>
                    </p>
                    {guidance && <p className="text-small">{guidance}</p>}
                  </li>
                );
              })}
            </ul>
          )}
          <div>
            <ButtonLink
              size="sm"
              variant="ghost"
              href={`${localizedPathFromLocale(locale, ROUTES.portfolio)}#${PORTFOLIO_SECTION_IDS.documents}`}
            >
              {copy.updatePortfolio}
            </ButtonLink>
          </div>
        </section>

        <section className="grid gap-3">
          <Heading as="h3" size="item">
            {copy.preparationTitle}
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            {documentList(copy.documentsAvailable, true)}
            {documentList(copy.documentsPending, false)}
          </div>
          <p>
            <span className="font-semibold">{copy.deadline}:</span>{' '}
            {day(registrationCloses) ?? notInformed}
          </p>
          <div className="grid justify-items-start gap-2 rounded-2xl border border-dashed border-muted-foreground p-4">
            <h4 className="font-display font-bold">{copy.aiTitle}</h4>
            <p id={`${callNoticeId}-ai`} className="text-small text-muted-foreground">
              {copy.aiLead}
            </p>
            <Button size="sm" variant="ghost" disabled aria-describedby={`${callNoticeId}-ai`}>
              {copy.generateMaterial}
            </Button>
          </div>
          <div>
            <ButtonLink size="sm" href={callNotice.officialUrl} target="_blank" rel="noreferrer">
              {copy.officialPage}
              <NewTabHint locale={locale} />
            </ButtonLink>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="grid gap-1">
            <Heading as="h3" size="item">
              {copy.alertsTitle}
            </Heading>
            <p className="text-small text-muted-foreground">{copy.alertsLead}</p>
          </div>
          <div className="grid gap-2">
            <Checkbox
              checked={saved !== null}
              onChange={(event) => setSaved(event.target.checked ? {} : null)}
            >
              {copy.saveCall}
            </Checkbox>
            <Checkbox
              checked={saved?.remindersOn ?? false}
              onChange={(event) => setSaved({ remindersOn: event.target.checked })}
            >
              {copy.reminders}
            </Checkbox>
            <Checkbox
              checked={saved?.notifiesByEmail ?? false}
              onChange={(event) => setSaved({ notifiesByEmail: event.target.checked })}
            >
              {copy.byEmail}
            </Checkbox>
            <Checkbox
              checked={saved?.notifiesByWhatsApp ?? false}
              onChange={(event) => setSaved({ notifiesByWhatsApp: event.target.checked })}
            >
              {copy.byWhatsApp}
            </Checkbox>
          </div>
        </section>
      </div>
    </Dialog>
  );
}
