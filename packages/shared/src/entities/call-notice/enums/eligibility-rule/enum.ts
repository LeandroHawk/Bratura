import { z } from 'zod';

/** A rule on who or what may apply that is not a document; `other` keeps the rest. */
export const EligibilityRuleKindEnum = z.enum([
  'minimumAge',
  'maximumAge',
  'residenceTime',
  'careerStage',
  'minimumExperience',
  'awardRestriction',
  'publicServantExclusion',
  'conflictOfInterest',
  'maxProposalsPerApplicant',
  'workRestriction',
  'themeRestriction',
  'organizationRequirement',
  'counterpart',
  'other',
]);
export type EligibilityRuleKind = z.infer<typeof EligibilityRuleKindEnum>;
