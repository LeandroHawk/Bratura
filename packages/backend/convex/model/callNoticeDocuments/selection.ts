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
 * File-name rules, first match wins. `null` is never read: results and lists of applicants carry
 * personal data (`docs/security.md` §4), and forms are what an applicant fills in, not the rules.
 * `lista` only as a word: inside one it is a profession (instrumentalista), still a call.
 */
const documentRoleByFileName: [CallNoticeDocumentRole | null, RegExp][] = [
  [
    null,
    /resultado|ranking|(^|[-_.])lista|inscritos|convocacao|homologacao|curriculo|lattes|candidatos|habilitacao/,
  ],
  ['callNotice', /consolidacao/],
  ['amendment', /errata|aditivo|adendo|prorrogacao|reabertura|retifica/],
  // Before the forms rule: a notice's own name may describe what it signs ("termo de execução").
  ['callNotice', /^(\d+-?|i+-)?(edital|chamada|chamamento|convocatoria)(?!.*anexo)/],
  [
    null,
    /formulario|declaracao|modelo|ficha|relatorio|plano-de-trabalho|planilha|termo-de|minuta|carta|dados-bancarios|autorizacao/,
  ],
  ['criteria', /criterio|pontuacao|avaliacao/],
  ['categories', /categoria|vaga/],
  ['callNotice', /^(\d+-?|i+-)?(edital|chamada|chamamento|convocatoria)/],
];

/** What a document is to its call, from its file name; `null` when it is not worth reading. */
export function callNoticeDocumentRoleFromUrl(url: string): CallNoticeDocumentRole | null {
  let fileName: string;
  try {
    fileName = plainText(decodeURIComponent(new URL(url).pathname.split('/').pop() ?? ''));
  } catch {
    return null;
  }
  return documentRoleByFileName.find(([, pattern]) => pattern.test(fileName))?.[0] ?? null;
}

/**
 * The documents of a call worth reading, with their role. None when no file name identifies the
 * call notice itself: annexes alone are not read, and the call waits for the admin review.
 */
export function documentsWorthReading(documentUrls: string[]) {
  const withRoles = documentUrls.flatMap((url) => {
    const role = callNoticeDocumentRoleFromUrl(url);
    return role ? [{ url, role }] : [];
  });
  return withRoles.some(({ role }) => role === 'callNotice') ? withRoles : [];
}
