import type { CallNotice } from '@bratura/shared/entities/call-notice/entity';
import {
  callNoticeDeadline,
  openEndedRegistrationAfterMs,
} from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import type { CallNoticeDocumentRole } from '@bratura/shared/entities/call-notice-document/fragments/identity/fields';
import { plainText } from '../../lib/text';

// Which calls and which of their files are worth Firecrawl credits, decided before any read, from
// the listing alone. Measured on 254 real files (2026-11-14): `docs/integrations/firecrawl.md`.

/**
 * The closes worth reading, for the close-date index: those `callNoticeDeadline` calls `open`.
 * A call with no close date (`notInformed`) is read too, found apart.
 */
export const readableRegistrationCloses = (now: number) => ({
  from: now,
  to: now + openEndedRegistrationAfterMs,
});

/**
 * Titles that are no call, compared without accents or case: drafts and tests, the accountability
 * a call's winners file (Maringá, 2026-11-17: "Prestação de Contas - FOMENTO…", open to 01/12 with
 * the old notice attached), a staff election (Spcine: "Edital de Eleição de Representantes dos
 * Funcionários").
 */
const notACallTitlePattern =
  /\b(teste|em construcao|prestacao de contas|eleicao de representantes)\b/;

type CallNoticeToScreen = Pick<CallNotice, 'title' | 'documentUrls' | 'registrationCloses'>;

export type ReasonToSkipReadingDocuments = 'closed' | 'openEnded' | 'notACallTitle' | 'noDocuments';

/** Why a call notice's documents are not worth credits, or `null` to read them. */
export function reasonToSkipReadingDocuments(
  { title, documentUrls, registrationCloses }: CallNoticeToScreen,
  now: number,
): ReasonToSkipReadingDocuments | null {
  const deadline = callNoticeDeadline({ registrationCloses }, now);
  if (deadline === 'closed' || deadline === 'openEnded') return deadline;
  if (notACallTitlePattern.test(plainText(title))) return 'notACallTitle';
  if (documentUrls.length === 0) return 'noDocuments';
  return null;
}

/**
 * A result posted about a call: it names who was picked, and says registration is over. Duque de
 * Caxias posts them as "Lista preliminar/final de seleção" (2026-11-15).
 */
const resultName =
  /resultado|homologa|classificad|selecionad|suplente|(^|-)lista-(preliminar|final)/;

/**
 * Never read, whatever else the name says: results, rankings and lists of applicants carry personal
 * data (`docs/security.md` §4). `lista` only as a word: inside one it is a profession
 * (instrumentalista), still a call.
 */
const personalDataName = new RegExp(
  `${resultName.source}|ranking|(^|[-_.])lista|inscritos|convocacao|curriculo|lattes|candidatos|habilitacao|aprovad`,
);

/** The words a call notice's own name starts with. */
const noticeWords = 'edital|chamada|chamamento|convocatoria';

/**
 * What a notice's name may start with before its word (in `nameOf` terms): a number ("0.", "01-"),
 * a roman numeral, or its SEI document number ("sei-9911864-edital-6-1.pdf", Maringá, 2026-11-17).
 */
const noticeNamePrefix = '(\\d+[-_.]*|i+-|sei-\\d+-)?';

/**
 * Name rules, first match wins; `null` is never read: forms are what an applicant fills in, not the
 * rules, and procurement or notices about a call are not the call. A contract signed without a call
 * ("inexigibilidade", Funesc's "TERMO INEX CHAMAMENTO PUBLICO", 2026-11-17) is procurement too.
 */
const documentRoleByName: [CallNoticeDocumentRole | null, RegExp][] = [
  ['callNotice', /consolidacao/],
  // A notice republished whole with its changes (Minas Gerais: "Edital FEC 02/2026 - Retificado").
  [
    'callNotice',
    new RegExp(`^${noticeNamePrefix}(${noticeWords})(?!.*anexo).*(retificad|consolidad)`),
  ],
  [
    'amendment',
    /errata|aditivo|adendo|prorrogacao|reabertura|retifica|cronograma-(atualizado|alterado|retificado)/,
  ],
  // Before the forms rule: a notice's own name may describe what it signs ("termo de execução").
  // A council's resolution can be the rules (São Bernardo, Natal on Mapas, 2026-11-17).
  [
    'callNotice',
    new RegExp(`^${noticeNamePrefix}(${noticeWords}|regulamento|resolucao)(?!.*anexo)`),
  ],
  [
    null,
    /formulario|declaracao|modelo|ficha|relatorio|plano-de-trabalho|planilha|termo-de|minuta|carta|dados-bancarios|autorizacao|portaria|comunicado|justificativa|faq|pregao|inexigib|(^|-)inex-/,
  ],
  ['criteria', /criterio|pontuacao|avaliacao/],
  ['categories', /categoria|vaga/],
  // The notice bundled with its annexes ("edital-e-anexos"), never one numbered annex
  // ("edital-flecha-anexo-3", "edital-003-anexo-vi-tec") nor the editable annexes.
  [
    'callNotice',
    new RegExp(
      `^${noticeNamePrefix}(${noticeWords}|regulamento)(?!.*anexo-?(\\d|[ivx]+([-.]|$))|.*editave)`,
    ),
  ],
];

/**
 * Words that name the call anywhere in a link's text, ending it or not: "Acesse o edital",
 * "Confira o regulamento aqui" (Sesi SP), a news title naming its prize or open registration
 * ("Abertas as inscrições para o Prêmio Açorianos…", Porto Alegre). Never an annex or the
 * gazette's extract of the notice ("Extrato do edital").
 */
const labelNoticeWords = `${noticeWords}|processo-seletivo|regulamento|premio|inscricoes-(abertas|para)`;

/**
 * A link's text only, last: a notice word later in it ("Centro de Formação em Artes - Convocatória
 * ..."). File names keep their measured rules: there it also matches extracts and FAQs.
 */
const labelRoles: [CallNoticeDocumentRole | null, RegExp][] = [
  ...documentRoleByName,
  ['callNotice', new RegExp(`^(?!.*(anexo|extrato))(.*-)?(${labelNoticeWords})(-|$)`)],
];

/** A file name or a link's text in the rules' terms: no accents, lower case, words joined by -. */
function nameOf(text: string) {
  return plainText(text)
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** A URL's last path segment, decoded (`EDITAL 027.pdf`); empty when it does not decode. */
export function fileNameOf(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
  } catch {
    return '';
  }
}

/**
 * What a document is to its call, from its link's text when the source gives one, else its file
 * name; `null` when it is not worth reading. Personal data in either one rules it out.
 */
export function callNoticeDocumentRole(url: string, label?: string): CallNoticeDocumentRole | null {
  const named = [
    { name: label ? nameOf(label) : '', rules: labelRoles },
    { name: nameOf(fileNameOf(url)), rules: documentRoleByName },
  ].filter(({ name }) => name);
  if (named.length === 0 || named.some(({ name }) => personalDataName.test(name))) return null;
  for (const { name, rules } of named) {
    const rule = rules.find(([, pattern]) => pattern.test(name));
    if (rule) return rule[0];
  }
  return null;
}

/**
 * A template an applicant fills to appeal a result, shipped with the open call (Salvador's "Anexo
 * XII - Modelo de interposição de recurso quanto ao resultado"): no result is posted yet. Narrower
 * than the forms `documentRoleByName` skips: a "planilha" or a "termo de" can be the result itself.
 */
const resultTemplateName = /modelo/;

/** Whether a document's link text or file name says a result was posted (`resultName`). */
export function postsResult(url: string, label?: string) {
  return [label ?? '', fileNameOf(url)].some((name) => {
    const plain = nameOf(name);
    return resultName.test(plain) && !resultTemplateName.test(plain);
  });
}

/**
 * The documents of a call worth reading, with their role. None when nothing identifies the call
 * notice itself: annexes alone are not read, and the call waits for the admin review.
 */
export function documentsWorthReading(
  documentUrls: string[],
  documentLabels: { url: string; label: string }[] = [],
) {
  const labelOf = new Map(documentLabels.map(({ url, label }) => [url, label]));
  const withRoles = documentUrls.flatMap((url) => {
    const role = callNoticeDocumentRole(url, labelOf.get(url));
    return role ? [{ url, role }] : [];
  });
  return withRoles.some(({ role }) => role === 'callNotice') ? withRoles : [];
}
