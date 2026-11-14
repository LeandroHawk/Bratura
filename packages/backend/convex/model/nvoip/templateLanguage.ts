import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { z } from 'zod';

/** The language codes Meta approves a WhatsApp template under, as Nvoip takes them. */
export const NvoipTemplateLanguageEnum = z.enum(['pt_BR', 'en_US']);
export type NvoipTemplateLanguage = z.infer<typeof NvoipTemplateLanguageEnum>;

const languageByLocale = {
  'pt-BR': 'pt_BR',
  en: 'en_US',
} satisfies Record<Locale, NvoipTemplateLanguage>;

/** The creator's locale as the template's approved language (`docs/integrations/whatsapp.md`). */
export function templateLanguageFromLocale(locale: Locale): NvoipTemplateLanguage {
  return languageByLocale[locale];
}
