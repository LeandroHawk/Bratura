import type { CallNotice } from '@bratura/shared/entities/call-notice/entity';
import {
  callNoticeDeadline,
  openEndedRegistrationAfterMs,
} from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import type { CallNoticeDocumentRole } from '@bratura/shared/entities/call-notice-document/fragments/identity/fields';

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

/** Mapas titles of drafts and tests, compared without accents or case. */
const draftTitlePattern = /\b(teste|em construcao)\b/;

const plainText = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

type CallNoticeToScreen = Pick<CallNotice, 'title' | 'documentUrls' | 'registrationCloses'>;

export type ReasonToSkipReadingDocuments = 'closed' | 'openEnded' | 'draftTitle' | 'noDocuments';

/** Why a call notice's documents are not worth credits, or `null` to read them. */
export function reasonToSkipReadingDocuments(
  { title, documentUrls, registrationCloses }: CallNoticeToScreen,
  now: number,
): ReasonToSkipReadingDocuments | null {
  const deadline = callNoticeDeadline({ registrationCloses }, now);
  if (deadline === 'closed' || deadline === 'openEnded') return deadline;
  if (draftTitlePattern.test(plainText(title))) return 'draftTitle';
  if (documentUrls.length === 0) return 'noDocuments';
  return null;
}

/**
 * Never read, whatever else the name says: results, rankings and lists of applicants carry personal
 * data (`docs/security.md` §4). `lista` only as a word: inside one it is a profession
 * (instrumentalista), still a call.
 */
const personalDataName =
  /resultado|ranking|(^|[-_.])lista|inscritos|convocacao|homologacao|curriculo|lattes|candidatos|habilitacao|suplente|selecionad|classificad|aprovad/;

/**
 * Name rules, first match wins; `null` is never read: forms are what an applicant fills in, not the
 * rules, and procurement or notices about a call are not the call.
 */
const documentRoleByName: [CallNoticeDocumentRole | null, RegExp][] = [
  ['callNotice', /consolidacao/],
  // A notice republished whole with its changes (Minas Gerais: "Edital FEC 02/2026 - Retificado").
  ['callNotice', /^(edital|chamada|chamamento|convocatoria)(?!.*anexo).*(retificad|consolidad)/],
  [
    'amendment',
    /errata|aditivo|adendo|prorrogacao|reabertura|retifica|cronograma-(atualizado|alterado|retificado)/,
  ],
  // Before the forms rule: a notice's own name may describe what it signs ("termo de execução").
  [
    'callNotice',
    /^(\d+[-_.]*|i+-)?(edital|chamada|chamamento|convocatoria|regulamento)(?!.*anexo)/,
  ],
  [
    null,
    /formulario|declaracao|modelo|ficha|relatorio|plano-de-trabalho|planilha|termo-de|minuta|carta|dados-bancarios|autorizacao|portaria|comunicado|justificativa|faq|pregao/,
  ],
  ['criteria', /criterio|pontuacao|avaliacao/],
  ['categories', /categoria|vaga/],
  ['callNotice', /^(\d+[-_.]*|i+-)?(edital|chamada|chamamento|convocatoria|regulamento)/],
];

/**
 * A link's text only, last: a notice word later in it ("Centro de Formação em Artes - Convocatória
 * ..."). File names keep their measured rules: there it also matches extracts and FAQs.
 */
const labelRoles = [
  ...documentRoleByName,
  [
    'callNotice',
    /^(?!.*anexo)(.*-)?(edital|chamada|chamamento|convocatoria|processo-seletivo)-/,
  ] as const,
];

/** A file name or a link's text in the rules' terms: no accents, lower case, words joined by -. */
function nameOf(text: string) {
  return plainText(text)
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fileNameOf(url: string) {
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
