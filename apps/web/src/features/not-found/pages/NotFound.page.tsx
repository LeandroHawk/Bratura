import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ButtonLink, Container } from '@bratura/ui';
import { PageIntro } from '@/features/common/components/PageIntro';
import { PageShell } from '@/features/common/components/layout/PageShell';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { NOT_FOUND_CONTENT } from './content';

export function NotFoundPage({ locale }: { locale: Locale }) {
  const content = NOT_FOUND_CONTENT[locale];
  return (
    // No `path`: not-found cannot know it, so the language sign reads it from the address bar.
    <PageShell locale={locale}>
      {/* Both 404s (nested and global) ignore the metadata title; React hoists this into <head>. */}
      <title>{`${content.title} · Bratura`}</title>
      <Container className="pb-24">
        <PageIntro locale={locale} title={content.title} lead={content.text}>
          <ButtonLink href={localizedPathFromLocale(locale, '/')}>{content.home}</ButtonLink>
        </PageIntro>
      </Container>
    </PageShell>
  );
}
