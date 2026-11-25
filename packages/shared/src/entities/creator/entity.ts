import { z } from 'zod';
import { CreatorCulturalProfileFields } from './fragments/cultural-profile/fields';
import { CreatorRegistrationFields } from './fragments/registration/fields';

/**
 * A person or group that looks for call notices: one row per account. Both fragments are written
 * by the creator, at two moments (sign-up, then the portfolio), so each form sends one of them.
 */
export const CreatorSchema = z.object({
  ...CreatorRegistrationFields.shape,
  ...CreatorCulturalProfileFields.shape,
});

export type Creator = z.infer<typeof CreatorSchema>;
export type CreatorRegistration = z.infer<typeof CreatorRegistrationFields>;
export type CreatorCulturalProfile = z.infer<typeof CreatorCulturalProfileFields>;

/** The cultural profile right after sign-up: nothing typed yet. */
export const emptyCulturalProfile: CreatorCulturalProfile = {
  profileImage: null,
  fullName: null,
  artisticName: null,
  biography: null,
  mainCulturalArea: null,
  secondaryCulturalAreas: [],
  artisticLanguagesAndTechniques: [],
  activityStartYear: null,
  activityDescription: null,
  birthDate: null,
  livesInCurrentPlaceSince: null,
  isPublicServant: null,
  activityCities: [],
  externalLinks: [],
};
