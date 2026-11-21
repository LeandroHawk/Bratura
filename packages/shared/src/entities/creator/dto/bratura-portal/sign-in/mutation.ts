import { z } from 'zod';
import { SignUpMutationFromBraturaPortalArgsSchema } from '../sign-up/mutation';

/** What the sign-in sends: the two fields of the sign-up that prove who is coming back. */
export const SignInMutationFromBraturaPortalArgsSchema =
  SignUpMutationFromBraturaPortalArgsSchema.pick({ email: true, password: true });

export type SignInMutationFromBraturaPortalArgs = z.infer<
  typeof SignInMutationFromBraturaPortalArgsSchema
>;
