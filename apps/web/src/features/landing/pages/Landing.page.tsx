import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { PageShell } from '@/features/common/components/layout/PageShell';
import { WebApplicationJsonLd } from './LandingJsonLd';
import { BusinessModel } from './sections/business-model/BusinessModel';
import { FuturePlans } from './sections/future-plans/FuturePlans';
import { Hero } from './sections/hero/Hero';
import { HOW_IT_WORKS_CONTENT } from './sections/how-it-works/content';
import { HowItWorks } from './sections/how-it-works/HowItWorks';
import { WhyItMatters } from './sections/why-it-matters/WhyItMatters';

export function LandingPage({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} path="/">
      <WebApplicationJsonLd locale={locale} />
      <Hero locale={locale} />
      <HowItWorks locale={locale} />
      <WhyItMatters locale={locale} />
      <BusinessModel locale={locale} />
      {/* The floor plan draws the rooms of "how it works": one count, read from its copy. */}
      <FuturePlans locale={locale} roomCount={HOW_IT_WORKS_CONTENT[locale].rooms.length} />
    </PageShell>
  );
}
