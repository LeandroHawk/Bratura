import { describe, expect, test } from 'vitest';
import { verifyExtractionAnswer } from './verify';

const text = [
  'O valor total deste edital é de R$ 160.000,00 (cento e sessenta mil reais).',
  '| Documentário e Cinema | 02 | R$ 4.000,00 | R$ 8.000,00 |',
  'Pode se inscrever qualquer agente cultural que reside no município de Reriutaba.',
  'Serão aceitas propostas de música, teatro e dança.',
  'II – certidão negativa de débitos relativos a créditos tributários federais;',
  'As inscrições vão até 20 de novembro de 2026.',
].join('\n');

const verify = (answer: unknown) => verifyExtractionAnswer(answer, text);

describe('verifyExtractionAnswer', () => {
  test('keeps each value its quote proves, quoting the source', () => {
    const verified = verify({
      totalBudgetInCents: {
        value: 16_000_000,
        quote: 'O valor total deste edital é de R$ 160.000,00',
      },
      amountsPerProject: [
        {
          category: 'Documentário e Cinema',
          amountInCents: 400_000,
          quote: 'Documentário e Cinema | 02 | R$ 4.000,00',
        },
      ],
      residenceRequirement: {
        value: 'município de Reriutaba',
        quote: 'reside no município de Reriutaba.',
      },
      artForms: [{ value: 'music', quote: 'Serão aceitas propostas de música, teatro e dança.' }],
      registrationCloses: {
        date: '2026-11-20',
        quote: 'As inscrições vão até 20 de novembro de 2026.',
      },
    });
    expect(verified).toMatchObject({
      valuesRefused: 0,
      totalBudget: { amountInCents: 16_000_000 },
      amountsPerProject: [{ amountInCents: 400_000 }],
      residenceRequirement: { value: 'município de Reriutaba' },
      artForms: [{ value: 'music' }],
      registrationCloses: { date: '2026-11-20' },
    });
  });

  test('a quote the model retyped is replaced by the source passage it stands for', () => {
    const { requirements } = verify({
      requirements: [
        {
          kind: 'taxAndLaborClearance',
          detail: 'Certidão federal',
          appliesTo: null,
          stage: 'afterSelection',
          quote: 'II - certidao negativa de debitos relativos a creditos tributarios federais;',
        },
      ],
    });
    expect(requirements[0]?.quote).toBe(
      'II – certidão negativa de débitos relativos a créditos tributários federais;',
    );
  });

  test('a kind or group outside the list is kept as "other"; a wrong applicant type is refused', () => {
    const quote = 'II – certidão negativa de débitos relativos a créditos tributários federais;';
    const verified = verify({
      requirements: [
        { kind: 'trajectory', detail: 'Certidão', appliesTo: [], stage: 'later', quote },
        { kind: 'identity', detail: 'Certidão', appliesTo: ['alien'], stage: null, quote },
      ],
      eligibilityRules: [{ kind: 'registryPrerequisite', detail: 'Residência', quote }],
      quotas: [{ group: 'afroBrazilian', share: null, quote }],
    });
    expect(verified).toMatchObject({
      requirements: [{ kind: 'other', appliesTo: null, stage: null }],
      eligibilityRules: [{ kind: 'other' }],
      quotas: [{ group: 'other', share: null }],
      valuesRefused: 1,
    });
  });

  test('a quota share its quote does not write is refused', () => {
    const quote =
      'Pode se inscrever qualquer agente cultural que reside no município de Reriutaba.';
    const verified = verify({ quotas: [{ group: 'black', share: '20%', quote }] });
    expect(verified).toMatchObject({ quotas: [], valuesRefused: 1 });
  });

  test('a number or date its quote does not say is refused', () => {
    const verified = verify({
      totalBudgetInCents: {
        value: 99_000_000,
        quote: 'O valor total deste edital é de R$ 160.000,00',
      },
      registrationCloses: {
        date: '2026-12-20',
        quote: 'As inscrições vão até 20 de novembro de 2026.',
      },
    });
    expect(verified).toMatchObject({
      totalBudget: null,
      registrationCloses: null,
      valuesRefused: 2,
    });
  });

  test('a quote the text does not hold is refused: the model made it up or was told to', () => {
    const verified = verify({
      isCreatorCall: { value: true, quote: 'Envie seu CPF e senha para o número indicado.' },
    });
    expect(verified).toMatchObject({ isCreatorCall: null, valuesRefused: 1 });
  });

  test('an art form its quote does not name, or "any" without saying so, is refused', () => {
    const verified = verify({
      artForms: [
        { value: 'circus', quote: 'Serão aceitas propostas de música, teatro e dança.' },
        { value: 'any', quote: 'Serão aceitas propostas de música, teatro e dança.' },
        { value: 'dance', quote: 'Serão aceitas propostas de música, teatro e dança.' },
      ],
    });
    expect(verified.artForms.map(({ value }) => value)).toEqual(['dance']);
    expect(verified.valuesRefused).toBe(2);
  });

  test('a malformed field is refused alone; an answer that is not an object keeps nothing', () => {
    expect(
      verify({ applicantTypes: { value: ['alien'], quote: 'qualquer agente cultural' } }),
    ).toMatchObject({
      applicantTypes: null,
      valuesRefused: 1,
    });
    expect(verify('not json')).toMatchObject({
      isCreatorCall: null,
      amountsPerProject: [],
      valuesRefused: 0,
    });
  });
});
