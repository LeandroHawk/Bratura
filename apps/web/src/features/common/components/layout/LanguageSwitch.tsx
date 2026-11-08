'use client';

import {
  DEFAULT_LOCALE,
  LocaleEnum,
  type Locale,
} from '@bratura/shared/primitives/external/locale/enum';
import { HangingSign } from '@bratura/ui';
import { useSyncExternalStore } from 'react';
import {
  localizedPathFromLocale,
  sitePathFromPathname,
  type SitePath,
} from '../../utils/locale-path';
import { LAYOUT_CONTENT } from './content';

/** Each language named in itself, so a reader finds theirs whatever the page language is. */
const SIGN_FACE: Record<Locale, { label: string; hint: string }> = {
  'pt-BR': { label: 'Português', hint: 'ler em português' },
  en: { label: 'English', hint: 'read in English' },
};

const ignoreChanges = () => () => {};

/**
 * The address bar's path, read after hydration. The server cannot know it on a 404 (not-found
 * gets no params), and the proxy rewrite makes `usePathname` disagree with the browser URL.
 */
function useBrowserSitePath(): SitePath | null {
  return useSyncExternalStore(
    ignoreChanges,
    () => sitePathFromPathname(window.location.pathname),
    () => null,
  );
}

/**
 * The market-stall sign next to the light cord: names the other language and links to this page
 * in it. Turning over shows the current language, which is what the next page's sign will say.
 * Two locales only: with a third, this needs one sign per language. Without `path` (a 404) the
 * link starts at the home page and switches to the current address once the browser runs.
 */
export function LanguageSwitch({ locale, path }: { locale: Locale; path?: SitePath }) {
  const browserPath = useBrowserSitePath();
  const other = LocaleEnum.options.find((candidate) => candidate !== locale) ?? DEFAULT_LOCALE;
  return (
    <nav aria-label={LAYOUT_CONTENT[locale].languageNav}>
      <HangingSign
        href={localizedPathFromLocale(other, path ?? browserPath ?? '/')}
        hrefLang={other}
        front={{ ...SIGN_FACE[other], lang: other }}
        back={{ ...SIGN_FACE[locale], lang: locale }}
      />
    </nav>
  );
}
