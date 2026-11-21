import { z } from 'zod';
import { CreatorCulturalProfileFields } from '../../../fragments/cultural-profile/fields';
import { CreatorRegistrationFields } from '../../../fragments/registration/fields';

/**
 * What the sign-up sends: the creator's registration and their main art form, which the profile
 * keeps and matching reads. No password: until the sign-in provider exists (after 30/11) the
 * account is a demo kept in the browser.
 */
export const SignUpMutationFromBraturaPortalArgsSchema = CreatorRegistrationFields.extend({
  mainCulturalArea: CreatorCulturalProfileFields.shape.mainCulturalArea.unwrap(),
});

export type SignUpMutationFromBraturaPortalArgs = z.infer<
  typeof SignUpMutationFromBraturaPortalArgsSchema
>;
