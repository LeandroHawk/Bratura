import type { Metadata } from 'next';
import { SignInPage } from '@/features/account/pages/SignIn.page';
import { SIGN_IN_FORM_CONTENT } from '@/features/account/pages/sections/sign-in-form/content';
import { ROUTES } from '@/features/common/config/routes';
import { pageMetadataFromLocale } from '@/features/common/config/site-metadata';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

export async function generateMetadata({ params }: PageProps<'/[lang]/entrar'>): Promise<Metadata> {
  const locale = await localeFromParams(params);
  return pageMetadataFromLocale(locale, {
    path: ROUTES.signIn,
    title: SIGN_IN_FORM_CONTENT[locale].title,
  });
}

export default async function Page({ params }: PageProps<'/[lang]/entrar'>) {
  return <SignInPage locale={await localeFromParams(params)} />;
}
