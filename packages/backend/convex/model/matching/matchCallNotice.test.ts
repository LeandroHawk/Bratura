import { matchProfileFromPortfolio } from '@bratura/shared/entities/match/profile';
import type { Creator } from '@bratura/shared/entities/creator/entity';
import type { CallNoticeExtraction } from '@bratura/shared/entities/call-notice-extraction/entity';
import {
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
} from '@bratura/shared/entities/creator/demo/fictional-creator';
import type { PortfolioItem } from '@bratura/shared/entities/portfolio-item/entity';
import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { describe, expect, test } from 'vitest';
import {
  largestAmountPerProjectInCents,
  matchCallNotice,
  matchClassificationOnDeadline,
  monthsStatedIn,
} from './matchCallNotice';

type MatchProfile = { creator: Creator; portfolioItems: PortfolioItem[] };

const NOW = Date.UTC(2026, 10, 15, 15);
const dayInMs = 24 * 60 * 60 * 1000;

const closesInDays = (days: number) => ({
  registrationCloses: {
    at: NOW + days * dayInMs,
    timeZone: ianaTimeZone.parse('America/Fortaleza'),
    precision: 'day' as const,
  },
});

type Extracted = Pick<
  CallNoticeExtraction,
  'applicantTypes' | 'artForms' | 'requirements' | 'eligibilityRules' | 'residenceRequirement'
>;
type Requirement = Extracted['requirements'][number];

const requirement = (
  kind: Requirement['kind'],
  stage: Requirement['stage'] = 'registration',
  appliesTo: Requirement['appliesTo'] = null,
): Requirement => ({
  kind,
  detail: `detalhe de ${kind}`,
  appliesTo,
  stage,
  quote: `trecho ${kind}`,
});

const rule = (kind: Extracted['eligibilityRules'][number]['kind'], detail: string) => ({
  kind,
  detail,
  quote: `trecho ${kind}`,
});

const call = (overrides: Partial<Extracted> = {}): Extracted => ({
  applicantTypes: { value: ['individual', 'mei'], quote: 'pessoas físicas e MEI' },
  artForms: [{ value: 'crafts', quote: 'artesanato' }],
  residenceRequirement: null,
  requirements: [],
  eligibilityRules: [],
  ...overrides,
});

const donaMaria: MatchProfile = {
  creator: FICTIONAL_CREATOR,
  portfolioItems: FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
};

const withCreator = (creator: Partial<MatchProfile['creator']>): MatchProfile => ({
  ...donaMaria,
  creator: { ...FICTIONAL_CREATOR, ...creator },
});

const withDocument = (
  documentKind: Extract<PortfolioItem, { kind: 'document' }>['documentKind'],
  validUntil: string | null,
): MatchProfile => ({
  ...donaMaria,
  portfolioItems: [
    ...FICTIONAL_CREATOR_PORTFOLIO_ITEMS.filter(
      (item) => item.kind !== 'document' || item.documentKind !== documentKind,
    ),
    {
      kind: 'document',
      clientItemId: `test-${documentKind}`,
      documentKind,
      description: documentKind,
      issuedOn: null,
      validUntil,
      file: { fileName: 'paper.pdf', mediaType: 'application/pdf', sizeInBytes: 1 },
    },
  ],
});

const match = (extraction: Extracted, profile = donaMaria, days = 20) =>
  matchCallNotice(
    matchProfileFromPortfolio(profile.creator, profile.portfolioItems),
    extraction,
    closesInDays(days),
    NOW,
  );

const statusesOf = (extraction: Extracted, profile = donaMaria) =>
  match(extraction, profile).requirements.map(({ kind, status }) => [kind, status]);

describe('matchCallNotice: the stage of a requirement', () => {
  test('six papers to apply the portfolio holds and eight asked after selection: eligible', () => {
    const profile: MatchProfile = {
      ...donaMaria,
      portfolioItems: [
        ...withDocument('bankAccount', null).portfolioItems,
        ...withDocument('portfolioOrActivityProof', null).portfolioItems.slice(-1),
      ],
    };
    const result = match(
      call({
        requirements: [
          requirement('proofOfResidence'),
          requirement('proofOfResidence'),
          requirement('bankAccount'),
          requirement('portfolioOrActivityProof'),
          requirement('curriculum'),
          requirement('bankAccount', null),
          ...Array.from({ length: 4 }, () => requirement('taxAndLaborClearance', 'afterSelection')),
          requirement('cnpjOrMei', 'afterSelection'),
          requirement('artisanCredential', 'afterSelection'),
          requirement('bankAccount', 'afterSelection'),
          requirement('other', 'afterSelection'),
        ],
      }),
      profile,
    );
    expect(result.requirements).toHaveLength(14);
    expect(result.requirements.filter(({ stage }) => stage === 'afterSelection')).toHaveLength(8);
    expect(
      result.requirements.filter(({ stage }) => stage !== 'afterSelection').map((r) => r.status),
    ).toEqual(Array.from({ length: 6 }, () => 'met'));
    expect(result.classification).toBe('eligible');
  });

  test('a paper asked after selection that the portfolio lacks never lowers the answer', () => {
    const result = match(call({ requirements: [requirement('cnpjOrMei', 'afterSelection')] }));
    expect(result.requirements[0]?.status).toBe('notMet');
    expect(result.classification).toBe('eligible');
  });

  test('a missing paper asked to apply makes the call almost eligible, and names the paper', () => {
    const result = match(
      call({ requirements: [requirement('identity'), requirement('cnpjOrMei')] }),
    );
    expect(result.classification).toBe('almostEligible');
    expect(result.requirements.filter((r) => r.status === 'notMet').map((r) => r.kind)).toEqual([
      'cnpjOrMei',
    ]);
  });

  test('a requirement with no stage counts as asked to apply', () => {
    expect(match(call({ requirements: [requirement('cnpjOrMei', null)] })).classification).toBe(
      'almostEligible',
    );
  });
});

describe('matchCallNotice: who a requirement applies to', () => {
  test('a requirement of another applicant type is left out', () => {
    const extraction = call({
      requirements: [
        requirement('cnpjOrMei', 'registration', ['mei', 'company']),
        requirement('identity', 'registration', ['individual']),
      ],
    });
    expect(statusesOf(extraction)).toEqual([['identity', 'needsConfirmation']]);
    expect(match(extraction).classification).toBe('eligible');
  });

  test('an individual is not a MEI: the MEI papers reach only the MEI profile', () => {
    const extraction = call({
      requirements: [requirement('cnpjOrMei', 'registration', ['mei'])],
    });
    expect(match(extraction).requirements).toEqual([]);
    expect(statusesOf(extraction, withCreator({ applicantType: 'mei' }))).toEqual([
      ['cnpjOrMei', 'notMet'],
    ]);
  });
});

describe('matchCallNotice: the applicant type', () => {
  test('a listed type is met, with the passage that lists it', () => {
    expect(match(call()).applicantType).toEqual({
      value: ['individual', 'mei'],
      quote: 'pessoas físicas e MEI',
      status: 'met',
    });
  });

  test('a type the call does not list is to confirm, never an exclusion: almost eligible', () => {
    const result = match(
      call({
        applicantTypes: { value: ['company'], quote: 'pessoas jurídicas com fins lucrativos' },
      }),
    );
    expect(result.applicantType?.status).toBe('needsConfirmation');
    expect(result.applicantType?.quote).toBe('pessoas jurídicas com fins lucrativos');
    expect(result.classification).toBe('almostEligible');
  });

  test('a call listing only MEI does not accept the individual as one', () => {
    const result = match(call({ applicantTypes: { value: ['mei'], quote: 'MEI' } }));
    expect(result.applicantType?.status).toBe('needsConfirmation');
  });

  test('a call that states no applicant type has no check, and stays eligible', () => {
    const result = match(call({ applicantTypes: null }));
    expect(result.applicantType).toBeNull();
    expect(result.classification).toBe('eligible');
  });
});

describe('matchCallNotice: papers by kind, no text reading', () => {
  test('a paper of the exact kind, registered and not expired, is met', () => {
    expect(statusesOf(call({ requirements: [requirement('proofOfResidence')] }))).toEqual([
      ['proofOfResidence', 'met'],
    ]);
  });

  test('an expired paper does not count as had, and says it expired', () => {
    const [credential] = match(
      call({ requirements: [requirement('artisanCredential')] }),
    ).requirements;
    expect(credential).toMatchObject({ status: 'notMet', paperValidity: 'expired' });
  });

  test('a valid paper turns the same requirement into met', () => {
    const [credential] = match(
      call({ requirements: [requirement('artisanCredential')] }),
      withDocument('artisanCredential', '2030-01-01'),
    ).requirements;
    expect(credential).toMatchObject({ status: 'met', paperValidity: 'valid' });
  });

  test('a paper valid today that expires before the call closes is met, and flagged', () => {
    const [clearance] = match(
      call({ requirements: [requirement('taxAndLaborClearance')] }),
      withDocument('taxAndLaborClearance', '2026-11-20'),
      20,
    ).requirements;
    expect(clearance).toMatchObject({ status: 'met', paperValidity: 'expiresBeforeClose' });
  });

  test('a paper listed without its file is not had yet', () => {
    const profile = withDocument('bankAccount', null);
    const portfolioItems = profile.portfolioItems.map((item) =>
      item.kind === 'document' && item.documentKind === 'bankAccount'
        ? { ...item, file: null }
        : item,
    );
    expect(
      statusesOf(call({ requirements: [requirement('bankAccount')] }), {
        ...profile,
        portfolioItems,
      }),
    ).toEqual([['bankAccount', 'notMet']]);
  });

  test('a kind the description names but the paper is not counts for nothing', () => {
    const portfolioItems = withDocument('other', null).portfolioItems.map((item) =>
      item.kind === 'document' && item.documentKind === 'other'
        ? { ...item, description: 'CNPJ e certificado de MEI' }
        : item,
    );
    expect(
      statusesOf(call({ requirements: [requirement('cnpjOrMei')] }), {
        ...donaMaria,
        portfolioItems,
      }),
    ).toEqual([['cnpjOrMei', 'notMet']]);
  });

  test('the curriculum is met by the experiences, and missing without them', () => {
    const extraction = call({ requirements: [requirement('curriculum')] });
    expect(statusesOf(extraction)).toEqual([['curriculum', 'met']]);
    const portfolioItems = FICTIONAL_CREATOR_PORTFOLIO_ITEMS.filter(
      (item) => item.kind !== 'culturalExperience',
    );
    expect(statusesOf(extraction, { ...donaMaria, portfolioItems })).toEqual([
      ['curriculum', 'notMet'],
    ]);
  });

  test('what a portfolio does not keep (a proposal, "other") is to confirm and lowers nothing', () => {
    const extraction = call({
      requirements: [requirement('projectProposal'), requirement('other')],
    });
    expect(statusesOf(extraction)).toEqual([
      ['projectProposal', 'needsConfirmation'],
      ['other', 'needsConfirmation'],
    ]);
    expect(match(extraction).classification).toBe('eligible');
  });

  test('every requirement carries the passage of the call that asks for it', () => {
    const [identity] = match(call({ requirements: [requirement('identity')] })).requirements;
    expect(identity?.quote).toBe('trecho identity');
  });
});

describe('matchCallNotice: eligibility rules', () => {
  const statusOfRule = (kind: Parameters<typeof rule>[0], detail: string, profile = donaMaria) =>
    match(call({ eligibilityRules: [rule(kind, detail)] }), profile).eligibilityRules[0]?.status;

  test('minimum age reads the birth date', () => {
    expect(statusOfRule('minimumAge', 'ter 18 (dezoito) anos completos')).toBe('met');
    expect(
      statusOfRule('minimumAge', 'ter 18 anos completos', withCreator({ birthDate: '2010-01-01' })),
    ).toBe('notMet');
    expect(statusOfRule('minimumAge', 'ter 18 anos', withCreator({ birthDate: null }))).toBe(
      'needsConfirmation',
    );
    expect(statusOfRule('minimumAge', 'ser maior de idade')).toBe('needsConfirmation');
  });

  test('an age reached only after today is not met yet', () => {
    expect(statusOfRule('minimumAge', '18 anos', withCreator({ birthDate: '2008-11-16' }))).toBe(
      'notMet',
    );
    expect(statusOfRule('minimumAge', '18 anos', withCreator({ birthDate: '2008-11-15' }))).toBe(
      'met',
    );
  });

  test('residence time: too short is not met; long enough still needs the place confirmed', () => {
    const livesSince = (date: string | null) => withCreator({ livesInCurrentPlaceSince: date });
    expect(
      statusOfRule('residenceTime', 'residir há 2 anos no município', livesSince('2026-01-10')),
    ).toBe('notMet');
    expect(statusOfRule('residenceTime', 'residir há 2 anos no município')).toBe(
      'needsConfirmation',
    );
    expect(statusOfRule('residenceTime', 'residir há 6 meses', livesSince(null))).toBe(
      'needsConfirmation',
    );
  });

  test('public servants barred reads the profile answer', () => {
    expect(statusOfRule('publicServantExclusion', 'vedado a servidores')).toBe('met');
    expect(
      statusOfRule('publicServantExclusion', 'vedado', withCreator({ isPublicServant: true })),
    ).toBe('notMet');
    expect(
      statusOfRule('publicServantExclusion', 'vedado', withCreator({ isPublicServant: null })),
    ).toBe('needsConfirmation');
  });

  test('minimum experience reads the year the activity began', () => {
    expect(statusOfRule('minimumExperience', 'atuação de 2 anos')).toBe('met');
    expect(
      statusOfRule(
        'minimumExperience',
        'atuação de 5 anos',
        withCreator({ activityStartYear: 2024 }),
      ),
    ).toBe('notMet');
    expect(
      statusOfRule(
        'minimumExperience',
        'atuação de 5 anos',
        withCreator({ activityStartYear: null }),
      ),
    ).toBe('needsConfirmation');
  });

  test('a rule the profile cannot answer is to confirm, with its passage', () => {
    const result = match(call({ eligibilityRules: [rule('careerStage', 'artistas iniciantes')] }));
    expect(result.eligibilityRules).toEqual([
      {
        kind: 'careerStage',
        detail: 'artistas iniciantes',
        quote: 'trecho careerStage',
        status: 'needsConfirmation',
      },
    ]);
    expect(result.classification).toBe('eligible');
  });

  test('only a rule the profile fails makes the call not eligible', () => {
    const result = match(
      call({ eligibilityRules: [rule('publicServantExclusion', 'vedado a servidores públicos')] }),
      withCreator({ isPublicServant: true }),
    );
    expect(result.classification).toBe('notEligible');
  });
});

describe('matchCallNotice: art forms', () => {
  test('a listed art form or "any" is met; an unlisted one needs confirmation and lowers the classification', () => {
    expect(match(call()).artFormStatus).toBe('met');
    expect(match(call({ artForms: [{ value: 'any', quote: 'todas' }] })).artFormStatus).toBe('met');
    const music = match(call({ artForms: [{ value: 'music', quote: 'música' }] }));
    expect(music.artFormStatus).toBe('needsConfirmation');
    expect(music.classification).toBe('almostEligible');
    expect(match(call({ artForms: [] })).artFormStatus).toBeNull();
  });
});

describe('monthsStatedIn', () => {
  test.each([
    ['18 (dezoito) anos completos', 216],
    ['no mínimo 2 anos', 24],
    ['1 ano de atuação', 12],
    ['há pelo menos 6 meses', 6],
    ['1 mês', 1],
  ])('%s → %i months', (detail, months) => {
    expect(monthsStatedIn(detail)).toBe(months);
  });

  test.each(['maior de idade', 'entre 18 anos e 29 anos', 'edital 12/2026'])(
    '%s states no single duration',
    (detail) => {
      expect(monthsStatedIn(detail)).toBeNull();
    },
  );
});

describe('the deadline and the amount', () => {
  test('a closed call is never eligible; an open one keeps its answer', () => {
    expect(matchClassificationOnDeadline('eligible', 'closed')).toBe('notEligible');
    expect(matchClassificationOnDeadline('almostEligible', 'closed')).toBe('notEligible');
    expect(matchClassificationOnDeadline('eligible', 'open')).toBe('eligible');
    expect(matchClassificationOnDeadline('almostEligible', 'notInformed')).toBe('almostEligible');
  });

  test('the largest amount is one project, never the call total', () => {
    const amount = (amountInCents: number) => ({ category: 'c', amountInCents, quote: 'q' });
    expect(
      largestAmountPerProjectInCents({ amountsPerProject: [amount(500_000), amount(1_500_000)] }),
    ).toBe(1_500_000);
    expect(largestAmountPerProjectInCents({ amountsPerProject: [] })).toBeNull();
  });
});

describe('review regressions: residence, age and activity proof', () => {
  test.each([
    ['Município de Santos', 'Juazeiro do Norte', 'CE', 'needsConfirmation'],
    ['município de São Paulo', 'Santos', 'SP', 'needsConfirmation'],
    ['município de São Paulo', 'São Paulo', 'SP', 'met'],
    ['Município de Juazeiro', 'Juazeiro do Norte', 'CE', 'needsConfirmation'],
    ['Município de Juazeiro do Norte', 'Juazeiro', 'BA', 'needsConfirmation'],
    ['Ceará', 'Juazeiro do Norte', 'CE', 'met'],
    ['Brasil', 'Juazeiro do Norte', 'CE', 'met'],
    [
      'Estado do Rio Grande do Norte e/ou em algum dos Estados da Região Nordeste do Brasil',
      'Juazeiro do Norte',
      'CE',
      'needsConfirmation',
    ],
  ] as const)('%s for %s/%s: %s', (value, city, state, status) => {
    const result = match(
      call({ residenceRequirement: { value, quote: value } }),
      withCreator({ city, state }),
    );
    expect(result.residence).toEqual({ value, quote: value, status });
    expect(result.classification).toBe(status === 'met' ? 'eligible' : 'almostEligible');
  });

  test('no residence requirement means no check', () => {
    expect(match(call()).residence).toBeNull();
  });

  test.each([
    ['1996-11-16', 'met'],
    ['1996-11-15', 'notMet'],
  ] as const)('maximum age admits the whole year: %s', (birthDate, status) => {
    const result = match(
      call({ eligibilityRules: [rule('maximumAge', 'até 29 anos')] }),
      withCreator({ birthDate }),
    );
    expect(result.eligibilityRules[0]?.status).toBe(status);
  });

  test.each(['minimumAge', 'residenceTime', 'minimumExperience'] as const)(
    '%s never interprets a maximum as a minimum',
    (kind) => {
      const result = match(
        call({ eligibilityRules: [rule(kind, 'há, no máximo, 02 (dois) anos')] }),
      );
      expect(result.eligibilityRules[0]?.status).toBe('needsConfirmation');
    },
  );

  test('activity proof needs an experience with a link or attachment', () => {
    const extraction = call({ requirements: [requirement('portfolioOrActivityProof')] });
    expect(statusesOf(extraction)).toEqual([['portfolioOrActivityProof', 'met']]);
    const portfolioItems = FICTIONAL_CREATOR_PORTFOLIO_ITEMS.map((item) =>
      item.kind === 'culturalExperience' ? { ...item, attachments: [], links: [] } : item,
    );
    expect(statusesOf(extraction, { ...donaMaria, portfolioItems })).toEqual([
      ['portfolioOrActivityProof', 'notMet'],
    ]);
  });

  test('a CPF alone never confirms an RG or CNH requirement', () => {
    const result = match(
      call({ requirements: [{ ...requirement('identity'), detail: 'RG ou CNH com foto' }] }),
    );
    expect(result.requirements[0]?.status).toBe('needsConfirmation');
  });
});
