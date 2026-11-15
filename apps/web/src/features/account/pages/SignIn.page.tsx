import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Heading } from '@bratura/ui';
import { PageShell } from '@/features/common/components/layout/PageShell';
import { ROUTES } from '@/features/common/config/routes';
import { SIGN_IN_FORM_CONTENT } from './sections/sign-in-form/content';
import { SignInForm } from './sections/sign-in-form/SignInForm';

export function SignInPage({ locale }: { locale: Locale }) {
  const content = SIGN_IN_FORM_CONTENT[locale];
  return (
    <PageShell locale={locale} path={ROUTES.signIn}>
      <Container className="grid max-w-4xl gap-8 pb-20">
        <div className="grid gap-3">
          <Heading as="h1">{content.title}</Heading>
          <p className="max-w-[54ch] text-lg text-muted-foreground">{content.lead}</p>
          <p className="text-small text-muted-foreground">{content.demoNotice}</p>
        </div>
        <SignInForm locale={locale} />
      </Container>
    </PageShell>
  );
}
