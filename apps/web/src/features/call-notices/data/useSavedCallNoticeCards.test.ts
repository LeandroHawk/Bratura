import { savedCallNoticesMax } from '@bratura/shared/entities/call-notice/dto/bratura-portal/saved-call-notice-cards/query';
import { describe, expect, it } from 'vitest';
import { savedCallNoticeIdGroups } from './useSavedCallNoticeCards';

describe('savedCallNoticeIdGroups', () => {
  it('asks for every saved call, in reads no larger than the query answers', () => {
    const ids = Array.from({ length: savedCallNoticesMax + 1 }, (_, index) => `call-${index}`);
    const groups = savedCallNoticeIdGroups(ids);
    expect(groups.map((group) => group.length)).toEqual([savedCallNoticesMax, 1]);
    expect(groups.flat()).toEqual(ids);
  });

  it('asks for nothing when nothing is saved', () => {
    expect(savedCallNoticeIdGroups([])).toEqual([]);
  });
});
