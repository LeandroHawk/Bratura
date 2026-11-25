import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Heading, THEMES } from '@bratura/ui';
import { CompactHeader } from '@/features/common/components/layout/CompactHeader';
import { LanguageSwitch } from '@/features/common/components/layout/LanguageSwitch';
import { MAIN_CONTENT_ID } from '@/features/common/components/layout/mainContentId';
import { ROUTES } from '@/features/common/config/routes';
import { STYLEGUIDE_CONTENT } from './content';
import { Brand } from './sections/brand/Brand';
import { Colors } from './sections/colors/Colors';
import { Controls } from './sections/controls/Controls';
import { Forms } from './sections/forms/Forms';
import { Motion } from './sections/motion/Motion';
import { Navigation } from './sections/navigation/Navigation';
import { Surfaces } from './sections/surfaces/Surfaces';
import { Typography } from './sections/typography/Typography';
import { Waiting } from './sections/waiting/Waiting';

/** Living reference for @bratura/ui: every section renders once per theme, side by side. */
export function StyleguidePage({ locale }: { locale: Locale }) {
  const content = STYLEGUIDE_CONTENT[locale];
  return (
    <>
      {/* Outside PageShell: the small logo home and the language sign, as the other headers. */}
      <CompactHeader locale={locale}>
        <div className="absolute top-0 right-4 sm:right-6">
          <LanguageSwitch locale={locale} path={ROUTES.designSystem} size="compact" />
        </div>
      </CompactHeader>
      <Container as="main" id={MAIN_CONTENT_ID} className="grid gap-8 pb-12">
        <div className="grid gap-2">
          <Heading as="h1" size="section" lang="en">
            {content.title}
          </Heading>
          <p className="max-w-[64ch] text-muted-foreground">
            {content.lead.before} <code>@bratura/ui</code>
            {content.lead.after}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {THEMES.map((theme) => (
            <section
              key={theme}
              data-theme={theme}
              aria-labelledby={`theme-${theme}`}
              className="grid content-start gap-8 rounded-3xl border border-border bg-background p-6 text-foreground"
            >
              <Heading id={`theme-${theme}`} size="card">
                {content.themes[theme]}
              </Heading>
              <Brand locale={locale} />
              <Colors locale={locale} />
              <Typography locale={locale} />
              <Controls locale={locale} />
              <Forms locale={locale} theme={theme} />
              <Motion locale={locale} />
              <Waiting locale={locale} />
              <Navigation locale={locale} />
              <Surfaces locale={locale} />
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
