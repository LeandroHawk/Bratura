import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { PageShell } from '@/features/common/components/layout/PageShell';
import { WebApplicationJsonLd } from './LandingJsonLd';
import { FuturePlans } from './sections/future-plans/FuturePlans';
import { Hero } from './sections/hero/Hero';
import { HowItWorks } from './sections/how-it-works/HowItWorks';
import { WhyItMatters } from './sections/why-it-matters/WhyItMatters';

export function LandingPage({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} path="/">
      <WebApplicationJsonLd locale={locale} />
      <Hero locale={locale} />
      <HowItWorks locale={locale} />
      <WhyItMatters locale={locale} />
      <FuturePlans locale={locale} />
    </PageShell>
  );
}
