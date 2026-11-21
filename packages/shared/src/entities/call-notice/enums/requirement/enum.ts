import { z } from 'zod';

/**
 * What a call asks an applicant to send or hold, as a closed list: the common denominator of the
 * 247 calls extracted by 2026-11-19. `other` keeps what fits none, with its detail.
 */
export const RequirementKindEnum = z.enum([
  // person
  'identity',
  'proofOfResidence',
  'photo',
  'minorConsent',
  'socialSecurityNumber',
  'bankAccount',
  // trajectory and work
  'portfolioOrActivityProof',
  'curriculum',
  'workSamples',
  'technicalRider',
  'educationProof',
  'priorParticipationProof',
  // project
  'projectProposal',
  'budget',
  'teamList',
  'letterOfConsent',
  'workRights',
  'agreementTerm',
  // group and organization
  'groupRepresentation',
  'cnpjOrMei',
  'organizationRecords',
  'institutionalCapacity',
  'taxAndLaborClearance',
  // declarations and forms
  'registrationForm',
  'affirmativeActionDeclaration',
  'noImpedimentDeclaration',
  'truthfulnessDeclaration',
  'imageRightsAuthorization',
  'federalQuestionnaire',
  'healthDeclaration',
  // prerequisites
  'registryPrerequisite',
  'artisanCredential',
  'incentiveProjectApproval',
  'invitationOrEventProof',
  'other',
]);
export type RequirementKind = z.infer<typeof RequirementKindEnum>;

/** When a call asks for it: to apply, or only from those selected (habilitação, contratação). */
export const RequirementStageEnum = z.enum(['registration', 'afterSelection']);
export type RequirementStage = z.infer<typeof RequirementStageEnum>;
