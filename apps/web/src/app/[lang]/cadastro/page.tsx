import type { Metadata } from 'next';
import { SignUpPage } from '@/features/account/pages/SignUp.page';
import { SIGN_UP_FORM_CONTENT } from '@/features/account/pages/sections/sign-up-form/content';
import { ROUTES } from '@/features/common/config/routes';
import { pageMetadataFromLocale } from '@/features/common/config/site-metadata';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/cadastro'>): Promise<Metadata> {
  const locale = await localeFromParams(params);
  return pageMetadataFromLocale(locale, {
    path: ROUTES.signUp,
    title: SIGN_UP_FORM_CONTENT[locale].title,
  });
}

export default async function Page({ params }: PageProps<'/[lang]/cadastro'>) {
  return <SignUpPage locale={await localeFromParams(params)} />;
}
