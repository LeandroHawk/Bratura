import { describe, expect, it } from 'vitest';
import {
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
} from '@bratura/shared/entities/creator/demo/fictional-creator';
import { callNoticesWithMatch } from './callNoticesWithMatch';

const NOW = Date.UTC(2026, 10, 15, 15);

function matchOf(callNoticeId: string, portfolioItems = FICTIONAL_CREATOR_PORTFOLIO_ITEMS) {
  const callNotice = callNoticesWithMatch({ creator: FICTIONAL_CREATOR, portfolioItems }, NOW).find(
    (candidate) => candidate.callNoticeId === callNoticeId,
  );
  if (!callNotice) throw new Error(`no sample call ${callNoticeId}`);
  return callNotice.match;
}

describe('standInMatch, over the sample calls and the example portfolio', () => {
  it('a missing document makes the call almost eligible, and names the document', () => {
    const match = matchOf('exemplo-fomento-mei-cultural');
    expect(match?.classification).toBe('almostEligible');
    expect(
      match?.requirements
        .filter((requirement) => requirement.status === 'notMet')
        .map((requirement) => requirement.documentKind),
    ).toEqual(['ccmei']);
  });

  it('an expired document does not count as had', () => {
    const sicab = matchOf('exemplo-feiras-de-artesanato')?.requirements.find(
      (requirement) => requirement.documentKind === 'sicab',
    );
    expect(sicab?.status).toBe('notMet');
  });

  it('a valid document turns the same requirement into met', () => {
    const withValidSicab = FICTIONAL_CREATOR_PORTFOLIO_ITEMS.map((item) =>
      item.kind === 'document' && item.documentKind === 'sicab'
        ? { ...item, validUntil: '2030-01-01' }
        : item,
    );
    const sicab = matchOf('exemplo-feiras-de-artesanato', withValidSicab)?.requirements.find(
      (requirement) => requirement.documentKind === 'sicab',
    );
    expect(sicab?.status).toBe('met');
  });

  it('an applicant type or an art form the portfolio lacks makes it not eligible', () => {
    expect(matchOf('exemplo-patrocinio-empresas')?.classification).toBe('notEligible');
    expect(matchOf('exemplo-festival-de-musica')?.classification).toBe('notEligible');
  });

  it('a residence requirement is never answered for the creator', () => {
    const residence = matchOf('exemplo-feiras-de-artesanato')?.requirements.filter(
      (requirement) => requirement.kind === 'residence',
    );
    expect(residence?.map((requirement) => requirement.status)).toEqual(['needsConfirmation']);
  });

  it('a call whose documents were not read has no match', () => {
    expect(matchOf('exemplo-oficinas-nas-escolas')).toBeNull();
  });

  it('every requirement carries the passage of the call that asks for it', () => {
    const callNotices = callNoticesWithMatch(
      { creator: FICTIONAL_CREATOR, portfolioItems: FICTIONAL_CREATOR_PORTFOLIO_ITEMS },
      NOW,
    );
    for (const { match } of callNotices)
      for (const requirement of match?.requirements ?? [])
        expect(requirement.quote.length).toBeGreaterThan(0);
  });
});
