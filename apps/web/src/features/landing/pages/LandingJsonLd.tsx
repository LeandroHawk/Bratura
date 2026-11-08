import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { SLOGAN } from '@bratura/ui';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { SITE_DESCRIPTION, SITE_URL, TEAM } from '@/features/common/config/site';

/** Tells search engines what this is: a free web app, in the page's language, by this team. */
function webApplicationFromLocale(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Bratura',
    alternateName: SLOGAN,
    url: `${SITE_URL}${localizedPathFromLocale(locale, '/')}`,
    description: SITE_DESCRIPTION[locale],
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    creator: TEAM.map((name) => ({ '@type': 'Person', name })),
  };
}

export function WebApplicationJsonLd({ locale }: { locale: Locale }) {
  return (
    <script
      type="application/ld+json"
      // Escaping "<" keeps the JSON from closing the script tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(webApplicationFromLocale(locale)).replace(/</g, '\\u003c'),
      }}
    />
  );
}
