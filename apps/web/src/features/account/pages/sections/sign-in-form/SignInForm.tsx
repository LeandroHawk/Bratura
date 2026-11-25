'use client';

import {
  FICTIONAL_CREATOR,
  FICTIONAL_CREATOR_PORTFOLIO_ITEMS,
} from '@bratura/shared/entities/creator/demo/fictional-creator';
import { SignInMutationFromBraturaPortalArgsSchema } from '@bratura/shared/entities/creator/dto/bratura-portal/sign-in/mutation';
import { parseWithMessages } from '@bratura/shared/messages/messages';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button, Card, Heading, TextField } from '@bratura/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROUTES } from '@/features/common/config/routes';
import { accountReplacedByExample, loadExample, signIn } from '@/features/common/data/demoStore';
import { useContractForm } from '@/features/common/hooks/useContractForm';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { SIGN_IN_FORM_CONTENT } from './content';

export function SignInForm({ locale }: { locale: Locale }) {
  const content = SIGN_IN_FORM_CONTENT[locale];
  const router = useRouter();
  const openPortfolio = () => router.push(localizedPathFromLocale(locale, ROUTES.portfolio));
  // The example takes the place of the account this browser keeps: asked before, never silent.
  const [replacedEmail, setReplacedEmail] = useState<string | null>(null);
  const signInWithExample = () => {
    loadExample({ creator: FICTIONAL_CREATOR, portfolioItems: FICTIONAL_CREATOR_PORTFOLIO_ITEMS });
    openPortfolio();
  };
  const { draft, setField, messageByPath, setMessageByPath, formRef, submit } = useContractForm({
    initialDraft: { email: '' },
    parse: (typed) => parseWithMessages(SignInMutationFromBraturaPortalArgsSchema, typed, locale),
    onValid: ({ email }) => {
      if (signIn(email)) openPortfolio();
      else setMessageByPath({ email: content.noAccountHere });
    },
  });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card as="section" className="rise-in p-6 sm:p-8">
        <form ref={formRef} onSubmit={submit} noValidate className="grid gap-5">
          <TextField
            label={content.email}
            name="email"
            type="email"
            autoComplete="email"
            hint={content.emailHint}
            value={draft.email}
            onChange={(event) => setField('email', event.target.value)}
            error={messageByPath.email}
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button type="submit">{content.submit}</Button>
            <p className="text-small text-muted-foreground">
              {content.noAccount}{' '}
              <Link
                href={localizedPathFromLocale(locale, ROUTES.signUp)}
                className="text-link text-foreground"
              >
                {content.signUp}
              </Link>
            </p>
          </div>
        </form>
      </Card>

      <Card
        as="section"
        className="rise-in grid justify-items-start gap-3 p-6 [--rise-index:2] sm:p-8"
      >
        <Heading as="h2" size="item">
          {content.exampleTitle}
        </Heading>
        <p className="text-small text-muted-foreground">{content.exampleLead}</p>
        {replacedEmail === null ? (
          <Button
            variant="ghost"
            onClick={() => {
              const replaced = accountReplacedByExample(FICTIONAL_CREATOR);
              if (replaced === null) signInWithExample();
              else setReplacedEmail(replaced);
            }}
          >
            {content.useExample}
          </Button>
        ) : (
          <div className="grid justify-items-start gap-3" role="alert">
            <p className="text-small">{content.replacesAccount(replacedEmail)}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={signInWithExample}>
                {content.confirmUseExample}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplacedEmail(null)}>
                {content.cancel}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
