'use client';

import { CulturalActivityKindEnum } from '@bratura/shared/entities/portfolio-item/enums/activity-kind/enum';
import { withOrderedPeriod } from '@bratura/shared/entities/portfolio-item/fragments/period/fields';
import {
  CulturalExperiencePortfolioItemSchema,
  type CulturalExperiencePortfolioItem,
} from '@bratura/shared/entities/portfolio-item/kinds/cultural-experience/variant';
import { parseWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { UfEnum } from '@bratura/shared/primitives/external/uf/enum';
import { UF_NAME } from '@bratura/shared/primitives/external/uf/names';
import { formattedPlainDate } from '@bratura/shared/primitives/code/calendar/format';

import type { FormField } from '@/features/portfolio/pages/sections/common/form-fields';
import { PortfolioItemsSection } from '@/features/portfolio/pages/sections/common/PortfolioItemsSection';
import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { PORTFOLIO_COMMON_CONTENT } from '@/features/portfolio/pages/sections/common/content';
import { EXPERIENCES_CONTENT } from './content';

const ExperienceFormSchema = withOrderedPeriod(CulturalExperiencePortfolioItemSchema);

export function Experiences({
  locale,
  items,
}: {
  locale: Locale;
  items: CulturalExperiencePortfolioItem[];
}) {
  const content = EXPERIENCES_CONTENT[locale];
  const { activityKind } = PORTFOLIO_COMMON_CONTENT[locale];
  const fields = [
    { name: 'title', control: 'text', isRequired: true, isWide: true },
    {
      name: 'activityKind',
      control: 'select',
      isRequired: true,
      options: { values: CulturalActivityKindEnum.options, labels: activityKind },
    },
    { name: 'organizer', control: 'text' },
    { name: 'startDate', control: 'date' },
    { name: 'endDate', control: 'date' },
    { name: 'venue', control: 'text', isWide: true },
    { name: 'city', control: 'text' },
    { name: 'state', control: 'select', options: { values: UfEnum.options, labels: UF_NAME } },
    { name: 'description', control: 'textarea', isWide: true },
    { name: 'links', control: 'links', isWide: true },
    {
      name: 'attachments',
      control: 'files',
      isWide: true,
      fileSchema: CulturalExperiencePortfolioItemSchema.shape.attachments.element,
    },
  ] satisfies FormField<keyof CulturalExperiencePortfolioItem>[];

  return (
    <PortfolioItemsSection
      locale={locale}
      id={PORTFOLIO_SECTION_IDS.experiences}
      kind="culturalExperience"
      copy={content}
      // The most recent first; an experience without a date goes last.
      items={items.toSorted((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))}
      fields={fields}
      parse={(values) => parseWithMessages(ExperienceFormSchema, values, locale)}
      rowFromItem={(item) => ({
        title: item.title,
        meta: [
          activityKind[item.activityKind],
          item.startDate && formattedPlainDate(item.startDate, locale),
          item.city,
        ],
      })}
    />
  );
}
