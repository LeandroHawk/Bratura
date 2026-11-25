import { z } from 'zod';
import { CreatorRegistrationFields } from '../../../fragments/registration/fields';

/** What the demo sign-in sends: the e-mail that names the account the browser keeps. */
export const SignInMutationFromBraturaPortalArgsSchema = CreatorRegistrationFields.pick({
  email: true,
});

export type SignInMutationFromBraturaPortalArgs = z.infer<
  typeof SignInMutationFromBraturaPortalArgsSchema
>;
