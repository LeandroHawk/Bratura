import { ianaTimeZone } from '@bratura/shared/primitives/code/time/time-zone/fields';
import { describe, expect, test } from 'vitest';
import {
  callNoticeDocumentRole,
  documentsWorthReading,
  postsResult,
  queueOrder,
  readableRegistrationCloses,
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

  test('a closed call is read too: what it asked still counts', () => {
    expect(reason({ registrationCloses: closingIn(-1) })).toBeNull();
  });

  test("Mapas's no-deadline sentinel and other closes past one year are skipped", () => {
    expect(reason({ registrationCloses: closingIn(366 * day) })).toBe('openEnded');
    expect(reason({ registrationCloses: { ...closingIn(0), at: Date.UTC(2111, 0, 1) } })).toBe(
      'openEnded',
    );
    expect(reason({ registrationCloses: closingIn(300 * day) })).toBeNull();
  });

  test('a draft, test, accountability, management contract or staff election title is skipped, whatever its case and accents', () => {
    expect(reason({ title: 'TESTE EDITAL' })).toBe('notACallTitle');
    expect(reason({ title: 'Edital em construção' })).toBe('notACallTitle');
    expect(reason({ title: 'Prestação de Contas - FOMENTO ANICETO MATTI 2024' })).toBe(
      'notACallTitle',
    );
    expect(reason({ title: 'Contrato de Gestão' })).toBe('notACallTitle');
    expect(
      reason({
        title: 'Exclusivo para Funcionários da Spcine | Edital de Eleição de Representantes',
      }),
    ).toBe('notACallTitle');
    expect(reason({ title: 'Edital de Teatro e Contestação' })).toBeNull();
  });

  test("a council election or meeting sign-up is skipped (Santa Luzia's Mapas)", () => {
    for (const title of [
      'ELEIÇÃO DOS MEMBROS REPRESENTANTES DA SOCIEDADE CIVIL NO CONSELHO MUNICIPAL',
      'EDITAL DE ELEIÇÃO DOS CONSELHEIROS REPRESENTANTES DA SOCIEDADE CIVIL',
      'INSCRIÇÃO PARA PARTICIPAÇÃO EM REUNIÃO DO CMPC (13/11/26)',
      ' Inscrição para participação em Reunião extraordinária do CMPC',
      'INSCRIÇÃO PARA PARTICIPAR DE REUNIÃO EXTRAORDINÁRIA DO CMPC (31/10/25)',
    ]) {
      expect(reason({ title })).toBe('notACallTitle');
    }
  });

  test('a temporary staff hire is skipped (FCP-PA); a selection of artists is not', () => {
    expect(
      reason({ title: 'PROCESSO SELETIVO SIMPLIFICADO Nº 01/2026 - FCP DE 24 DE MARÇO DE 2026' }),
    ).toBe('notACallTitle');
    expect(reason({ title: 'Processo Seletivo de Profissionais' })).toBeNull();
  });

  test("a cooperation project's consultant hire or a market survey is skipped (IPHAN); its prizes are not", () => {
    for (const title of [
      'Projeto 914BRZ4027 Edital nº 67/2026: Perfil Gestão - Iphan/SEDE - Brasília/DF',
      'PROJETO 914BRZ4018 EDITAL Nº 001/2025 - Perfil: 1/2025-CGNT-DEPAM – Porto Nacional/TO',
      'EDITAL IPHAN Nº 11 - CONSULTA PRELIMINAR DE MERCADO (RFI) PARA REFINAMENTO DE DESAFIOS',
    ]) {
      expect(reason({ title })).toBe('notACallTitle');
    }
    expect(
      reason({ title: 'Prêmio Mário de Andrade de Fotografias Etnográficas - Edição 2026' }),
    ).toBeNull();
  });

  test("a call's appeal or review step opened as its own item is skipped; raising funds is a call", () => {
    for (const title of [
      'Recurso - Edital Intercâmbio Circulação Audiovisual 2026',
      'Formulário de Recurso (Resultado 13/11/2026) - Credenciamento Nacional de Pareceristas',
      'RECURSO - FASE SELEÇÃO - PNAB CICLO 2 - Edital 04/2026 - SUBSÍDIO A ESPAÇOS CULTURAIS',
      'CONTRARRAZÕES, RECURSO DE MÉRITO E DILIGÊNCIA - ETAPA DE SELEÇÃO - PNAB CICLO 2',
      'Fase Avaliação Preliminar - Edital Chamamento PNAB 01/2026 - Ritmos da Terra',
    ]) {
      expect(reason({ title })).toBe('notACallTitle');
    }
    expect(
      reason({ title: 'BOMBINHAS - EDITAL 01/FMCB/2026 – CAPTAÇÃO DE RECURSOS VIA LEI ROUANET' }),
    ).toBeNull();
    expect(reason({ title: 'Edital de Recursos para a Cultura 2026' })).toBeNull();
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

  test('a link named as an annex is no notice, though its file name says "edital" (Itaperuna)', () => {
    const file = 'https://prefeituraitaperuna.com.br/sistema-inscricoes/public/edital_arquivo.php';
    expect(callNoticeDocumentRole(`${file}?id=97`, 'Edital')).toBe('callNotice');
    expect(callNoticeDocumentRole(`${file}?id=12`, 'Anexo II')).toBeNull();
    expect(callNoticeDocumentRole(`${file}?id=93`, 'Anexo I')).toBeNull();
    expect(callNoticeDocumentRole(`${file}?id=19`, 'Anexo I - Categorias')).toBe('categories');
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
    const rj = 'http://cultura.rj.gov.br/wp-content/uploads/2026/02';
    expect(
      callNoticeDocumentRole(
        `${rj}/Edital-Cultura-e-F%C3%A9_COm-Retifica%C3%A7%C3%B5es_26022025.pdf`,
        'Edital – com retificações',
      ),
    ).toBe('callNotice');
    expect(
      callNoticeDocumentRole(
        `${rj}/Cultura-e-F%C3%A9_Ret.-Anexo-09_DOERJ26022025.pdf`,
        'Publicação de retificações',
      ),
    ).toBe('amendment');
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

  test('a notice may start with its SEI document number; a decree with one is still no notice (Maringá)', () => {
    const mga = 'https://maringacultura.maringa.pr.gov.br/files/opportunity/912';
    expect(callNoticeDocumentRole(`${mga}/sei-9911864-edital-6-1.pdf`)).toBe('callNotice');
    expect(callNoticeDocumentRole(`${mga}/sei_179381701_edital_21-pdf`)).toBe('callNotice');
    expect(callNoticeDocumentRole(`${mga}/sei_179379910_portaria_209-pdf`)).toBeNull();
    expect(callNoticeDocumentRole(`${mga}/sei-9759096-notificacao-n-26.pdf`)).toBeNull();
    expect(callNoticeDocumentRole(`${mga}/sei-9911864-edital-6-retificado.pdf`)).toBe('callNotice');
  });

  test("a council's resolution can be the rules; one annexed to them is not (São Bernardo, Natal)", () => {
    const sbc = 'https://mapacultural.saobernardo.sp.gov.br/files/opportunity/292';
    expect(callNoticeDocumentRole(`${sbc}/resolucao-sc-37-encontro-de-corais-04nov.pdf`)).toBe(
      'callNotice',
    );
    const pe = 'https://www.mapacultural.pe.gov.br/files/opportunity/2491';
    expect(
      callNoticeDocumentRole(`${pe}/anexo-i-resolucao-cd-funcultura-01-2025-banco.pdf`),
    ).toBeNull();
  });

  test('a contract signed without a call is procurement, though its text names a chamamento (Funesc)', () => {
    const funesc = 'https://funesc.pb.gov.br/editais/ratificacoes';
    expect(
      callNoticeDocumentRole(
        `${funesc}/termo-inex-chamamento-publico-fec-prc-2025-01160-termo-fomento-002-2025-arribaca.pdf`,
        'TERMO INEX CHAMAMENTO PUBLICO -TERMO FOMENTO 002 2025 ARRIBACA',
      ),
    ).toBeNull();
    expect(
      callNoticeDocumentRole(`${funesc}/x.pdf`, 'Ratificação de Inexigiblidade n° 154'),
    ).toBeNull();
    expect(
      callNoticeDocumentRole(`${funesc}/x.pdf`, 'Edital de Chamamento Público nº 004/2026'),
    ).toBe('callNotice');
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

  test("the call's own page listed as a document is its notice, whatever its link text (TransArtists)", () => {
    const page = 'https://www.transartists.org/en/news/traces-art-science-energypolis';
    expect(
      documentsWorthReading([page], [{ url: page, label: 'TRACES Art & Science @ Energypolis' }]),
    ).toEqual([]);
    expect(
      documentsWorthReading(
        [page],
        [{ url: page, label: 'TRACES Art & Science @ Energypolis' }],
        page,
      ),
    ).toEqual([{ url: page, role: 'callNotice' }]);
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

describe('queueOrder', () => {
  test('open calls closing soonest first, then undated ones, then closed ones, latest closed first', () => {
    const calls = {
      closedLongAgo: closingIn(-30 * day),
      undated: null,
      later: closingIn(30 * day),
      closedYesterday: closingIn(-day),
      sooner: closingIn(day),
    };
    const ordered = Object.entries(calls)
      .map(([name, registrationCloses]) => ({ name, registrationCloses }))
      .sort(queueOrder(now))
      .map(({ name }) => name);
    expect(ordered).toEqual(['sooner', 'later', 'undated', 'closedYesterday', 'closedLongAgo']);
  });
});

describe('readableRegistrationCloses', () => {
  test('reaches a year back for closed calls and a year ahead for open ones', () => {
    const { from, to } = readableRegistrationCloses(now);
    expect([from <= now - 364 * day, from > now - 366 * day]).toEqual([true, true]);
    expect([to >= now + 364 * day, to < now + 366 * day]).toEqual([true, true]);
  });
});
