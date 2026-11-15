import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Heading } from '@bratura/ui';
import { PageShell } from '@/features/common/components/layout/PageShell';
import { ROUTES } from '@/features/common/config/routes';
import { SIGN_UP_FORM_CONTENT } from './sections/sign-up-form/content';
import { SignUpForm } from './sections/sign-up-form/SignUpForm';

export function SignUpPage({ locale }: { locale: Locale }) {
  const content = SIGN_UP_FORM_CONTENT[locale];
  return (
    <PageShell locale={locale} path={ROUTES.signUp}>
      <Container className="grid max-w-3xl gap-8 pb-20">
        <div className="grid gap-3">
          <Heading as="h1">{content.title}</Heading>
          <p className="max-w-[54ch] text-lg text-muted-foreground">{content.lead}</p>
          <p className="text-small text-muted-foreground">{content.demoNotice}</p>
        </div>
        <SignUpForm locale={locale} />
      </Container>
    </PageShell>
  );
}
