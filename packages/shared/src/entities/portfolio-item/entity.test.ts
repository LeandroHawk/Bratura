import { describe, expect, test } from 'vitest';
import { PortfolioItemSchema } from './entity';
import { withOrderedPeriod } from './fragments/period/fields';
import { CulturalExperiencePortfolioItemSchema } from './kinds/cultural-experience/variant';
import { CulturalProjectPortfolioItemSchema } from './kinds/cultural-project/variant';
import {
  DocumentPortfolioItemSchema,
  portfolioDocumentStatus,
  withClearanceValidity,
} from './kinds/document/variant';

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

  test('valid through its last day, and expiring in its last 30', () => {
    expect(portfolioDocumentStatus({ validUntil: '2026-01-01', file }, '2026-01-01')).toBe(
      'expiring',
    );
    expect(portfolioDocumentStatus({ validUntil: '2026-01-31', file }, '2026-01-01')).toBe(
      'expiring',
    );
    expect(portfolioDocumentStatus({ validUntil: '2026-02-01', file }, '2026-01-01')).toBe(
      'registered',
    );
  });

  test('a paper that does not expire is registered', () => {
    expect(portfolioDocumentStatus({ validUntil: null, file }, '2026-01-01')).toBe('registered');
  });

  test('pending while only listed', () => {
    expect(portfolioDocumentStatus({ validUntil: null, file: null }, '2026-01-01')).toBe('pending');
  });
});

describe('withClearanceValidity', () => {
  const schema = withClearanceValidity(DocumentPortfolioItemSchema);
  const clearance = {
    kind: 'document',
    clientItemId: 'd1',
    documentKind: 'taxAndLaborClearance',
    description: 'Certidão negativa de débitos trabalhistas',
    issuedOn: null,
    validUntil: null,
    file: null,
  };

  test('refuses a clearance with no validity, on the validity field', () => {
    const result = schema.safeParse(clearance);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['validUntil'],
      params: { message: 'clearanceWithoutValidity' },
    });
  });

  test('accepts a clearance with its validity, and another paper without one', () => {
    expect(schema.safeParse({ ...clearance, validUntil: '2026-06-30' }).success).toBe(true);
    expect(schema.safeParse({ ...clearance, documentKind: 'identity' }).success).toBe(true);
  });
});

describe('CulturalProjectPortfolioItemSchema', () => {
  const project = {
    kind: 'culturalProject',
    clientItemId: 'p1',
    startDate: null,
    endDate: null,
    links: [],
    attachments: [],
    name: 'Renda que ensina',
    culturalArea: 'crafts',
    description: null,
    objective: null,
    status: 'planned',
    venue: null,
    targetAudience: null,
    results: null,
    budgetInCents: null,
    team: [],
  };

  test('the budget and the team are optional', () => {
    expect(CulturalProjectPortfolioItemSchema.safeParse(project).success).toBe(true);
  });

  test('keeps a budget in cents and a team by name and role', () => {
    const filled = {
      ...project,
      budgetInCents: 1_500_000,
      team: [{ name: 'Maria', role: 'Mestra' }],
    };
    expect(CulturalProjectPortfolioItemSchema.parse(filled)).toMatchObject(filled);
  });

  test('refuses a budget that is not a positive whole number of cents, and a member with no role', () => {
    expect(
      CulturalProjectPortfolioItemSchema.safeParse({ ...project, budgetInCents: 0 }).success,
    ).toBe(false);
    expect(
      CulturalProjectPortfolioItemSchema.safeParse({
        ...project,
        team: [{ name: 'Maria', role: '' }],
      }).success,
    ).toBe(false);
  });
});
