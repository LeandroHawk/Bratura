import { describe, expect, test } from 'vitest';
import { PortfolioItemSchema } from './entity';
import { withOrderedPeriod } from './fragments/period/fields';
import { CulturalExperiencePortfolioItemSchema } from './kinds/cultural-experience/variant';
import { portfolioDocumentStatus } from './kinds/document/variant';

const experience = {
  kind: 'culturalExperience',
  clientItemId: 'a1',
  startDate: '2025-06-10',
  endDate: null,
  title: 'Feira de São João',
  activityKind: 'fair',
  description: null,
  venue: null,
  city: null,
  state: null,
  organizer: null,
  links: [],
  attachments: [],
};

describe('PortfolioItemSchema', () => {
  test('reads an item by its kind', () => {
    expect(PortfolioItemSchema.parse(experience).kind).toBe('culturalExperience');
  });

  test('refuses a kind it does not know', () => {
    expect(PortfolioItemSchema.safeParse({ ...experience, kind: 'award' }).success).toBe(false);
  });
});

describe('withOrderedPeriod', () => {
  const schema = withOrderedPeriod(CulturalExperiencePortfolioItemSchema);

  test('refuses an end before the start, on the end field, by message key', () => {
    const result = schema.safeParse({ ...experience, endDate: '2025-06-01' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['endDate'],
      params: { message: 'endsBeforeItStarts' },
    });
  });

  test('takes a single day', () => {
    expect(schema.safeParse({ ...experience, endDate: '2025-06-10' }).success).toBe(true);
  });
});

describe('portfolioDocumentStatus', () => {
  const file = { fileName: 'ccmei.pdf', mediaType: 'application/pdf', sizeInBytes: 1 };

  test('expired wins over a file sent', () => {
    expect(portfolioDocumentStatus({ validUntil: '2026-01-01', file }, '2026-01-02')).toBe(
      'expired',
    );
  });

  test('valid through its last day', () => {
    expect(portfolioDocumentStatus({ validUntil: '2026-01-01', file }, '2026-01-01')).toBe(
      'registered',
    );
  });

  test('pending while only listed', () => {
    expect(portfolioDocumentStatus({ validUntil: null, file: null }, '2026-01-01')).toBe('pending');
  });
});
