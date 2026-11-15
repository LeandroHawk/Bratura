import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { describe, expect, test } from 'vitest';
import {
  callNoticeDocumentRoleFromUrl,
  documentsWorthReading,
  reasonToSkipReadingDocuments,
} from './selection';

type CallNoticeToScreen = Parameters<typeof reasonToSkipReadingDocuments>[0];

const now = Date.UTC(2026, 10, 14, 12);
const day = 24 * 60 * 60 * 1000;

const closingIn = (milliseconds: number) => ({
  at: now + milliseconds,
  timeZone: ianaTimeZone.parse('America/Fortaleza'),
  precision: 'minute' as const,
});

const callNotice: CallNoticeToScreen = {
  title: 'Edital das Artes de Reriutaba',
  documentUrls: ['https://mapacultural.secult.ce.gov.br/files/edital.pdf'],
  registrationCloses: closingIn(9 * day),
};

const reason = (overrides: Partial<CallNoticeToScreen>) =>
  reasonToSkipReadingDocuments({ ...callNotice, ...overrides }, now);

describe('reasonToSkipReadingDocuments', () => {
  test('an open call with documents is read', () => {
    expect(reason({})).toBeNull();
  });

  test('a call with no close date is read: the source not saying is no reason to skip', () => {
    expect(reason({ registrationCloses: null })).toBeNull();
  });

  test('a closed call is skipped', () => {
    expect(reason({ registrationCloses: closingIn(-1) })).toBe('closed');
  });

  test("Mapas's no-deadline sentinel and other closes past one year are skipped", () => {
    expect(reason({ registrationCloses: closingIn(366 * day) })).toBe('openEnded');
    expect(reason({ registrationCloses: { ...closingIn(0), at: Date.UTC(2111, 0, 1) } })).toBe(
      'openEnded',
    );
    expect(reason({ registrationCloses: closingIn(300 * day) })).toBeNull();
  });

  test('a draft or test title is skipped, whatever its case and accents', () => {
    expect(reason({ title: 'TESTE EDITAL' })).toBe('draftTitle');
    expect(reason({ title: 'Edital em construção' })).toBe('draftTitle');
    expect(reason({ title: 'Edital de Teatro e Contestação' })).toBeNull();
  });

  test('a call without documents is skipped', () => {
    expect(reason({ documentUrls: [] })).toBe('noDocuments');
  });
});

describe('callNoticeDocumentRoleFromUrl', () => {
  const roleOf = (fileName: string) =>
    callNoticeDocumentRoleFromUrl(
      `https://mapacultural.secult.ce.gov.br/files/opportunity/1/${fileName}`,
    );

  test('finds the call notice wherever it sits in the list, and its consolidated text', () => {
    expect(roleOf('edital-das-artes-e-cultura-de-reriutaba-2026-aldir-blanc.pdf')).toBe(
      'callNotice',
    );
    expect(roleOf('1editalpremio-cultura-viva.pdf')).toBe('callNotice');
    expect(roleOf('i-edital-de-chamamento-publico-n-06-11-008-2026.pdf')).toBe('callNotice');
    expect(roleOf('convocatoria-elt-formacao-30.pdf')).toBe('callNotice');
    expect(roleOf('01-consolidacao-pos-aditivo-edital-mecenas-do-ceara-2026-2.pdf')).toBe(
      'callNotice',
    );
  });

  test('keeps amendments, categories and evaluation criteria', () => {
    expect(roleOf('termo-de-reabertura-009-2026.pdf')).toBe('amendment');
    expect(roleOf('errata-ao-edital-008-2026.pdf')).toBe('amendment');
    expect(roleOf('anexo-i-categorias-tabela-de-vagas.doc')).toBe('categories');
    expect(roleOf('anexo-2-crit%C3%A9rio-de-avalia%C3%A7%C3%A3o.pdf')).toBe('criteria');
  });

  test('never reads results or lists of applicants: they carry personal data', () => {
    expect(roleOf('resultado-final-edital-006-2026.pdf')).toBeNull();
    expect(roleOf('ranking-1-edital-circulacao-e-intercambio-cultural.pdf')).toBeNull();
    expect(roleOf('lista-geral-de-inscritos-1-edital.pdf')).toBeNull();
    expect(roleOf('curriculo-lattes-2025.pdf')).toBeNull();
    expect(roleOf('lista_de_selecionados.pdf')).toBeNull();
  });

  test('a call for a profession ending in "lista" is still a call', () => {
    expect(roleOf('edital-instrumentalistas-2026.pdf')).toBe('callNotice');
    expect(roleOf('chamada-especialistas-em-patrimonio.pdf')).toBe('callNotice');
  });

  test('a notice named after the instrument it signs is still the notice', () => {
    expect(roleOf('edital-04-2026-projetos-termo-de-execucao-cultural.pdf')).toBe('callNotice');
    expect(roleOf('edital-06-2026-anexo-ii-formulario-de-inscricao.docx')).toBeNull();
    expect(roleOf('termo-de-execucao-cultural.pdf')).toBeNull();
  });

  test('skips the forms an applicant fills in and what it cannot name', () => {
    expect(roleOf('anexo-3-formulario-de-inscricao.docx')).toBeNull();
    expect(roleOf('anexo-vi-declaracao-de-residencia.docx')).toBeNull();
    expect(roleOf('anexo-1.pdf')).toBeNull();
  });
});

describe('documentsWorthReading', () => {
  const base = 'https://mapacultural.secult.ce.gov.br/files/opportunity/1';

  test('keeps the notice and its useful annexes, with their role', () => {
    expect(
      documentsWorthReading([
        `${base}/edital.pdf`,
        `${base}/anexo-i-categorias.pdf`,
        `${base}/anexo-3-formulario-de-inscricao.docx`,
      ]),
    ).toEqual([
      { url: `${base}/edital.pdf`, role: 'callNotice' },
      { url: `${base}/anexo-i-categorias.pdf`, role: 'categories' },
    ]);
  });

  test('keeps nothing when no file is the call notice itself', () => {
    expect(
      documentsWorthReading([`${base}/anexo-i-categorias.pdf`, `${base}/anexo-2-criterios.pdf`]),
    ).toEqual([]);
  });
});
