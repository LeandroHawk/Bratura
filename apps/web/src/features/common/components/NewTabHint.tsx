import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const NEW_TAB_HINT: Record<Locale, string> = {
  'pt-BR': ' (abre em nova aba)',
  en: ' (opens in a new tab)',
};

/** Screen-reader-only warning for a link with `target="_blank"`. */
export function NewTabHint({ locale }: { locale: Locale }) {
  return <span className="sr-only">{NEW_TAB_HINT[locale]}</span>;
}
