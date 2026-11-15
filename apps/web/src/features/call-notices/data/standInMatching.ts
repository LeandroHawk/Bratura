import type {
  CallNoticeMatch,
  MatchRequirement,
} from '@bratura/shared/entities/call-notice/dto/bratura-portal/eligible-call-notices/query';
import type { CallNoticeOverviewItem } from '@bratura/shared/entities/call-notice/dto/bratura-portal/call-notice-overview/query';
import type { ApplicantType } from '@bratura/shared/entities/call-notice-extraction/entity';
import type { Creator } from '@bratura/shared/entities/creator/entity';
import type { CreatorProfileType } from '@bratura/shared/entities/creator/enums/profile-type/enum';
import type { PortfolioItem } from '@bratura/shared/entities/portfolio-item/entity';
import type { PortfolioDocumentKind } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import { portfolioDocumentStatus } from '@bratura/shared/entities/portfolio-item/kinds/document/variant';
import { plainDateInSaoPaulo } from '@bratura/shared/primitives/code/calendar/calendar';

/**
 * STAND-IN for the backend's `matching` (`packages/backend/AGENTS.md`): the fit of a call is the
 * backend's to compute and the web's to display. Until that query exists, these objective rules run
 * here so the screens answer to the portfolio. Delete this file when `matches` is read from Convex.
 */

// A MEI is a person with a registration: the CCMEI the call asks for is what proves it.
const APPLICANT_TYPES_OF_PROFILE: Record<CreatorProfileType, ApplicantType[]> = {
  individual: ['individual', 'mei'],
  nonprofitLegalEntity: ['nonprofit'],
  forProfitLegalEntity: ['company'],
  informalGroup: ['collectiveWithoutCnpj'],
  rightsCouncil: [],
  publicOrganization: [],
};

// Order matters: "comprovante de residência" must not be read as a CPF, nor "CPF ou CNPJ" as one.
const DOCUMENT_KIND_BY_WORDING: [RegExp, PortfolioDocumentKind][] = [
  [/ccmei/i, 'ccmei'],
  [/sicab/i, 'sicab'],
  [/resid[êe]ncia|endere[çc]o/i, 'proofOfResidence'],
  [/atua[çc][ãa]o cultural/i, 'proofOfCulturalExperience'],
  [/^cpf$/i, 'cpf'],
  [/^cnpj$/i, 'cnpj'],
];

function documentKindFromWording(asked: string) {
  return DOCUMENT_KIND_BY_WORDING.find(([wording]) => wording.test(asked.trim()))?.[1] ?? null;
}

/** How one read call fits one portfolio; `null` when the call's documents were not read. */
export function standInMatch(
  { extraction }: Pick<CallNoticeOverviewItem, 'extraction'>,
  creator: Creator,
  portfolioItems: PortfolioItem[],
  now: number,
): CallNoticeMatch | null {
  if (extraction === null) return null;
  const today = plainDateInSaoPaulo(now);
  const registeredKinds = new Set(
    portfolioItems
      .filter((item) => item.kind === 'document')
      .filter((item) => portfolioDocumentStatus(item, today) === 'registered')
      .map((item) => item.documentKind),
  );
  const requirements: MatchRequirement[] = [];

  if (extraction.applicantTypes) {
    const { value, quote } = extraction.applicantTypes;
    const accepted = APPLICANT_TYPES_OF_PROFILE[creator.profileType];
    requirements.push({
      kind: 'applicantType',
      status: value.some((type) => accepted.includes(type)) ? 'met' : 'notMet',
      asked: value.join(','),
      quote,
      documentKind: null,
    });
  }

  if (extraction.artForms.length > 0) {
    const areas = [creator.mainCulturalArea, ...creator.secondaryCulturalAreas];
    const asked = extraction.artForms.map((artForm) => artForm.value);
    requirements.push({
      kind: 'artForm',
      status:
        creator.mainCulturalArea === null
          ? 'needsConfirmation'
          : asked.some((artForm) => artForm === 'any' || areas.includes(artForm))
            ? 'met'
            : 'notMet',
      asked: asked.join(','),
      quote: extraction.artForms.map((artForm) => artForm.quote).join(' '),
      documentKind: null,
    });
  }

  if (extraction.residenceRequirement)
    requirements.push({
      kind: 'residence',
      // Written in words: only the person can say whether they live there for that long.
      status: 'needsConfirmation',
      asked: extraction.residenceRequirement.value,
      quote: extraction.residenceRequirement.quote,
      documentKind: null,
    });

  for (const { value, quote } of extraction.requiredDocuments) {
    const documentKind = documentKindFromWording(value);
    requirements.push({
      kind: 'document',
      status:
        documentKind === null
          ? 'needsConfirmation'
          : registeredKinds.has(documentKind)
            ? 'met'
            : 'notMet',
      asked: value,
      quote,
      documentKind,
    });
  }

  // Who may apply and with what art cannot be fixed by the portfolio; a missing document can.
  const isOutOfReach = requirements.some(
    (requirement) => requirement.kind !== 'document' && requirement.status === 'notMet',
  );
  const hasGap = requirements.some((requirement) => requirement.status === 'notMet');
  return {
    classification: isOutOfReach ? 'notEligible' : hasGap ? 'almostEligible' : 'eligible',
    requirements,
    analyzedAt: now,
  };
}
