'use client';

import {
  CallNoticeCloseFilterEnum,
  CallNoticeSortEnum,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-cards/query';
import { MatchClassificationEnum } from '@bratura/shared/entities/match/enums/classification/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Checkbox, SelectField } from '@bratura/ui';
import type { CallNoticeCardsFilter } from '@/features/call-notices/data/useCallNoticeCards';
import { CALL_NOTICES_CONTENT } from './content';

/** What the person chose: the server's filter, or only the calls they saved. */
export type CallNoticeFilterValues = CallNoticeCardsFilter & { onlySaved: boolean };

const ANY = '';

/**
 * The filters both call screens share, each one a question the server answers by an index: the
 * fit, the registration deadline and the order. The saved calls are their own short list, so the
 * other filters rest while it shows.
 */
export function CallNoticeFilters({
  locale,
  filters,
  setFilters,
  defaultFilters,
  shownCount,
  hasMore,
}: {
  locale: Locale;
  filters: CallNoticeFilterValues;
  setFilters: (filters: CallNoticeFilterValues) => void;
  defaultFilters: CallNoticeFilterValues;
  /** How many cards are on the screen; `null` while they load. */
  shownCount: number | null;
  hasMore: boolean;
}) {
  const content = CALL_NOTICES_CONTENT[locale];
  const copy = content.filters;

  return (
    <search aria-label={copy.title} className="grid gap-4 print:hidden">
      <div className="grid items-start gap-4 sm:grid-cols-3">
        <SelectField
          label={copy.classification}
          name="classification"
          disabled={filters.onlySaved}
          value={filters.classification ?? ANY}
          onChange={(event) =>
            setFilters({
              ...filters,
              classification:
                event.target.value === ANY
                  ? null
                  : MatchClassificationEnum.parse(event.target.value),
            })
          }
        >
          <option value={ANY}>{copy.any}</option>
          {MatchClassificationEnum.options.map((classification) => (
            <option key={classification} value={classification}>
              {content.classification[classification]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={copy.closes}
          name="closes"
          disabled={filters.onlySaved}
          value={filters.closes}
          onChange={(event) =>
            setFilters({ ...filters, closes: CallNoticeCloseFilterEnum.parse(event.target.value) })
          }
        >
          {CallNoticeCloseFilterEnum.options.map((closes) => (
            <option key={closes} value={closes}>
              {copy.closesOption[closes]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={copy.sort}
          name="sort"
          disabled={filters.onlySaved}
          value={filters.sort}
          onChange={(event) =>
            setFilters({ ...filters, sort: CallNoticeSortEnum.parse(event.target.value) })
          }
        >
          {CallNoticeSortEnum.options.map((sort) => (
            <option key={sort} value={sort}>
              {content.sort[sort]}
            </option>
          ))}
        </SelectField>
      </div>
      <Checkbox
        name="onlySaved"
        checked={filters.onlySaved}
        onChange={(event) => setFilters({ ...filters, onlySaved: event.target.checked })}
      >
        {copy.onlySaved}
      </Checkbox>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="font-semibold">
          {shownCount === null ? content.loading : copy.shown(shownCount, hasMore)}
        </p>
        <Button size="sm" variant="ghost" onClick={() => setFilters(defaultFilters)}>
          {copy.clear}
        </Button>
      </div>
    </search>
  );
}
