import { z } from 'zod';
import { requiredEmail } from '../../../../primitives/code/email/fields';
import { requiredString } from '../../../../primitives/code/string/fields';
import { ApplicantTypeEnum } from '../../../../primitives/domain/applicant-type/enum';
import { requiredBrazilianMobilePhone } from '../../../../primitives/external/brazilian-mobile-phone/fields';
import { requiredCep } from '../../../../primitives/external/cep/fields';
import { requiredCpf } from '../../../../primitives/external/cpf/fields';
import { UfEnum } from '../../../../primitives/external/uf/enum';

/**
 * Writes: the creator, through the sign-up form. Comes from: what they type.
 * Who the account belongs to and where they live. The portfolio reads these, so nothing here is
 * asked twice. The password is not a field of the creator: it goes to the sign-in provider.
 */
export const CreatorRegistrationFields = z.object({
  fullName: requiredString(),
  email: requiredEmail,
  nationality: requiredString('short'),
  /** Who the account stands for; matching reads it against a call's `applicantTypes`. */
  applicantType: ApplicantTypeEnum,
  mobilePhone: requiredBrazilianMobilePhone,
  cpf: requiredCpf,
  cep: requiredCep,
  state: UfEnum,
  city: requiredString('short'),
});
