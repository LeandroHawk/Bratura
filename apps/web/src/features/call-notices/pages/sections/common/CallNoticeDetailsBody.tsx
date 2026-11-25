import type {
  CallNoticeDetails as CallNoticeDetailsData,
  MatchRequirementCheck,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import type { MatchCheckStatus } from '@bratura/shared/entities/match/enums/check-status/enum';
import { PortfolioDocumentKindEnum } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, ButtonLink, Heading, type BadgeTone } from '@bratura/ui';
import type { ReactNode } from 'react';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { ROUTES } from '@/features/common/config/routes';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedDayOfInstant } from '@bratura/shared/primitives/code/calendar/format';
import { formattedAmountInCents } from '@/features/common/utils/format';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import {
  artFormName,
  CALL_NOTICE_LANGUAGE,
  callNoticeStatus,
  CLASSIFICATION_TONE,
  closeText,
  STATUS_TONE,
} from './callNoticeTexts';
import { CALL_NOTICES_CONTENT } from './content';

const CHECK_TONE: Record<MatchCheckStatus, BadgeTone> = {
  met: 'open',
  notMet: 'missing',
  needsConfirmation: 'soon',
};

const LINK = 'rounded-sm font-semibold underline underline-offset-4 focus-ring';

/** The call's own words, marked as a quotation in the call's language. */
function Quote({ locale, children }: { locale: Locale; children: string }) {
  return (
    <p className="text-small text-muted-foreground">
      {CALL_NOTICES_CONTENT[locale].details.quoteLabel}{' '}
      <q lang={CALL_NOTICE_LANGUAGE}>{children}</q>
    </p>
  );
}

export function DetailsSection({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <Heading as="h3" size="item">
          {title}
        </Heading>
        {lead && <p className="text-small text-muted-foreground">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

const CHECK_LIST = 'divide-y divide-border border-y border-border';

/** The papers of one stage: what the call asks, its passage, and how the portfolio stands. */
function RequirementList({
  locale,
  title,
  lead,
  requirements,
}: {
  locale: Locale;
  title: string;
  lead?: string;
  requirements: MatchRequirementCheck[];
}) {
  const copy = CALL_NOTICES_CONTENT[locale].details;
  const { documentKind } = CREATOR_LABELS[locale];
  return (
    <div className="grid gap-2">
      <h4 className="font-display font-bold">{title}</h4>
      {lead && <p className="text-small text-muted-foreground">{lead}</p>}
      {requirements.length === 0 ? (
        <p className="text-small text-muted-foreground">{copy.listNone}</p>
      ) : (
        <ul className={CHECK_LIST}>
          {requirements.map((requirement, index) => {
            const kind = PortfolioDocumentKindEnum.safeParse(requirement.kind);
            const validity =
              requirement.paperValidity && copy.paperValidity[requirement.paperValidity];
            return (
              <li key={`${requirement.kind}-${index}`} className="grid gap-1.5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={CHECK_TONE[requirement.status]}>
                    {copy.paperStatus[requirement.status]}
                  </Badge>
                  <p className="font-semibold">
                    {kind.success && kind.data !== 'other' && `${documentKind[kind.data]}: `}
                    <span lang={CALL_NOTICE_LANGUAGE}>{requirement.detail}</span>
                  </p>
                </div>
                <Quote locale={locale}>{requirement.quote}</Quote>
                {validity && <p className="text-small">{validity}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * What the details show once the server answered: the call, the fit item by item with the call's
 * passage, and its links. A call whose documents were not read shows its official link alone.
 */
export function CallNoticeDetailsBody({
  locale,
  details,
}: {
  locale: Locale;
  details: CallNoticeDetailsData;
}) {
  const content = CALL_NOTICES_CONTENT[locale];
  const copy = content.details;
  const labels = CREATOR_LABELS[locale];
  const { extraction, matchChecks, classification } = details;
  const status = callNoticeStatus(details);
  const notInformed = <span className="text-muted-foreground">{labels.notInformed}</span>;
  const quoted = (text: string) => <span lang={CALL_NOTICE_LANGUAGE}>{text}</span>;

  const about: [label: string, value: ReactNode, wide?: boolean][] = [
    [content.card.organizer, quoted(details.organizer)],
    [
      content.card.opens,
      details.registrationOpens && formattedDayOfInstant(details.registrationOpens.at, locale),
    ],
    [copy.deadline, closeText(details, locale)],
    [copy.lastUpdated, formattedDayOfInstant(details.lastSeenAt, locale)],
    [copy.summary, details.summary && quoted(details.summary), true],
  ];
  if (extraction)
    about.push(
      [
        copy.totalBudget,
        extraction.totalBudget &&
          formattedAmountInCents(extraction.totalBudget.amountInCents, locale),
      ],
      [
        copy.artForms,
        extraction.artForms.map(({ value }) => artFormName(value, locale)).join(', '),
      ],
      [
        copy.applicantTypes,
        extraction.applicantTypes?.value.map((type) => labels.applicantType[type]).join(', '),
      ],
      [
        copy.residence,
        extraction.residenceRequirement && quoted(extraction.residenceRequirement.value),
      ],
    );

  const labelByUrl = new Map(details.documentLabels?.map(({ url, label }) => [url, label]));
  const requirementsOf = (afterSelection: boolean) =>
    (matchChecks?.requirements ?? []).filter(
      ({ stage }) => (stage === 'afterSelection') === afterSelection,
    );

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[status]}>{content.status[status]}</Badge>
        {classification ? (
          <Badge tone={CLASSIFICATION_TONE[classification]}>
            {content.classification[classification]}
          </Badge>
        ) : (
          <span className="text-small text-muted-foreground">{content.notAnalyzed}</span>
        )}
      </div>

      <DetailsSection title={copy.aboutTitle}>
        {details.resultPosted && <p>{copy.resultPosted}</p>}
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {about.map(([label, value, wide]) => (
            <div key={label} className={wide ? 'sm:col-span-2' : ''}>
              <dt className="text-caption font-semibold text-muted-foreground">{label}</dt>
              <dd>{value || notInformed}</dd>
            </div>
          ))}
        </dl>
        {extraction && extraction.amountsPerProject.length > 0 && (
          <div className="grid gap-2">
            <h4 className="font-display font-bold">{copy.amountPerProject}</h4>
            <ul className={CHECK_LIST}>
              {extraction.amountsPerProject.map((amount, index) => (
                <li key={`amount-${index}`} className="grid gap-1 py-3">
                  <p>
                    <span className="font-semibold">
                      {formattedAmountInCents(amount.amountInCents, locale)}
                    </span>{' '}
                    · {quoted(amount.category)}
                  </p>
                  <Quote locale={locale}>{amount.quote}</Quote>
                </li>
              ))}
            </ul>
          </div>
        )}
        {extraction?.totalBudget && <Quote locale={locale}>{extraction.totalBudget.quote}</Quote>}
        {extraction === null && <p>{copy.notRead}</p>}
      </DetailsSection>

      {extraction && matchChecks === null && <p>{copy.notCreatorCall}</p>}

      {matchChecks && (
        <DetailsSection title={copy.eligibilityTitle} lead={copy.eligibilityLead}>
          {matchChecks.applicantType && (
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={CHECK_TONE[matchChecks.applicantType.status]}>
                  {copy.checkStatus[matchChecks.applicantType.status]}
                </Badge>
                <p className="font-semibold">{copy.applicantTypeTitle}</p>
              </div>
              <Quote locale={locale}>{matchChecks.applicantType.quote}</Quote>
              {matchChecks.applicantType.status !== 'met' && (
                <p className="text-small">{copy.applicantTypeToConfirm}</p>
              )}
            </div>
          )}
          {matchChecks.residence && (
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={CHECK_TONE[matchChecks.residence.status]}>
                  {copy.checkStatus[matchChecks.residence.status]}
                </Badge>
                <p className="font-semibold">{copy.residence}</p>
              </div>
              <Quote locale={locale}>{matchChecks.residence.quote}</Quote>
            </div>
          )}
          {matchChecks.artFormStatus && matchChecks.artFormStatus !== 'met' && (
            <p className="text-small">{copy.artFormToConfirm}</p>
          )}
          <RequirementList
            locale={locale}
            title={copy.toApplyTitle}
            requirements={requirementsOf(false)}
          />
          <RequirementList
            locale={locale}
            title={copy.afterSelectionTitle}
            lead={copy.afterSelectionLead}
            requirements={requirementsOf(true)}
          />
          {matchChecks.eligibilityRules.length > 0 && (
            <div className="grid gap-2">
              <h4 className="font-display font-bold">{copy.rulesTitle}</h4>
              <ul className={CHECK_LIST}>
                {matchChecks.eligibilityRules.map((rule, index) => (
                  <li key={`${rule.kind}-${index}`} className="grid gap-1.5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={CHECK_TONE[rule.status]}>{copy.checkStatus[rule.status]}</Badge>
                      <p className="font-semibold">
                        {content.eligibilityRuleKind[rule.kind]}: {quoted(rule.detail)}
                      </p>
                    </div>
                    <Quote locale={locale}>{rule.quote}</Quote>
                  </li>
                ))}
              </ul>
            </div>
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
        </DetailsSection>
      )}

      {extraction && extraction.quotas.length > 0 && (
        <DetailsSection title={copy.quotasTitle} lead={copy.quotasLead}>
          <ul className={CHECK_LIST}>
            {extraction.quotas.map((quota, index) => (
              <li key={`${quota.group}-${index}`} className="grid gap-1 py-3">
                <p className="font-semibold">
                  {content.quotaGroup[quota.group]}
                  {quota.share && (
                    <>
                      {' · '}
                      {copy.quotaShare}: {quoted(quota.share)}
                    </>
                  )}
                </p>
                <Quote locale={locale}>{quota.quote}</Quote>
              </li>
            ))}
          </ul>
        </DetailsSection>
      )}

      {extraction && extraction.evaluationCriteria.length > 0 && (
        <DetailsSection title={copy.criteria}>
          <ul className={CHECK_LIST}>
            {extraction.evaluationCriteria.map((criterion, index) => (
              <li key={`criterion-${index}`} className="grid gap-1 py-3">
                <p>
                  {quoted(criterion.criterion)}
                  {criterion.maxPoints !== null && ` · ${copy.maxPoints(criterion.maxPoints)}`}
                </p>
                <Quote locale={locale}>{criterion.quote}</Quote>
              </li>
            ))}
          </ul>
        </DetailsSection>
      )}

      <DetailsSection title={copy.annexesTitle}>
        {extraction && details.documentUrls.length > 0 && (
          <ul className="grid gap-1 text-small">
            {details.documentUrls.map((url, index) => {
              const label = labelByUrl.get(url);
              return (
                <li key={`annex-${index}`}>
                  <a href={url} target="_blank" rel="noreferrer" className={LINK}>
                    {label ? quoted(label) : copy.annex(index + 1)}
                    <NewTabHint locale={locale} />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <div className="grid justify-items-start gap-2 rounded-2xl border border-dashed border-muted-foreground p-4">
          <h4 className="font-display font-bold">{copy.aiTitle}</h4>
          <p className="text-small text-muted-foreground">{copy.aiLead}</p>
        </div>
        <div>
          <ButtonLink size="sm" href={details.officialUrl} target="_blank" rel="noreferrer">
            {copy.officialPage}
            <NewTabHint locale={locale} />
          </ButtonLink>
        </div>
      </DetailsSection>
    </div>
  );
}
