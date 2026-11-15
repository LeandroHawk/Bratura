'use client';

import { CulturalAreaEnum } from '@bratura/shared/entities/creator/enums/cultural-area/enum';
import { CulturalProjectStatusEnum } from '@bratura/shared/entities/portfolio-item/enums/project-status/enum';
import { withOrderedPeriod } from '@bratura/shared/entities/portfolio-item/fragments/period/fields';
import {
  CulturalProjectPortfolioItemSchema,
  type CulturalProjectPortfolioItem,
} from '@bratura/shared/entities/portfolio-item/kinds/cultural-project/variant';
import { parseWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, type BadgeTone } from '@bratura/ui';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import type { FormField } from '@/features/portfolio/pages/sections/common/formFields';
import { PortfolioItemsSection } from '@/features/portfolio/pages/sections/common/PortfolioItemsSection';
import { PORTFOLIO_SECTION_IDS } from '@/features/portfolio/pages/sections/common/sectionIds';
import { PROJECTS_CONTENT } from './content';

const ProjectFormSchema = withOrderedPeriod(CulturalProjectPortfolioItemSchema);

const STATUS_TONE: Record<CulturalProjectPortfolioItem['status'], BadgeTone> = {
  planned: 'soon',
  inProgress: 'soon',
  completed: 'open',
};

export function Projects({
  locale,
  items,
}: {
  locale: Locale;
  items: CulturalProjectPortfolioItem[];
}) {
  const content = PROJECTS_CONTENT[locale];
  const { culturalArea } = CREATOR_LABELS[locale];
  const fields: FormField<keyof typeof content.fields>[] = [
    { name: 'name', control: 'text', isRequired: true, isWide: true },
    {
      name: 'culturalArea',
      control: 'select',
      isRequired: true,
      options: { values: CulturalAreaEnum.options, labels: culturalArea },
    },
    {
      name: 'status',
      control: 'select',
      isRequired: true,
      options: { values: CulturalProjectStatusEnum.options, labels: content.status },
    },
    { name: 'startDate', control: 'date' },
    { name: 'endDate', control: 'date' },
    { name: 'venue', control: 'text' },
    { name: 'targetAudience', control: 'text' },
    { name: 'description', control: 'textarea', isWide: true },
    { name: 'objective', control: 'textarea', isWide: true },
    { name: 'results', control: 'textarea', isWide: true },
    { name: 'links', control: 'links', isWide: true },
    { name: 'attachments', control: 'files', isWide: true },
  ];

  return (
    <PortfolioItemsSection
      locale={locale}
      id={PORTFOLIO_SECTION_IDS.projects}
      kind="culturalProject"
      copy={content}
      items={items}
      fields={fields}
      parse={(values) => parseWithMessages(ProjectFormSchema, values, locale)}
      rowFromItem={(item) => ({
        title: item.name,
        meta: [culturalArea[item.culturalArea], item.venue],
        badge: <Badge tone={STATUS_TONE[item.status]}>{content.status[item.status]}</Badge>,
      })}
    />
  );
}
