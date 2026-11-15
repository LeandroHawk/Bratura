'use client';

import type { PortfolioItem } from '@bratura/shared/entities/portfolio-item/entity';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { SignedInArea } from '@/features/common/components/app/SignedInArea';
import { ROUTES } from '@/features/common/config/routes';
import { Documents } from './sections/documents/Documents';
import { Experiences } from './sections/experiences/Experiences';
import { Profile } from './sections/profile/Profile';
import { Projects } from './sections/projects/Projects';
import { SmartPortfolio } from './sections/smart-portfolio/SmartPortfolio';
import { Summary } from './sections/summary/Summary';

function itemsOfKind<Kind extends PortfolioItem['kind']>(items: PortfolioItem[], kind: Kind) {
  return items.filter((item): item is Extract<PortfolioItem, { kind: Kind }> => item.kind === kind);
}

/** The portfolio's sections, in page order, drawn with the signed-in creator's data. */
export function PortfolioScreen({ locale }: { locale: Locale }) {
  return (
    <SignedInArea locale={locale} currentPath={ROUTES.portfolio}>
      {(state) => {
        const experiences = itemsOfKind(state.portfolioItems, 'culturalExperience');
        return (
          <div className="grid gap-14">
            <Summary locale={locale} state={state} />
            <Profile locale={locale} creator={state.creator} />
            <Experiences locale={locale} items={experiences} />
            <Projects
              locale={locale}
              items={itemsOfKind(state.portfolioItems, 'culturalProject')}
            />
            <Documents locale={locale} items={itemsOfKind(state.portfolioItems, 'document')} />
            <SmartPortfolio locale={locale} creator={state.creator} experiences={experiences} />
          </div>
        );
      }}
    </SignedInArea>
  );
}
