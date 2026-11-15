import type {
  CallNoticeWithMatch,
  MatchRequirement,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import {
  ApplicantTypeEnum,
  ArtFormEnum,
} from '@bratura/shared/entities/call-notice-extraction/entity';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { UF_NAME } from '@/features/common/content/uf-names';
import { CALL_NOTICES_CONTENT } from './content';

/** An art form's name; `any` is every area. */
/** What a call says of itself stays in the call's language, whatever the page's. */
export const CALL_NOTICE_LANGUAGE = 'pt-BR';

export function artFormName(artForm: string, locale: Locale) {
  const parsed = ArtFormEnum.safeParse(artForm);
  if (!parsed.success) return artForm;
  return parsed.data === 'any'
    ? CALL_NOTICES_CONTENT[locale].anyArtForm
    : CREATOR_LABELS[locale].culturalArea[parsed.data];
}

/** What a requirement asks, in the reader's words: the contract's values become their names. */
export function askedText({ kind, asked }: MatchRequirement, locale: Locale) {
  const content = CALL_NOTICES_CONTENT[locale];
  if (kind === 'artForm')
    return asked
      .split(',')
      .map((artForm) => artFormName(artForm, locale))
      .join(', ');
  if (kind === 'applicantType')
    return asked
      .split(',')
      .map((type) => {
        const parsed = ApplicantTypeEnum.safeParse(type);
        return parsed.success ? content.applicantType[parsed.data] : type;
      })
      .join(', ');
  return asked;
}

/** Whether `askedText` gives the call's own wording, in the call's language, not a name of ours. */
export function isAskedInTheCallsWording({ kind }: Pick<MatchRequirement, 'kind'>) {
  return kind === 'residence' || kind === 'document';
}

/** "Juazeiro do Norte · Ceará · Municipal", with what the call gives; `null` when it gives none. */
export function locationText(
  { city, state, coverage }: Pick<CallNoticeWithMatch, 'city' | 'state' | 'coverage'>,
  locale: Locale,
) {
  const parts = [
    city,
    state && UF_NAME[state],
    coverage && CALL_NOTICES_CONTENT[locale].coverage[coverage],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Why a call got its classification, in one or two sentences. */
export function justificationText({ match }: Pick<CallNoticeWithMatch, 'match'>, locale: Locale) {
  const content = CALL_NOTICES_CONTENT[locale].justification;
  if (match === null) return content.notRead;
  const { requirements } = match;
  const missing = requirements.filter((requirement) => requirement.status === 'notMet');
  const toConfirm = requirements.filter(
    (requirement) => requirement.status === 'needsConfirmation',
  ).length;
  return [
    content.met(
      requirements.filter((requirement) => requirement.status === 'met').length,
      requirements.length,
    ),
    missing.length > 0 &&
      content.missing(missing.map((requirement) => askedText(requirement, locale)).join('; ')),
    toConfirm > 0 && content.toConfirm(toConfirm),
  ]
    .filter(Boolean)
    .join(' ');
}
