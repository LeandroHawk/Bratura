import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { SLOGAN } from '@bratura/ui';

/** Public origin of the site. Vercel sets the production domain at build time; locally it is localhost. */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const REPO_URL = 'https://github.com/LeandroHawk/Bratura';

/** The brand name and slogan stay in Portuguese in every locale. */
export const SITE_TITLE = `Bratura · ${SLOGAN}`;

export const SITE_DESCRIPTION: Record<Locale, string> = {
  'pt-BR':
    'Copiloto de editais para artesãos, músicos e artistas: monte seu portfólio uma vez, encontre editais, festivais e feiras, veja o que falta e prepare a inscrição.',
  en: 'A copilot for public arts funding calls, for Brazilian artisans, musicians and artists: build your portfolio once, find open calls, festivals and fairs, see what is missing and get the application ready.',
};

/** The promise in one line: the landing's headline and the link preview card's headline. */
export const TAGLINE: Record<Locale, string> = {
  'pt-BR': 'Monte seu acervo uma vez. A gente encontra os editais.',
  en: 'Build your portfolio once. We find the funding calls.',
};

export const TEAM = ['Atilio Almeida', 'Leandro', 'Kaik', 'João Victor'] as const;
