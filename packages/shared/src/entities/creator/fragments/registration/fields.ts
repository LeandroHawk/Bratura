import { z } from 'zod';
import { requiredEmail } from '../../../../primitives/code/email/fields';
import { requiredString } from '../../../../primitives/code/string/fields';
import { ApplicantTypeEnum } from '../../../../primitives/domain/applicant-type/enum';
import { UfEnum } from '../../../../primitives/external/uf/enum';

/**
 * Writes: the creator, through the sign-up form. Comes from: what they type.
 * Only what matching reads, plus the e-mail that names the account: no personal number (CPF,
 * phone, postal code) is asked or kept.
 */
export const CreatorRegistrationFields = z.object({
  email: requiredEmail,
  /** Who the account stands for; matching reads it against a call's `applicantTypes`. */
  applicantType: ApplicantTypeEnum,
  state: UfEnum,
  city: requiredString('short'),
});
