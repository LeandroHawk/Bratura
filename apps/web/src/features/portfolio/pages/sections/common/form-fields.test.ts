import { describe, expect, it } from 'vitest';
import { draftFromValues, valuesFromDraft } from './form-fields';

describe('valuesFromDraft', () => {
  it('keeps a comma inside a link, and gives a bare address its scheme', () => {
    const { links } = valuesFromDraft([{ name: 'links', control: 'links' }], {
      links: 'https://example.com/mapa?centro=-7.2,-39.3\n\n instagram.com/maria ',
    });
    expect(links).toEqual([
      'https://example.com/mapa?centro=-7.2,-39.3',
      'https://instagram.com/maria',
    ]);
  });

  it('reads a list of words typed with commas or lines', () => {
    const { techniques } = valuesFromDraft([{ name: 'techniques', control: 'lines' }], {
      techniques: 'renda de bilro, bordado\nlabirinto',
    });
    expect(techniques).toEqual(['renda de bilro', 'bordado', 'labirinto']);
  });

  it('reads an amount typed in reais as cents, and shows it back', () => {
    const fields = [{ name: 'budgetInCents', control: 'amount' }] as const;
    const centsOf = (typed: string) =>
      valuesFromDraft([...fields], { budgetInCents: typed }).budgetInCents;
    expect(centsOf('1.500,00')).toBe(150_000);
    expect(centsOf('R$ 1500')).toBe(150_000);
    expect(centsOf('1,500.5')).toBe(150_050);
    expect(centsOf(' ')).toBeNull();
    expect(centsOf('mil reais')).toBeNaN();
    expect(draftFromValues([...fields], { budgetInCents: 150_050 })).toEqual({
      budgetInCents: '1500,50',
    });
  });

  it('reads a team typed one person per line, and shows it back', () => {
    const fields = [{ name: 'team', control: 'people' }] as const;
    const team = [
      { name: 'Maria das Dores', role: 'Mestra rendeira, coordenadora' },
      { name: 'João', role: '' },
    ];
    expect(
      valuesFromDraft([...fields], {
        team: 'Maria das Dores, Mestra rendeira, coordenadora\n\nJoão',
      }).team,
    ).toEqual(team);
    expect(draftFromValues([...fields], { team: team.slice(0, 1) })).toEqual({
      team: 'Maria das Dores, Mestra rendeira, coordenadora',
    });
  });

  it('keeps a yes, a no and no answer apart', () => {
    const fields = [{ name: 'isPublicServant', control: 'yesNo' }] as const;
    const answerOf = (typed: string) =>
      valuesFromDraft([...fields], { isPublicServant: typed }).isPublicServant;
    expect([answerOf('yes'), answerOf('no'), answerOf('')]).toEqual([true, false, null]);
    expect(draftFromValues([...fields], { isPublicServant: false })).toEqual({
      isPublicServant: 'no',
    });
  });
});
