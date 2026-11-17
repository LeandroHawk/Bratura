import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { describe, expect, test } from 'vitest';
import {
  callNoticeDocumentRole,
  documentsWorthReading,
  postsResult,
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

describe('callNoticeDocumentRole', () => {
  const roleOf = (fileName: string) =>
    callNoticeDocumentRole(`https://mapacultural.secult.ce.gov.br/files/opportunity/1/${fileName}`);

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

  test('a numbered annex named after its notice is not the notice; the notice with its annexes is', () => {
    expect(roleOf('edital-flecha-anexo-3.pdf')).toBeNull();
    expect(roleOf('edital-ocupa-mis-2026-anexo10.pdf')).toBeNull();
    expect(roleOf('edital-003-anexo-vi-tec.pdf')).toBeNull();
    expect(roleOf('edital-ciclo-de-saberes-anexo-i.pdf')).toBeNull();
    expect(roleOf('edital-subsidio-cultural-anexo-1-cronograma.pdf')).toBeNull();
    expect(roleOf('edital-de-fomento-anexos-editaveis.docx')).toBeNull();
    expect(roleOf('edital-e-anexos-assinado.pdf')).toBe('callNotice');
    expect(roleOf('001-edital-004-2026-smct-multilinguagens-com-anexos.pdf')).toBe('callNotice');
    expect(roleOf('edital-conexoes-culturais-sem-anexos.pdf')).toBe('callNotice');
  });

  test('skips the forms an applicant fills in and what it cannot name', () => {
    expect(roleOf('anexo-3-formulario-de-inscricao.docx')).toBeNull();
    expect(roleOf('anexo-vi-declaracao-de-residencia.docx')).toBeNull();
    expect(roleOf('anexo-1.pdf')).toBeNull();
  });
});

describe('postsResult', () => {
  test('a preliminary or final list posts a result (Duque de Caxias), a "lista de documentos" does not', () => {
    expect(
      postsResult('https://x.rj.gov.br/files/a.pdf', 'LISTA PRELIMINAR DE SELEÇÃO Nº 06/2026'),
    ).toBe(true);
    expect(postsResult('https://x.rj.gov.br/files/lista-final-de-habilitacao.pdf')).toBe(true);
    expect(postsResult('https://x.rj.gov.br/files/a.pdf', 'Lista de documentos exigidos')).toBe(
      false,
    );
  });

  test('an appeal template shipped with the call posts no result (Salvador)', () => {
    const files = 'https://fgm.salvador.ba.gov.br/wp-content/uploads/2026/10';
    expect(
      postsResult(`${files}/ANEXO-XII-MODELO-DE-INTERPOSICAO-DE-RECURSO-QUANTO-AO-RESULTADO.docx`),
    ).toBe(false);
    expect(postsResult(`${files}/a.pdf`, 'Resultado da interposição de recursos')).toBe(true);
  });

  test("other applicant forms' words still post a result: they name results too (Paraná, Maranhão)", () => {
    const pr = 'https://www.cultura.pr.gov.br/sites/default/arquivos_restritos/files/documento';
    expect(postsResult(`${pr}/004-a_2026_merito.xlsx`, 'Planilha de classificados (.xls)')).toBe(
      true,
    );
    expect(
      postsResult('https://cultura.ma.gov.br/uploads/secma/docs/TERMO_DE_HOMOLOGAÇÃO.pdf'),
    ).toBe(true);
  });
});

describe('callNoticeDocumentRole on official pages (measured 2026-11-15)', () => {
  test("Rio's notice is a regulation, whatever number its file name starts with", () => {
    const rio = 'https://cultura.prefeitura.rio/wp-content/uploads/sites/38/2026/05';
    expect(
      callNoticeDocumentRole(`${rio}/0.-REGULAMENTO-SMC-No-04-DE-28-DE-MAIO-DE-2026.pdf`),
    ).toBe('callNotice');
  });

  test("reads the link's text when the file name says nothing", () => {
    const mg = 'https://www.secult.mg.gov.br/download/category/15-fundo-estadual-de-cultura-fec';
    expect(callNoticeDocumentRole(`${mg}?download=5062`, 'Edital FEC 02/2026 - Rainha Conga')).toBe(
      'callNotice',
    );
    expect(callNoticeDocumentRole(`${mg}?download=5062`)).toBeNull();
  });

  test("a link's text ending in the notice's word is the notice; a word inside another is not (Sesi SP)", () => {
    const media = 'https://cronos-media.sesisenaisp.org.br/api/media/1-0/files?file=arq_66.pdf';
    expect(callNoticeDocumentRole(media, 'Acesse o edital')).toBe('callNotice');
    expect(callNoticeDocumentRole(media, 'Confira o regulamento aqui')).toBe('callNotice');
    expect(callNoticeDocumentRole(media, 'Editais encerrados')).toBeNull();
    expect(callNoticeDocumentRole(media, 'Confira o resultado do edital')).toBeNull();
    expect(callNoticeDocumentRole(media, 'Extrato do edital')).toBeNull();
    expect(callNoticeDocumentRole(media, 'Extrato do Edital nº 01/2026')).toBeNull();
  });

  test('a rectified notice whose link names it is the notice, though its file name says "retificacao" (Spcine)', () => {
    const file =
      'https://spcine.com.br/wp-content/uploads/2026/10/EDITAL_01.2026_FSA_Producao_2aRetificacao.pdf';
    expect(callNoticeDocumentRole(file, 'CLIQUE AQUI PARA BAIXAR O EDITAL')).toBe('callNotice');
    expect(callNoticeDocumentRole(file)).toBe('amendment');
  });

  test("a link's text naming a prize or open registration is a notice; a form, extension or result about one is not", () => {
    const poa = 'https://prefeitura.poa.br/smc/noticias/x';
    expect(
      callNoticeDocumentRole(poa, 'Abertas as inscrições para o Prêmio Açorianos de Música 2026'),
    ).toBe('callNotice');
    expect(callNoticeDocumentRole(poa, 'Ficha de inscrição do Prêmio Açorianos')).toBeNull();
    expect(callNoticeDocumentRole(poa, 'Prorrogação das inscrições para o Prêmio')).toBe(
      'amendment',
    );
    expect(callNoticeDocumentRole(poa, 'Resultado do Prêmio Açorianos de Dança')).toBeNull();
    expect(callNoticeDocumentRole(poa, 'Anexo I - Prêmio Açorianos')).toBeNull();
  });

  test('a notice republished with its changes is the notice; a new schedule is an amendment', () => {
    const mg = 'https://www.secult.mg.gov.br/download/category/15?download=5063';
    expect(
      callNoticeDocumentRole(mg, 'Edital FEC 01/2026 - Afromineiridades - Retificado em 10/11/26'),
    ).toBe('callNotice');
    expect(callNoticeDocumentRole(mg, 'CRONOGRAMA ATUALIZADO.pdf')).toBe('amendment');
  });

  test("accepts Paraná's underscores and skips what a page posts around the notice", () => {
    const pr =
      'https://www.cultura.pr.gov.br/sites/default/arquivos_restritos/files/documento/2026-11';
    expect(callNoticeDocumentRole(`${pr}/0_edital_017_2026.pdf`)).toBe('callNotice');
    const ba = 'https://www.ba.gov.br/fundacaocultural/sites/site-funceb/files/2026-09';
    expect(
      callNoticeDocumentRole(`${ba}/x.pdf`, 'PORTARIA 220_2026 - Resultado Preliminar'),
    ).toBeNull();
    expect(callNoticeDocumentRole(`${ba}/x.pdf`, 'FAQ - Edital de Apoio a Espetaculos')).toBeNull();
    expect(
      callNoticeDocumentRole(`${ba}/x.pdf`, 'Portaria 270 - Convocação de suplentes'),
    ).toBeNull();
  });

  test('personal data in the file name rules out a link whose text looks like a notice', () => {
    const rio = 'https://cultura.prefeitura.rio/wp-content/uploads/sites/38/2026/11';
    expect(callNoticeDocumentRole(`${rio}/Resultado-Final-Teatro.pdf`, 'Edital Teatro')).toBeNull();
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

  test("uses each document's link text when the listing carries one", () => {
    const mg = 'https://www.secult.mg.gov.br/download/category/15';
    expect(
      documentsWorthReading(
        [`${mg}?download=1`, `${mg}?download=2`, `${mg}?download=3`],
        [
          { url: `${mg}?download=1`, label: 'Edital FEC 06/2026 - Coreto' },
          { url: `${mg}?download=2`, label: 'Anexo III - Critérios de avaliação' },
          { url: `${mg}?download=3`, label: 'Anexo I - Modelo de currículo do proponente' },
        ],
      ),
    ).toEqual([
      { url: `${mg}?download=1`, role: 'callNotice' },
      { url: `${mg}?download=2`, role: 'criteria' },
    ]);
  });
});
