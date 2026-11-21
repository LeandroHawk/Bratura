'use client';

import { SignUpMutationFromBraturaPortalArgsSchema } from '@bratura/shared/entities/creator/dto/bratura-portal/sign-up/mutation';
import { CulturalAreaEnum } from '@bratura/shared/entities/creator/enums/cultural-area/enum';
import { parseWithMessages } from '@bratura/shared/messages/messages';
import { ApplicantTypeEnum } from '@bratura/shared/primitives/domain/applicant-type/enum';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { UfEnum } from '@bratura/shared/primitives/external/uf/enum';
import { Button, Card, SelectField, TextField } from '@bratura/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/features/common/config/routes';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { UF_NAME } from '@/features/common/content/uf-names';
import { signUp } from '@/features/common/data/demoStore';
import { useContractForm } from '@/features/common/hooks/useContractForm';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { SIGN_UP_FORM_CONTENT } from './content';

const EMPTY_DRAFT = {
  applicantType: '',
  mainCulturalArea: '',
  state: '',
  city: '',
  email: '',
};

/** The demo sign-up: only what matching reads, and the e-mail that names the account. */
export function SignUpForm({ locale }: { locale: Locale }) {
  const content = SIGN_UP_FORM_CONTENT[locale];
  const labels = CREATOR_LABELS[locale];
  const router = useRouter();
  const { draft, setField, messageByPath, formRef, submit } = useContractForm({
    initialDraft: EMPTY_DRAFT,
    parse: (typed) => parseWithMessages(SignUpMutationFromBraturaPortalArgsSchema, typed, locale),
    onValid: (registration) => {
      signUp(registration);
      router.push(localizedPathFromLocale(locale, ROUTES.portfolio));
    },
  });

  return (
    <Card as="section" className="rise-in p-6 sm:p-8">
      <form ref={formRef} onSubmit={submit} noValidate className="grid gap-6">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <SelectField
            label={content.applicantType}
            name="applicantType"
            value={draft.applicantType}
            onChange={(event) => setField('applicantType', event.target.value)}
            error={messageByPath.applicantType}
          >
            <option value="">{labels.chooseOne}</option>
            {ApplicantTypeEnum.options.map((applicantType) => (
              <option key={applicantType} value={applicantType}>
                {labels.applicantType[applicantType]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label={content.mainCulturalArea}
            name="mainCulturalArea"
            value={draft.mainCulturalArea}
            onChange={(event) => setField('mainCulturalArea', event.target.value)}
            error={messageByPath.mainCulturalArea}
          >
            <option value="">{labels.chooseOne}</option>
            {CulturalAreaEnum.options.map((area) => (
              <option key={area} value={area}>
                {labels.culturalArea[area]}
              </option>
            ))}
          </SelectField>
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
          <TextField
            label={content.email}
            hint={content.emailHint}
            name="email"
            type="email"
            autoComplete="email"
            className="sm:col-span-2"
            value={draft.email}
            onChange={(event) => setField('email', event.target.value)}
            error={messageByPath.email}
          />
        </div>

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
