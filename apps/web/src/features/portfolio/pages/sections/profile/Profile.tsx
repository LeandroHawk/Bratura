'use client';

import { CreatorRegistrationFields } from '@bratura/shared/entities/creator/fragments/registration/fields';

import { CulturalProfileFormSchema } from './profile.schema';

import type {
  Creator,
  CreatorCulturalProfile,
  CreatorRegistration,
} from '@bratura/shared/entities/creator/entity';
import { CulturalAreaEnum } from '@bratura/shared/entities/creator/enums/cultural-area/enum';
import { ApplicantTypeEnum } from '@bratura/shared/primitives/domain/applicant-type/enum';
import { parseWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { UfEnum } from '@bratura/shared/primitives/external/uf/enum';
import { Button, Card, Heading } from '@bratura/ui';
import { useState } from 'react';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { UF_NAME } from '@bratura/shared/primitives/external/uf/names';
import { saveCreatorFields } from '@/features/common/data/demoStore';
import type { FormField } from '@/features/portfolio/pages/sections/common/form-fields';
import { RecordDetails } from '@/features/portfolio/pages/sections/common/RecordDetails';
import { RecordFormDialog } from '@/features/portfolio/pages/sections/common/RecordFormDialog';
import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { PROFILE_CONTENT } from './content';

export function Profile({ locale, creator }: { locale: Locale; creator: Creator }) {
  const content = PROFILE_CONTENT[locale];
  const labels = CREATOR_LABELS[locale];
  const [isEditing, setIsEditing] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(false);
  const titleId = `${PORTFOLIO_SECTION_IDS.profile}-title`;
  const areas = { values: CulturalAreaEnum.options, labels: labels.culturalArea };

  const registrationFields = [
    { name: 'email', control: 'text' },
    {
      name: 'applicantType',
      control: 'select',
      options: { values: ApplicantTypeEnum.options, labels: labels.applicantType },
    },
    { name: 'city', control: 'text' },
    { name: 'state', control: 'select', options: { values: UfEnum.options, labels: UF_NAME } },
  ] satisfies FormField<keyof CreatorRegistration>[];
  const profileFields = [
    { name: 'fullName', control: 'text', isWide: true },
    { name: 'artisticName', control: 'text', isWide: true },
    { name: 'mainCulturalArea', control: 'select', options: areas },
    { name: 'activityStartYear', control: 'year' },
    { name: 'birthDate', control: 'date' },
    { name: 'livesInCurrentPlaceSince', control: 'date' },
    { name: 'isPublicServant', control: 'yesNo' },
    { name: 'secondaryCulturalAreas', control: 'checkboxes', options: areas, isWide: true },
    { name: 'biography', control: 'textarea', isWide: true },
    { name: 'activityDescription', control: 'textarea', isWide: true },
    { name: 'artisticLanguagesAndTechniques', control: 'lines' },
    { name: 'activityCities', control: 'lines' },
    { name: 'externalLinks', control: 'links', isWide: true },
    { name: 'profileImage', control: 'file', isWide: true },
  ] satisfies FormField<keyof CreatorCulturalProfile>[];

  return (
    <section id={PORTFOLIO_SECTION_IDS.profile} aria-labelledby={titleId} className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <Heading id={titleId} size="card">
            {content.title}
          </Heading>
          <p className="max-w-[60ch] text-muted-foreground">{content.lead}</p>
        </div>
        <Button size="sm" className="print:hidden" onClick={() => setIsEditing(true)}>
          {content.edit}
        </Button>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rise-in">
          <RecordDetails
            locale={locale}
            fields={profileFields}
            labels={content.fields}
            values={creator}
          />
        </Card>
        <Card className="rise-in grid gap-4 [--rise-index:2]">
          <div className="grid gap-1">
            <Heading as="h3" size="item">
              {content.registrationTitle}
            </Heading>
            <p className="text-small text-muted-foreground">{content.registrationLead}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditingRegistration(true)}>
            {content.editRegistration}
          </Button>
          <RecordDetails
            locale={locale}
            fields={registrationFields}
            labels={content.registration}
            values={creator}
          />
        </Card>
      </div>
      {editingRegistration && (
        <RecordFormDialog
          locale={locale}
          title={content.registrationTitle}
          fields={registrationFields}
          labels={content.registration}
          initialValues={creator}
          parse={(values) => parseWithMessages(CreatorRegistrationFields, values, locale)}
          onSave={saveCreatorFields}
          onClose={() => setEditingRegistration(false)}
        />
      )}
      {isEditing && (
        <RecordFormDialog
          locale={locale}
          title={content.edit}
          fields={profileFields}
          labels={content.fields}
          initialValues={creator}
          parse={(values) => parseWithMessages(CulturalProfileFormSchema, values, locale)}
          onSave={saveCreatorFields}
          onClose={() => setIsEditing(false)}
        />
      )}
    </section>
  );
}
