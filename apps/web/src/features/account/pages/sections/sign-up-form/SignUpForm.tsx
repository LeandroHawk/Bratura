'use client';

import { SignUpMutationFromBraturaPortalArgsSchema } from '@bratura/shared/entities/creator/dto/bratura-portal/sign-up/mutation';
import { CreatorProfileTypeEnum } from '@bratura/shared/entities/creator/enums/profile-type/enum';
import { CreatorRegistrationFields } from '@bratura/shared/entities/creator/fragments/registration/fields';
import { parseWithMessages } from '@bratura/shared/messages/messages';
import { validationMessage } from '@bratura/shared/primitives/code/validation-message/validation-message';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { UfEnum } from '@bratura/shared/primitives/external/uf/enum';
import { Button, Card, Heading, SelectField, TextField } from '@bratura/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/features/common/config/routes';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { UF_NAME } from '@/features/common/content/uf-names';
import { signUp } from '@/features/common/data/demoStore';
import { useContractForm } from '@/features/common/hooks/useContractForm';
import {
  CEP_MASK,
  CPF_MASK,
  digitsFromInput,
  maskedFromDigits,
  MOBILE_PHONE_MASK,
} from '@/features/common/utils/form-text';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { SIGN_UP_FORM_CONTENT } from './content';

const { email, password } = SignUpMutationFromBraturaPortalArgsSchema.shape;

/** The write args plus the two confirmations, which only the form knows. */
const SignUpFormSchema = SignUpMutationFromBraturaPortalArgsSchema.extend({
  emailConfirmation: email,
  passwordConfirmation: password,
})
  .refine((form) => form.email === form.emailConfirmation, {
    path: ['emailConfirmation'],
    ...validationMessage('confirmationDiffers'),
  })
  .refine((form) => form.password === form.passwordConfirmation, {
    path: ['passwordConfirmation'],
    ...validationMessage('confirmationDiffers'),
  });

const EMPTY_DRAFT = {
  fullName: '',
  nationality: '',
  profileType: '',
  mobilePhone: '',
  cpf: '',
  email: '',
  emailConfirmation: '',
  password: '',
  passwordConfirmation: '',
  cep: '',
  state: '',
  city: '',
};

export function SignUpForm({ locale }: { locale: Locale }) {
  const content = SIGN_UP_FORM_CONTENT[locale];
  const labels = CREATOR_LABELS[locale];
  const router = useRouter();
  const { draft, setField, messageByPath, formRef, submit } = useContractForm({
    initialDraft: EMPTY_DRAFT,
    parse: (typed) =>
      parseWithMessages(
        SignUpFormSchema,
        {
          ...typed,
          mobilePhone: digitsFromInput(typed.mobilePhone),
          cpf: digitsFromInput(typed.cpf),
          cep: digitsFromInput(typed.cep),
        },
        locale,
      ),
    onValid: (form) => {
      // Only the creator's fields are kept: the password and the confirmations stop here.
      signUp(CreatorRegistrationFields.parse(form));
      router.push(localizedPathFromLocale(locale, ROUTES.portfolio));
    },
  });

  return (
    <Card as="section" className="rise-in grid gap-8 p-6 sm:p-8">
      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-8">
        <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2">
          <legend className="mb-4">
            <Heading as="h2" size="item">
              {content.whoYouAre}
            </Heading>
          </legend>
          <TextField
            className="sm:col-span-2"
            label={content.fullName}
            name="fullName"
            autoComplete="name"
            value={draft.fullName}
            onChange={(event) => setField('fullName', event.target.value)}
            error={messageByPath.fullName}
          />
          <SelectField
            label={content.profileType}
            name="profileType"
            value={draft.profileType}
            onChange={(event) => setField('profileType', event.target.value)}
            error={messageByPath.profileType}
          >
            <option value="">{labels.chooseOne}</option>
            {CreatorProfileTypeEnum.options.map((profileType) => (
              <option key={profileType} value={profileType}>
                {labels.profileType[profileType]}
              </option>
            ))}
          </SelectField>
          <TextField
            label={content.nationality}
            name="nationality"
            value={draft.nationality}
            onChange={(event) => setField('nationality', event.target.value)}
            error={messageByPath.nationality}
          />
          <TextField
            label={content.cpf}
            name="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={draft.cpf}
            onChange={(event) => setField('cpf', maskedFromDigits(event.target.value, CPF_MASK))}
            error={messageByPath.cpf}
          />
          <TextField
            label={content.mobilePhone}
            name="mobilePhone"
            type="tel"
            autoComplete="tel-national"
            placeholder="(00) 00000-0000"
            hint={content.mobilePhoneHint}
            value={draft.mobilePhone}
            onChange={(event) =>
              setField('mobilePhone', maskedFromDigits(event.target.value, MOBILE_PHONE_MASK))
            }
            error={messageByPath.mobilePhone}
          />
        </fieldset>

        <fieldset className="grid min-w-0 gap-4 sm:grid-cols-2">
          <legend className="mb-4">
            <Heading as="h2" size="item">
              {content.access}
            </Heading>
          </legend>
          <TextField
            label={content.email}
            name="email"
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(event) => setField('email', event.target.value)}
            error={messageByPath.email}
          />
          <TextField
            label={content.emailConfirmation}
            name="emailConfirmation"
            type="email"
            autoComplete="off"
            value={draft.emailConfirmation}
            onChange={(event) => setField('emailConfirmation', event.target.value)}
            error={messageByPath.emailConfirmation}
          />
          <TextField
            label={content.password}
            name="password"
            type="password"
            autoComplete="new-password"
            hint={content.passwordHint}
            value={draft.password}
            onChange={(event) => setField('password', event.target.value)}
            error={messageByPath.password}
          />
          <TextField
            label={content.passwordConfirmation}
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            value={draft.passwordConfirmation}
            onChange={(event) => setField('passwordConfirmation', event.target.value)}
            error={messageByPath.passwordConfirmation}
          />
        </fieldset>

        <fieldset className="grid min-w-0 gap-4 sm:grid-cols-[10rem_1fr_1fr]">
          <legend className="mb-4">
            <Heading as="h2" size="item">
              {content.whereYouLive}
            </Heading>
          </legend>
          <TextField
            label={content.cep}
            name="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={draft.cep}
            onChange={(event) => setField('cep', maskedFromDigits(event.target.value, CEP_MASK))}
            error={messageByPath.cep}
          />
          <SelectField
            label={content.state}
            name="state"
            autoComplete="address-level1"
            value={draft.state}
            onChange={(event) => setField('state', event.target.value)}
            error={messageByPath.state}
          >
            <option value="">{labels.chooseOne}</option>
            {UfEnum.options.map((uf) => (
              <option key={uf} value={uf}>
                {UF_NAME[uf]}
              </option>
            ))}
          </SelectField>
          <TextField
            label={content.city}
            name="city"
            autoComplete="address-level2"
            value={draft.city}
            onChange={(event) => setField('city', event.target.value)}
            error={messageByPath.city}
          />
        </fieldset>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="submit">{content.submit}</Button>
          <p className="text-small text-muted-foreground">
            {content.haveAccount}{' '}
            <Link
              href={localizedPathFromLocale(locale, ROUTES.signIn)}
              className="rounded-sm font-semibold text-foreground underline underline-offset-4 focus-ring"
            >
              {content.signIn}
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
