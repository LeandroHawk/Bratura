import type { CallNoticeDetails as CallNoticeDetailsData } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Collapse } from '@bratura/ui';
import type { ReactNode } from 'react';
import { artFormName } from '@/features/call-notices/pages/sections/common/callNoticeTexts';
import { CALL_NOTICE_LABELS } from '@/features/call-notices/pages/sections/common/content';
import { CallNoticeWords } from '@/features/call-notices/pages/sections/common/CallNoticeWords';
import { ExternalLink } from '@/features/common/components/ExternalLink';
import { NotInformed } from '@/features/common/components/NotInformed';
import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { ROUTES } from '@/features/common/config/routes';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedDayOfInstant } from '@bratura/shared/primitives/code/calendar/format';
import { formattedAmountInCents } from '@/features/common/utils/format';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { CallNoticeSummary } from './CallNoticeSummary';
import {
  CHECK_LIST,
  CheckGroups,
  checkItemFromRequirement,
  Quote,
  type CheckItem,
} from './CheckGroups';
import { CALL_NOTICE_DETAILS_CONTENT } from './content';
import { quoteRepeatsWording } from './quoteRepeatsWording';

/**
 * What the details show once the server answered: the summary card, then drawers for the
 * call, who can take part, the documents to apply and those asked if selected, each item grouped
 * by status with the call's passage. A call whose documents were not read shows its link alone.
 */
export function CallNoticeDetailsBody({
  locale,
  details,
}: {
  locale: Locale;
  details: CallNoticeDetailsData;
}) {
  const copy = CALL_NOTICE_DETAILS_CONTENT[locale];
  const callNoticeLabels = CALL_NOTICE_LABELS[locale];
  const labels = CREATOR_LABELS[locale];
  const { extraction, matchChecks } = details;

  const about: [label: string, value: ReactNode, wide?: boolean][] = [
    [
      callNoticeLabels.facts.opens,
      details.registrationOpens && formattedDayOfInstant(details.registrationOpens.at, locale),
    ],
    [copy.lastUpdated, formattedDayOfInstant(details.lastSeenAt, locale)],
    [copy.summary, details.summary && <CallNoticeWords>{details.summary}</CallNoticeWords>, true],
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
        extraction.residenceRequirement && (
          <CallNoticeWords>{extraction.residenceRequirement.value}</CallNoticeWords>
        ),
      ],
    );

  const labelByUrl = new Map(details.documentLabels?.map(({ url, label }) => [url, label]));
  const requirementsOf = (afterSelection: boolean) =>
    (matchChecks?.requirements ?? []).filter(
      ({ stage }) => (stage === 'afterSelection') === afterSelection,
    );
  const toApply = requirementsOf(false);
  const afterSelection = requirementsOf(true);

  const whoCanApply: CheckItem[] = [];
  if (matchChecks?.applicantType)
    whoCanApply.push({
      status: matchChecks.applicantType.status,
      title: copy.applicantTypeTitle,
      detail: matchChecks.applicantType.value.map((type) => labels.applicantType[type]).join(', '),
      note: matchChecks.applicantType.status !== 'met' && copy.applicantTypeToConfirm,
      quote: matchChecks.applicantType.quote,
    });
  if (matchChecks?.residence)
    whoCanApply.push({
      status: matchChecks.residence.status,
      title: copy.residence,
      detail: matchChecks.residence.value,
      wording: matchChecks.residence.value,
      quote: matchChecks.residence.quote,
    });
  for (const rule of matchChecks?.eligibilityRules ?? [])
    whoCanApply.push({
      status: rule.status,
      title: copy.eligibilityRuleKind[rule.kind],
      detail: rule.detail,
      wording: rule.detail,
      quote: rule.quote,
    });

  return (
    <div className="grid gap-5">
      <CallNoticeSummary locale={locale} details={details} toApply={toApply} />

      <Collapse title={copy.aboutTitle}>
        {details.resultPosted && <p>{copy.resultPosted}</p>}
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {about.map(([label, value, wide]) => (
            <div key={label} className={wide ? 'sm:col-span-2' : ''}>
              <dt className="text-caption font-semibold text-sand-ink">{label}</dt>
              <dd>{value || <NotInformed locale={locale} />}</dd>
            </div>
          ))}
        </dl>
        {extraction && extraction.amountsPerProject.length > 0 && (
          <div className="grid gap-1">
            <h4 className="font-display font-bold text-sand-ink">{copy.amountPerProject}</h4>
            <ul className={CHECK_LIST}>
              {extraction.amountsPerProject.map((amountOfCategory, index) => (
                <li key={`amount-${index}`} className="grid gap-1 py-3">
                  <p className="font-semibold">
                    {formattedAmountInCents(amountOfCategory.amountInCents, locale)}
                  </p>
                  <p className="text-small text-muted-foreground">
                    <CallNoticeWords>{amountOfCategory.category}</CallNoticeWords>
                  </p>
                  <Quote locale={locale}>{amountOfCategory.quote}</Quote>
                </li>
              ))}
            </ul>
          </div>
        )}
        {extraction?.totalBudget && <Quote locale={locale}>{extraction.totalBudget.quote}</Quote>}
        {extraction === null && <p>{copy.notRead}</p>}
      </Collapse>

      {extraction && matchChecks === null && <p>{copy.notCreatorCall}</p>}

      {matchChecks && (
        <>
          <Collapse title={copy.whoCanApplyTitle} count={whoCanApply.length}>
            <p className="text-small text-muted-foreground">{copy.eligibilityLead}</p>
            {matchChecks.artFormStatus && matchChecks.artFormStatus !== 'met' && (
              <p className="text-small">{copy.artFormToConfirm}</p>
            )}
            {whoCanApply.length === 0 ? (
              <p className="text-small text-muted-foreground">{copy.listNone}</p>
            ) : (
              <CheckGroups locale={locale} items={whoCanApply} statusLabel={copy.checkStatus} />
            )}
          </Collapse>

          <Collapse title={copy.toApplyTitle} count={toApply.length}>
            {toApply.length === 0 ? (
              <p className="text-small text-muted-foreground">{copy.listNone}</p>
            ) : (
              <CheckGroups
                locale={locale}
                items={toApply.map((requirement) => checkItemFromRequirement(locale, requirement))}
                statusLabel={copy.paperStatus}
              />
            )}
            <div className="grid gap-1 rounded-xl border border-dashed border-sand-edge p-3">
              <p className="font-semibold">{copy.aiTitle}</p>
              <p className="text-small text-muted-foreground">{copy.aiLead}</p>
            </div>
            <div>
              <ButtonLink
                size="sm"
                variant="ghost"
                href={`${localizedPathFromLocale(locale, ROUTES.portfolio)}#${PORTFOLIO_SECTION_IDS.documents}`}
              >
                {copy.updatePortfolio}
              </ButtonLink>
            </div>
          </Collapse>

          {afterSelection.length > 0 && (
            <Collapse title={copy.afterSelectionTitle} count={afterSelection.length}>
              <p className="text-small text-muted-foreground">{copy.afterSelectionLead}</p>
              <CheckGroups
                locale={locale}
                items={afterSelection.map((requirement) =>
                  checkItemFromRequirement(locale, requirement),
                )}
                statusLabel={copy.paperStatus}
              />
            </Collapse>
          )}
        </>
      )}

      {extraction && extraction.quotas.length > 0 && (
        <Collapse title={copy.quotasTitle} count={extraction.quotas.length}>
          <p className="text-small text-muted-foreground">{copy.quotasLead}</p>
          <ul className={CHECK_LIST}>
            {extraction.quotas.map((quota, index) => (
              <li key={`${quota.group}-${index}`} className="grid gap-1 py-3">
                <p className="font-semibold">{copy.quotaGroup[quota.group]}</p>
                {quota.share && (
                  <p className="text-small text-muted-foreground">
                    {copy.quotaShare}: <CallNoticeWords>{quota.share}</CallNoticeWords>
                  </p>
                )}
                <Quote locale={locale}>{quota.quote}</Quote>
              </li>
            ))}
          </ul>
        </Collapse>
      )}

      {extraction && extraction.evaluationCriteria.length > 0 && (
        <Collapse title={copy.criteria} count={extraction.evaluationCriteria.length}>
          <ul className={CHECK_LIST}>
            {extraction.evaluationCriteria.map((criterion, index) => (
              <li key={`criterion-${index}`} className="grid gap-1 py-3">
                <p className="font-semibold">
                  <CallNoticeWords>{criterion.criterion}</CallNoticeWords>
                </p>
                {criterion.maxPoints !== null && (
                  <p className="text-small text-muted-foreground">
                    {copy.maxPoints(criterion.maxPoints)}
                  </p>
                )}
                {!quoteRepeatsWording(criterion.criterion, criterion.quote) && (
                  <Quote locale={locale}>{criterion.quote}</Quote>
                )}
              </li>
            ))}
          </ul>
        </Collapse>
      )}

      {extraction && details.documentUrls.length > 0 && (
        <Collapse title={copy.annexesTitle} count={details.documentUrls.length}>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-6 gap-y-2 text-small">
            {details.documentUrls.map((url, index) => {
              const label = labelByUrl.get(url);
              return (
                <li key={`annex-${index}`}>
                  <ExternalLink href={url} locale={locale}>
                    {label ? <CallNoticeWords>{label}</CallNoticeWords> : copy.annex(index + 1)}
                  </ExternalLink>
                </li>
              );
            })}
          </ul>
        </Collapse>
      )}
    </div>
  );
}
