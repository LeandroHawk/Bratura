import { z } from 'zod';

/** The languages Bratura is written in, as BCP 47 tags: the same string goes in `lang`, `hreflang` and `Intl`. */
export const LocaleEnum = z.enum(['pt-BR', 'en']);

export type Locale = z.infer<typeof LocaleEnum>;

/** The product's language when nothing chose another: the creator's profile, a URL, a header. */
export const DEFAULT_LOCALE: Locale = 'pt-BR';
