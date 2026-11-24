import type {
  CallNoticeMatchChecks,
  MatchEligibilityRuleCheck,
  MatchRequirementCheck,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-details/query';
import type { CallNotice } from '@bratura/shared/entities/call-notice/entity';
import type { EligibilityRuleKind } from '@bratura/shared/entities/call-notice/enums/eligibility-rule/enum';
import {
  callNoticeDeadline,
  type CallNoticeDeadline,
} from '@bratura/shared/entities/call-notice/fragments/registration-window/fields';
import type { CallNoticeExtraction } from '@bratura/shared/entities/call-notice-extraction/entity';
import type { MatchProfile } from '@bratura/shared/entities/match/profile';
import { UF_NAME } from '@bratura/shared/primitives/external/uf/names';
import type {
  MatchCheckStatus,
  MatchPaperValidity,
} from '@bratura/shared/entities/match/enums/check-status/enum';
import type { MatchClassification } from '@bratura/shared/entities/match/enums/classification/enum';
import { PortfolioDocumentKindEnum } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import { portfolioDocumentStatus } from '@bratura/shared/entities/portfolio-item/kinds/document/variant';
import { plainDateInSaoPaulo } from '@bratura/shared/primitives/code/calendar/calendar';
import { plainText } from '../../lib/text';

type ExtractedForMatching = Pick<
  CallNoticeExtraction,
  'applicantTypes' | 'artForms' | 'requirements' | 'eligibilityRules' | 'residenceRequirement'
>;

export type CallNoticeMatch = CallNoticeMatchChecks & {
  /** Without the deadline: `matchClassificationOnDeadline` gives the answer a creator reads. */
  classification: MatchClassification;
};

/** A closed call is never `eligible`: nobody can apply to it. */
export function matchClassificationOnDeadline(
  classification: MatchClassification,
  deadline: CallNoticeDeadline,
): MatchClassification {
  return deadline === 'closed' ? 'notEligible' : classification;
}

/**
 * The one duration a rule's detail states ("18 (dezoito) anos", "6 meses"), in months; `null` when
 * it states none or several, so the rule stays "to confirm" instead of being guessed.
 */
export function monthsStatedIn(detail: string): number | null {
  const stated = [
    ...detail.matchAll(/(\d{1,3})\s*(?:\([^)]{1,40}\)\s*)?(anos?|m[eê]s(?:es)?)\b/giu),
  ];
  if (stated.length !== 1) return null;
  const [, amount = '', unit = ''] = stated[0] ?? [];
  return Number(amount) * (unit.toLowerCase().startsWith('ano') ? 12 : 1);
}

const plainWords = (text: string) =>
  plainText(text)
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();

/**
 * A place name must be complete; a city restriction cannot be satisfied by its state, and a state
 * answers only when the text names that state alone ("Morada Nova – CE" is a city in it).
 */
function residenceStatus(creator: MatchProfile['creator'], requirement: string): MatchCheckStatus {
  const text = plainWords(requirement);
  const city = plainWords(creator.city);
  const words = ` ${text} `;
  const namesCity = /\b(?:municipio|cidade)\b/u.test(text);
  const cityNamed =
    city.length > 0 &&
    words.includes(` ${city} `) &&
    !['de', 'do', 'da', 'dos', 'das'].some((part) => words.includes(` ${city} ${part} `));
  if (namesCity) return cityNamed ? 'met' : 'needsConfirmation';
  if (cityNamed) return 'met';
  const isNational =
    /^(?:brasil|territorio nacional|pais|todo o (?:brasil|territorio nacional|pais))$/u.test(text);
  const state = text.replace(/^estado d[aeo] /u, '');
  const uf = creator.state.toLowerCase();
  const stateName = plainWords(UF_NAME[creator.state]);
  // "São Paulo - SP" is also a city: name plus abbreviation counts only after "Estado do".
  const statePrefixed = state !== text;
  const stateNamed =
    [uf, stateName].includes(state) || (statePrefixed && state === `${stateName} ${uf}`);
  return stateNamed || isNational ? 'met' : 'needsConfirmation';
}

function monthsBetweenDates(from: string, to: string) {
  const [fromYear = 0, fromMonth = 0, fromDay = 0] = from.split('-').map(Number);
  const [toYear = 0, toMonth = 0, toDay = 0] = to.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) - (toDay < fromDay ? 1 : 0);
}

const metWhen = (isMet: boolean): MatchCheckStatus => (isMet ? 'met' : 'notMet');

/** A minimum rule worded as a maximum ("há, no máximo, 2 anos") is never read as a minimum. */
const namesAMaximum = (detail: string) => /maxim[oa]/u.test(plainText(detail));

/** "Até 27 anos", "no máximo 35 anos": a ceiling; "menores de 18 anos não podem" is not one. */
function statesACeiling(detail: string) {
  const words = new Set(plainWords(detail).split(' '));
  return ['ate', 'maximo', 'maxima'].some((word) => words.has(word)) && !words.has('nao');
}

// A rule the profile can answer, by kind; every other kind stays "to confirm".
const answerOfRule: Partial<
  Record<
    EligibilityRuleKind,
    (creator: MatchProfile['creator'], detail: string, today: string) => MatchCheckStatus
  >
> = {
  maximumAge: ({ birthDate }, detail, today) => {
    if (!statesACeiling(detail)) return 'needsConfirmation';
    const months = monthsStatedIn(detail);
    if (birthDate === null || months === null) return 'needsConfirmation';
    return metWhen(
      Math.floor(monthsBetweenDates(birthDate, today) / 12) <= Math.floor(months / 12),
    );
  },
  minimumAge: ({ birthDate }, detail, today) => {
    if (namesAMaximum(detail)) return 'needsConfirmation';
    const months = monthsStatedIn(detail);
    if (birthDate === null || months === null) return 'needsConfirmation';
    return metWhen(monthsBetweenDates(birthDate, today) >= months);
  },
  residenceTime: ({ livesInCurrentPlaceSince }, detail, today) => {
    if (namesAMaximum(detail)) return 'needsConfirmation';
    const months = monthsStatedIn(detail);
    if (livesInCurrentPlaceSince === null || months === null) return 'needsConfirmation';
    // Enough time is not the right place: only a too-short time is answered.
    return monthsBetweenDates(livesInCurrentPlaceSince, today) >= months
      ? 'needsConfirmation'
      : 'notMet';
  },
  publicServantExclusion: ({ isPublicServant }) =>
    isPublicServant === null ? 'needsConfirmation' : metWhen(!isPublicServant),
  minimumExperience: ({ activityStartYear }, detail, today) => {
    if (namesAMaximum(detail)) return 'needsConfirmation';
    const months = monthsStatedIn(detail);
    if (activityStartYear === null || months === null) return 'needsConfirmation';
    return metWhen((Number(today.slice(0, 4)) - activityStartYear) * 12 >= months);
  },
};

/**
 * How one call fits one profile, by objective rules over the extraction (prompt v4). What lowers
 * the answer: a rule the profile fails (`notEligible`); a paper asked to apply that the portfolio
 * lacks, or an applicant type the call does not list (`almostEligible`: the list errs low, so
 * absence is never an exclusion). An item asked only after selection, or one only the creator can
 * confirm, never lowers it.
 */
export function matchCallNotice(
  { creator, portfolioItems }: MatchProfile,
  extraction: ExtractedForMatching,
  { registrationCloses }: Pick<CallNotice, 'registrationCloses'>,
  now: number,
): CallNoticeMatch {
  const today = plainDateInSaoPaulo(now);
  const closesOn =
    registrationCloses !== null && callNoticeDeadline({ registrationCloses }, now) === 'open'
      ? plainDateInSaoPaulo(registrationCloses.at)
      : null;
  const documents = portfolioItems.filter((item) => item.kind === 'document');
  const hasExperiences = portfolioItems.some((item) => item.kind === 'culturalExperience');
  const hasActivityProof = portfolioItems.some(
    (item) => item.kind === 'culturalExperience' && item.hasProof,
  );

  function paperCheck(
    kind: MatchRequirementCheck['kind'],
  ): Pick<MatchRequirementCheck, 'status' | 'paperValidity'> {
    const portfolioKind = PortfolioDocumentKindEnum.safeParse(kind);
    // Not a paper a portfolio keeps (a proposal, a form), or `other`: two "others" are not one.
    if (!portfolioKind.success || portfolioKind.data === 'other')
      return { status: 'needsConfirmation', paperValidity: null };
    if (portfolioKind.data === 'portfolioOrActivityProof' && hasActivityProof)
      return { status: 'met', paperValidity: null };
    if (portfolioKind.data === 'curriculum' && hasExperiences)
      return { status: 'met', paperValidity: null };
    const ofKind = documents
      .filter((document) => document.documentKind === portfolioKind.data)
      .map((document) => ({ ...document, status: portfolioDocumentStatus(document, today) }));
    const registered = ofKind.filter(({ status }) => status !== 'expired' && status !== 'pending');
    if (registered.length === 0) {
      const isExpired = ofKind.some(({ status }) => status === 'expired');
      return { status: 'notMet', paperValidity: isExpired ? 'expired' : null };
    }
    if (portfolioKind.data === 'identity')
      return { status: 'needsConfirmation', paperValidity: null };
    const lastsUntilClose = registered.some(
      ({ validUntil }) => validUntil === null || closesOn === null || validUntil >= closesOn,
    );
    const paperValidity: MatchPaperValidity = lastsUntilClose ? 'valid' : 'expiresBeforeClose';
    return { status: 'met', paperValidity };
  }

  const requirements: MatchRequirementCheck[] = extraction.requirements
    .filter(({ appliesTo }) => appliesTo === null || appliesTo.includes(creator.applicantType))
    .map(({ kind, detail, stage, quote }) => ({ kind, detail, stage, quote, ...paperCheck(kind) }));

  const eligibilityRules: MatchEligibilityRuleCheck[] = extraction.eligibilityRules.map((rule) => ({
    ...rule,
    status: answerOfRule[rule.kind]?.(creator, rule.detail, today) ?? 'needsConfirmation',
  }));

  const applicantType = extraction.applicantTypes && {
    ...extraction.applicantTypes,
    status: extraction.applicantTypes.value.includes(creator.applicantType)
      ? ('met' as const)
      : ('needsConfirmation' as const),
  };

  const culturalAreas: string[] = [
    creator.mainCulturalArea,
    ...creator.secondaryCulturalAreas,
  ].filter((area) => area !== null);
  const artFormStatus: MatchCheckStatus | null =
    extraction.artForms.length === 0
      ? null
      : extraction.artForms.some(({ value }) => value === 'any' || culturalAreas.includes(value))
        ? 'met'
        : 'needsConfirmation';

  const residence = extraction.residenceRequirement && {
    ...extraction.residenceRequirement,
    status: residenceStatus(creator, extraction.residenceRequirement.value),
  };

  const failsARule = eligibilityRules.some(({ status }) => status === 'notMet');
  const lacksAPaperToApply = requirements.some(
    ({ stage, status }) => stage !== 'afterSelection' && status === 'notMet',
  );
  const classification: MatchClassification = failsARule
    ? 'notEligible'
    : lacksAPaperToApply ||
        applicantType?.status === 'needsConfirmation' ||
        residence?.status === 'needsConfirmation' ||
        artFormStatus === 'needsConfirmation'
      ? 'almostEligible'
      : 'eligible';

  return {
    classification,
    applicantType,
    residence,
    artFormStatus,
    requirements,
    eligibilityRules,
  };
}

/** The largest amount one project gets; the call's total budget is not a project's amount. */
export function largestAmountPerProjectInCents({
  amountsPerProject,
}: Pick<CallNoticeExtraction, 'amountsPerProject'>): number | null {
  return amountsPerProject.length === 0
    ? null
    : Math.max(...amountsPerProject.map(({ amountInCents }) => amountInCents));
}

/** The call's art forms, each once: the extraction lists one per passage that names it. */
export function distinctArtFormValues(
  extraction: Pick<CallNoticeExtraction, 'artForms'> | null,
): CallNoticeExtraction['artForms'][number]['value'][] {
  return [...new Set(extraction?.artForms.map(({ value }) => value))];
}
