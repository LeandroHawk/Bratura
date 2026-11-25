import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { SLOGAN } from '@bratura/ui';

/**
 * Public origin of the site. Vercel sets the production domain at build time; locally it is
 * localhost.
 */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:6767';

/** The slogan in each locale; the name, Bratura, is the same in all of them. */
export const SITE_SLOGAN: Record<Locale, string> = {
  'pt-BR': SLOGAN,
  en: 'your country with more culture',
};

export const SITE_TITLE = Object.fromEntries(
  Object.entries(SITE_SLOGAN).map(([locale, slogan]) => [locale, `Bratura · ${slogan}`]),
) as Record<Locale, string>;

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

/** The competition, in Portuguese only; `#trilhas` is its home page's list of the seven tracks. */
export const HACK_BRASIL = {
  url: 'https://hackbrasil.com/',
  tracksUrl: 'https://hackbrasil.com/#trilhas',
} as const;

/** The team, as the footer and the structured data name them, each with the profile they gave. */
export const TEAM = [
  { name: 'Atilio Costa', linkedIn: 'https://www.linkedin.com/in/atilio-almeida-costa/' },
  {
    name: 'Leandro Felix',
    linkedIn: 'https://www.linkedin.com/in/leandro-f%C3%A9lix-nunes-6475a1237',
  },
  { name: 'Kaik Maiorquino', linkedIn: 'https://www.linkedin.com/in/kpersike' },
  { name: 'João Souza', linkedIn: 'https://www.linkedin.com/in/joao-crivoi-souza/' },
] as const;

/**
 * The tools behind the product, named in the footer: the sponsors of Hack Brasil 2026 it runs on,
 * the AI agents the team coded with (competition rule 6.4), the rest it runs on.
 */
export const BUILT_WITH = {
  sponsors: [
    { name: 'Firecrawl', url: 'https://www.firecrawl.dev' },
    { name: 'Convex', url: 'https://www.convex.dev' },
    { name: 'AbacatePay', url: 'https://www.abacatepay.com' },
  ],
  agents: [
    { name: 'Claude Code', url: 'https://www.claude.com/product/claude-code' },
    { name: 'Devin', url: 'https://devin.ai' },
  ],
  others: [
    { name: 'Gemini', url: 'https://ai.google.dev' },
    { name: 'Vercel', url: 'https://vercel.com' },
    { name: 'Telegram', url: 'https://telegram.org' },
  ],
} as const;
