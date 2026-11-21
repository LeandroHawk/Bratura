'use client';

import {
  CallNoticeCoverageEnum,
  OpportunityKindEnum,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-overview/query';
import { MatchClassificationEnum } from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import { ApplicantTypeEnum } from '@bratura/shared/primitives/domain/applicant-type/enum';
import { CulturalAreaEnum } from '@bratura/shared/entities/creator/enums/cultural-area/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { UfEnum } from '@bratura/shared/primitives/external/uf/enum';
import { Button, Checkbox, SelectField, TextField } from '@bratura/ui';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { UF_NAME } from '@/features/common/content/uf-names';
import { CALL_NOTICES_CONTENT } from './content';
import {
  emptyCallNoticeFilters,
  type CallNoticeFilterValues,
  type CallNoticeSort,
} from './filtering';

const STATUSES = ['notYetOpen', 'open', 'closingSoon', 'closed'] as const;
const CLOSES_WITHIN_DAYS = [7, 30] as const;

type SelectFilter = Exclude<keyof CallNoticeFilterValues, 'search' | 'city' | 'onlySaved'>;

/**
 * The search and the filters both call screens share. Each screen says which sorts it offers and
 * whether the fit can be filtered; the rest is the same.
 */
export function CallNoticeFilters({
  locale,
  filters,
  setFilters,
  sorts,
  defaultSort,
  showsClassification,
  resultCount,
}: {
  locale: Locale;
  filters: CallNoticeFilterValues;
  setFilters: (filters: CallNoticeFilterValues) => void;
  sorts: readonly CallNoticeSort[];
  defaultSort: CallNoticeSort;
  showsClassification: boolean;
  resultCount: number;
}) {
  const content = CALL_NOTICES_CONTENT[locale];
  const copy = content.filters;
  const labels = CREATOR_LABELS[locale];

  const select = (
    name: SelectFilter,
    values: readonly string[],
    names: Record<string, string>,
    hasAny = true,
  ) => (
    <SelectField
      label={copy[name]}
      name={name}
      value={filters[name]}
      onChange={(event) => setFilters({ ...filters, [name]: event.target.value })}
    >
      {hasAny && <option value="">{copy.any}</option>}
      {values.map((value) => (
        <option key={value} value={value}>
          {names[value]}
        </option>
      ))}
    </SelectField>
  );

  return (
    <search aria-label={copy.title} className="grid gap-4 print:hidden">
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label={copy.search}
          hint={copy.searchHint}
          name="search"
          type="search"
          className="sm:col-span-2"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        {showsClassification
          ? select('classification', MatchClassificationEnum.options, content.classification)
          : select('status', STATUSES, content.status)}
        {select('sort', sorts, content.sort, false)}
      </div>

      <details className="group rounded-2xl border border-border">
        <summary className="cursor-pointer rounded-2xl px-4 py-3 font-semibold focus-ring">
          {copy.more}
        </summary>
        <div className="grid items-start gap-4 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
          {select('culturalArea', CulturalAreaEnum.options, labels.culturalArea)}
          {select('opportunityKind', OpportunityKindEnum.options, content.opportunityKind)}
          {showsClassification && select('status', STATUSES, content.status)}
          {select('state', UfEnum.options, UF_NAME)}
          <TextField
            label={copy.city}
            name="city"
            value={filters.city}
            onChange={(event) => setFilters({ ...filters, city: event.target.value })}
          />
          {select('coverage', CallNoticeCoverageEnum.options, content.coverage)}
          {select('applicantType', ApplicantTypeEnum.options, content.applicantType)}
          {select('amount', ['informed', 'notInformed'], {
            informed: copy.amountInformed,
            notInformed: copy.amountNotInformed,
          })}
          {select(
            'closesWithinDays',
            CLOSES_WITHIN_DAYS.map(String),
            Object.fromEntries(CLOSES_WITHIN_DAYS.map((days) => [days, copy.closesWithin(days)])),
          )}
          <Checkbox
            name="onlySaved"
            checked={filters.onlySaved}
            onChange={(event) => setFilters({ ...filters, onlySaved: event.target.checked })}
          >
            {copy.onlySaved}
          </Checkbox>
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="font-semibold">
          {copy.results(resultCount)}
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setFilters({ ...emptyCallNoticeFilters, sort: defaultSort })}
        >
          {copy.clear}
        </Button>
      </div>
    </search>
  );
}
