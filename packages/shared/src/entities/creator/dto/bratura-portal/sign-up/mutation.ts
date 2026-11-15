import { z } from 'zod';
import { CreatorRegistrationFields } from '../../../fragments/registration/fields';

/** Long enough to resist guessing; capped so hashing it never becomes the expensive step. */
export const requiredPassword = z.string().min(8).max(128);

/**
 * What the sign-up sends: the creator's registration and the password, which the sign-in provider
 * keeps and no table stores.
 */
export const SignUpMutationFromBraturaPortalArgsSchema = CreatorRegistrationFields.extend({
  password: requiredPassword,
});

export type SignUpMutationFromBraturaPortalArgs = z.infer<
  typeof SignUpMutationFromBraturaPortalArgsSchema
>;
