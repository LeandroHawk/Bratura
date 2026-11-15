import type { CallNoticeWithMatch } from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';

/** Where a call's registration stands, as the screens name it. */
export type CallNoticeStatus = 'open' | 'closingSoon' | 'closed' | 'notInformed';

export function callNoticeStatus({
  deadline,
  closesSoon,
}: Pick<CallNoticeWithMatch, 'deadline' | 'closesSoon'>): CallNoticeStatus {
  if (deadline === 'notInformed') return 'notInformed';
  if (deadline === 'closed') return 'closed';
  return closesSoon ? 'closingSoon' : 'open';
}

/** The largest amount a call gives one project, in cents; `null` when it gives none. */
export function largestAmountInCents({ extraction }: Pick<CallNoticeWithMatch, 'extraction'>) {
  const amounts = [
    ...(extraction?.amountsPerProject.map((amount) => amount.amountInCents) ?? []),
    ...(extraction?.totalBudget ? [extraction.totalBudget.amountInCents] : []),
  ];
  return amounts.length > 0 ? Math.max(...amounts) : null;
}

/** A call seen for the first time this many days ago or fewer is new. */
export const NEW_CALL_NOTICE_WITHIN_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function isNewCallNotice(
  { firstSeenAt }: Pick<CallNoticeWithMatch, 'firstSeenAt'>,
  now: number,
) {
  return now - firstSeenAt <= NEW_CALL_NOTICE_WITHIN_DAYS * DAY_IN_MS;
}

export const CALL_NOTICE_SORTS = [
  'bestMatch',
  'closestDeadline',
  'largestAmount',
  'newest',
  'alphabetical',
] as const;
export type CallNoticeSort = (typeof CALL_NOTICE_SORTS)[number];

/** The filters as the controls hold them: `''` is "any". */
export type CallNoticeFilterValues = Record<
  | 'search'
  | 'classification'
  | 'culturalArea'
  | 'opportunityKind'
  | 'status'
  | 'state'
  | 'city'
  | 'coverage'
  | 'applicantType'
  | 'amount'
  | 'closesWithinDays',
  string
> & { sort: CallNoticeSort; onlySaved: boolean };

export const emptyCallNoticeFilters: Omit<CallNoticeFilterValues, 'sort'> = {
  search: '',
  classification: '',
  culturalArea: '',
  opportunityKind: '',
  status: '',
  state: '',
  city: '',
  coverage: '',
  applicantType: '',
  amount: '',
  closesWithinDays: '',
  onlySaved: false,
};

/** Lowercase and without accents, so "sao joao" finds "São João". */
function foldedText(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const CLASSIFICATION_ORDER = { eligible: 0, almostEligible: 1, notEligible: 2 };

// A call without the value sorted by goes last, whatever the direction.
function comparedWithNullsLast(a: number | null, b: number | null, direction: 1 | -1) {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return (a - b) * direction;
}

const COMPARE: Record<CallNoticeSort, (a: CallNoticeWithMatch, b: CallNoticeWithMatch) => number> =
  {
    bestMatch: (a, b) =>
      comparedWithNullsLast(
        a.match && CLASSIFICATION_ORDER[a.match.classification],
        b.match && CLASSIFICATION_ORDER[b.match.classification],
        1,
      ),
    closestDeadline: (a, b) =>
      // A closed call is not a deadline to meet: after the ones still open.
      Number(a.deadline === 'closed') - Number(b.deadline === 'closed') ||
      comparedWithNullsLast(a.registrationCloses?.at ?? null, b.registrationCloses?.at ?? null, 1),
    largestAmount: (a, b) =>
      comparedWithNullsLast(largestAmountInCents(a), largestAmountInCents(b), -1),
    newest: (a, b) => b.firstSeenAt - a.firstSeenAt,
    alphabetical: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
  };

/** The calls the filters keep, in the chosen order. */
export function filteredCallNotices(
  callNotices: CallNoticeWithMatch[],
  filters: CallNoticeFilterValues,
  savedIds: ReadonlySet<string>,
  now: number,
): CallNoticeWithMatch[] {
  const search = foldedText(filters.search.trim());
  const city = foldedText(filters.city.trim());
  const closesBefore =
    filters.closesWithinDays === '' ? null : now + Number(filters.closesWithinDays) * DAY_IN_MS;

  return callNotices
    .filter((callNotice) => {
      const { extraction } = callNotice;
      const amount = largestAmountInCents(callNotice);
      return (
        (!filters.onlySaved || savedIds.has(callNotice.callNoticeId)) &&
        (search === '' ||
          foldedText(
            [callNotice.title, callNotice.organizer, callNotice.summary].join(' '),
          ).includes(search)) &&
        (filters.classification === '' ||
          callNotice.match?.classification === filters.classification) &&
        (filters.culturalArea === '' ||
          extraction?.artForms.some(
            (artForm) => artForm.value === 'any' || artForm.value === filters.culturalArea,
          ) === true) &&
        (filters.opportunityKind === '' ||
          callNotice.opportunityKind === filters.opportunityKind) &&
        (filters.status === '' || callNoticeStatus(callNotice) === filters.status) &&
        (filters.state === '' || callNotice.state === filters.state) &&
        (city === '' || foldedText(callNotice.city ?? '').includes(city)) &&
        (filters.coverage === '' || callNotice.coverage === filters.coverage) &&
        (filters.applicantType === '' ||
          extraction?.applicantTypes?.value.some((type) => type === filters.applicantType) ===
            true) &&
        (filters.amount === '' || (filters.amount === 'informed') === (amount !== null)) &&
        (closesBefore === null ||
          (callNotice.deadline !== 'closed' &&
            callNotice.registrationCloses !== null &&
            callNotice.registrationCloses.at <= closesBefore))
      );
    })
    .toSorted(COMPARE[filters.sort]);
}
