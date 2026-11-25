import type {
  CallNoticeDetails as CallNoticeDetailsData,
  MatchRequirementCheck,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import type { MatchCheckStatus } from '@bratura/shared/entities/match/enums/check-status/enum';
import { PortfolioDocumentKindEnum } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, ButtonLink, Collapse } from '@bratura/ui';
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
import { passCheckoutUrlFor } from './passCheckoutUrl';

const LINK = 'rounded-sm font-semibold underline underline-offset-4 focus-ring';

/** A list of the details: items split by the sand's hairline. */
const CHECK_LIST = 'divide-y divide-sand-edge border-y border-sand-edge';

/** The order a creator acts on: what is missing, what to check, what is already fine. */
const STATUS_ORDER = ['notMet', 'needsConfirmation', 'met'] as const satisfies MatchCheckStatus[];

const STATUS_DOT: Record<MatchCheckStatus, string> = {
  met: 'bg-status-open',
  notMet: 'bg-status-missing',
  needsConfirmation: 'bg-muted-foreground',
};

/** The status's colour beside its words; the words carry the status, the dot only colours it. */
function StatusDot({ status }: { status: MatchCheckStatus }) {
  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ${STATUS_DOT[status]}`}
      aria-hidden="true"
    />
  );
}

/** The call's own words, behind a disclosure so the list reads as items, in the call's language. */
function Quote({ locale, children }: { locale: Locale; children: string }) {
  return (
    <details className="text-caption text-sand-ink">
      <summary className="w-fit cursor-pointer rounded-sm underline underline-offset-4 focus-ring">
        {CALL_NOTICES_CONTENT[locale].details.quoteToggle}
      </summary>
      <p className="mt-1.5 border-l-2 border-sand-edge pl-3 text-small text-muted-foreground">
        <q lang={CALL_NOTICE_LANGUAGE}>{children}</q>
      </p>
    </details>
  );
}

/** One thing the call asks: a short name, the call's own wording under it, and its passage. */
type CheckItem = {
  status: MatchCheckStatus;
  title: ReactNode;
  detail?: string;
  note?: string | false | null;
  quote: string;
};

/**
 * Items grouped by status, each group named once instead of a badge on every line, so a long list
 * reads as "what is missing, what to check, what is fine". Empty groups are left out.
 */
function CheckGroups({
  locale,
  items,
  statusLabel,
}: {
  locale: Locale;
  items: CheckItem[];
  statusLabel: Record<MatchCheckStatus, string>;
}) {
  return (
    <div className="grid gap-5">
      {STATUS_ORDER.map((status) => {
        const group = items.filter((item) => item.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status} className="grid gap-1">
            <h4 className="flex items-center gap-2 font-display font-bold text-sand-ink">
              <StatusDot status={status} />
              {statusLabel[status]}
              <span className="font-body font-normal">({group.length})</span>
            </h4>
            <ul className={CHECK_LIST}>
              {group.map((item, index) => (
                <li key={`${status}-${index}`} className="grid gap-1 py-3">
                  <p className="font-semibold">{item.title}</p>
                  {item.detail && (
                    <p className="text-small text-muted-foreground" lang={CALL_NOTICE_LANGUAGE}>
                      {item.detail}
                    </p>
                  )}
                  {item.note && <p className="text-small">{item.note}</p>}
                  <Quote locale={locale}>{item.quote}</Quote>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** A document the call asks, named by its kind when we know it, the call's wording under it. */
function documentItem(locale: Locale, requirement: MatchRequirementCheck): CheckItem {
  const copy = CALL_NOTICES_CONTENT[locale].details;
  const kind = PortfolioDocumentKindEnum.safeParse(requirement.kind);
  const named = kind.success && kind.data !== 'other';
  return {
    status: requirement.status,
    title: named ? (
      CREATOR_LABELS[locale].documentKind[kind.data]
    ) : (
      <span lang={CALL_NOTICE_LANGUAGE}>{requirement.detail}</span>
    ),
    detail: named ? requirement.detail : undefined,
    note: requirement.paperValidity && copy.paperValidity[requirement.paperValidity],
    quote: requirement.quote,
  };
}

/**
 * What the details show once the server answered: a summary card on top, then drawers for the
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
  const content = CALL_NOTICES_CONTENT[locale];
  const copy = content.details;
  const labels = CREATOR_LABELS[locale];
  const { extraction, matchChecks, classification } = details;
  const status = callNoticeStatus(details);
  const passUrl = passCheckoutUrlFor(classification);
  const notInformed = <span className="text-muted-foreground">{labels.notInformed}</span>;
  const quoted = (text: string) => <span lang={CALL_NOTICE_LANGUAGE}>{text}</span>;

  const amount = details.largestAmountPerProjectInCents;
  const keyFacts: [label: string, value: ReactNode][] = [
    [copy.deadline, closeText(details, locale)],
    [content.card.amount, amount !== null && formattedAmountInCents(amount, locale)],
  ];

  const about: [label: string, value: ReactNode, wide?: boolean][] = [
    [
      content.card.opens,
      details.registrationOpens && formattedDayOfInstant(details.registrationOpens.at, locale),
    ],
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
  const toApply = requirementsOf(false);
  const afterSelection = requirementsOf(true);
  const tally = (checkStatus: MatchCheckStatus) =>
    toApply.filter((requirement) => requirement.status === checkStatus).length;
  const held = tally('met');

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
      quote: matchChecks.residence.quote,
    });
  for (const rule of matchChecks?.eligibilityRules ?? [])
    whoCanApply.push({
      status: rule.status,
      title: content.eligibilityRuleKind[rule.kind],
      detail: rule.detail,
      quote: rule.quote,
    });

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-2xl border border-sand-edge bg-card p-5 shadow-lifted">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[status]} variant="dot">
              {content.status[status]}
            </Badge>
            {classification ? (
              <Badge tone={CLASSIFICATION_TONE[classification]}>
                {content.classification[classification]}
              </Badge>
            ) : (
              <span className="text-small text-muted-foreground">{content.notAnalyzed}</span>
            )}
          </div>
          <p className="text-small text-muted-foreground">
            {content.card.organizer}: {quoted(details.organizer)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {keyFacts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-caption font-semibold text-sand-ink">{label}</dt>
              <dd className="font-semibold">{value || notInformed}</dd>
            </div>
          ))}
        </dl>
        {matchChecks && toApply.length > 0 && (
          <div className="grid gap-2 border-t border-sand-edge pt-4 text-small">
            <p className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span>{copy.toApplyTitle}</span>
              <span className="font-semibold">{copy.portfolioHas(held, toApply.length)}</span>
            </p>
            {/* The line above already says how many; the bar is decoration. */}
            <span className="h-2 overflow-hidden rounded-full bg-sand-edge" aria-hidden="true">
              <span
                className="block h-full rounded-full bg-status-open"
                style={{ width: `${(held / toApply.length) * 100}%` }}
              />
            </span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {STATUS_ORDER.map((checkStatus) => (
                <li key={checkStatus} className="flex items-center gap-1.5">
                  <StatusDot status={checkStatus} />
                  {copy.paperStatus[checkStatus]}: {tally(checkStatus)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Where the creator applies; secondary beside the pass, the paid way to prepare it. */}
        <div className="grid gap-1.5">
          <div className="flex flex-wrap gap-2">
            {passUrl && (
              <ButtonLink size="sm" href={passUrl} target="_blank" rel="noreferrer">
                {copy.passCta}
                <NewTabHint locale={locale} />
              </ButtonLink>
            )}
            <ButtonLink
              size="sm"
              variant={passUrl ? 'ghost' : 'primary'}
              href={details.officialUrl}
              target="_blank"
              rel="noreferrer"
            >
              {copy.officialPage}
              <NewTabHint locale={locale} />
            </ButtonLink>
          </div>
          {passUrl && <p className="text-caption text-muted-foreground">{copy.passDetailsNote}</p>}
        </div>
      </div>

      <Collapse title={copy.aboutTitle}>
        {details.resultPosted && <p>{copy.resultPosted}</p>}
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {about.map(([label, value, wide]) => (
            <div key={label} className={wide ? 'sm:col-span-2' : ''}>
              <dt className="text-caption font-semibold text-sand-ink">{label}</dt>
              <dd>{value || notInformed}</dd>
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
                    {quoted(amountOfCategory.category)}
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
                items={toApply.map((requirement) => documentItem(locale, requirement))}
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
                items={afterSelection.map((requirement) => documentItem(locale, requirement))}
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
                <p className="font-semibold">{content.quotaGroup[quota.group]}</p>
                {quota.share && (
                  <p className="text-small text-muted-foreground">
                    {copy.quotaShare}: {quoted(quota.share)}
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
                <p className="font-semibold">{quoted(criterion.criterion)}</p>
                {criterion.maxPoints !== null && (
                  <p className="text-small text-muted-foreground">
                    {copy.maxPoints(criterion.maxPoints)}
                  </p>
                )}
                <Quote locale={locale}>{criterion.quote}</Quote>
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
                  <a href={url} target="_blank" rel="noreferrer" className={LINK}>
                    {label ? quoted(label) : copy.annex(index + 1)}
                    <NewTabHint locale={locale} />
                  </a>
                </li>
              );
            })}
          </ul>
        </Collapse>
      )}
    </div>
  );
}
