'use client';

import { PortfolioDocumentKindEnum } from '@bratura/shared/entities/portfolio-item/enums/document-kind/enum';
import {
  DocumentPortfolioItemSchema,
  portfolioDocumentStatus,
  type DocumentPortfolioItem,
  type PortfolioDocumentStatus,
} from '@bratura/shared/entities/portfolio-item/kinds/document/variant';
import { parseWithMessages } from '@bratura/shared/messages/messages';
import { plainDateInSaoPaulo } from '@bratura/shared/primitives/code/calendar/calendar';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Badge, type BadgeTone } from '@bratura/ui';
import { useState } from 'react';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';
import { formattedPlainDate } from '@/features/common/utils/format';
import type { FormField } from '@/features/portfolio/pages/sections/common/formFields';
import { PortfolioItemsSection } from '@/features/portfolio/pages/sections/common/PortfolioItemsSection';
import { PORTFOLIO_SECTION_IDS } from '@/features/common/config/portfolio-section-ids';
import { DOCUMENTS_CONTENT } from './content';

const STATUS_TONE: Record<PortfolioDocumentStatus, BadgeTone> = {
  registered: 'open',
  pending: 'soon',
  expired: 'missing',
};

export function Documents({ locale, items }: { locale: Locale; items: DocumentPortfolioItem[] }) {
  const content = DOCUMENTS_CONTENT[locale];
  const { documentKind } = CREATOR_LABELS[locale];
  // Read once, when the section mounts: a render must give the same answer twice.
  const [today] = useState(() => plainDateInSaoPaulo(Date.now()));
  const fields: FormField<keyof typeof content.fields>[] = [
    {
      name: 'documentKind',
      control: 'select',
      isRequired: true,
      options: { values: PortfolioDocumentKindEnum.options, labels: documentKind },
    },
    { name: 'description', control: 'text', isRequired: true },
    { name: 'registrationNumber', control: 'text', isWide: true },
    { name: 'issuedOn', control: 'date' },
    { name: 'validUntil', control: 'date' },
    { name: 'file', control: 'file', isWide: true },
  ];

  return (
    <PortfolioItemsSection
      locale={locale}
      id={PORTFOLIO_SECTION_IDS.documents}
      kind="document"
      copy={content}
      items={items}
      fields={fields}
      parse={(values) => parseWithMessages(DocumentPortfolioItemSchema, values, locale)}
      rowFromItem={(item) => {
        const status = portfolioDocumentStatus(item, today);
        return {
          title: item.description,
          meta: [
            documentKind[item.documentKind],
            item.validUntil && content.validUntil(formattedPlainDate(item.validUntil, locale)),
          ],
          badge: <Badge tone={STATUS_TONE[status]}>{content.status[status]}</Badge>,
        };
      }}
    />
  );
}
