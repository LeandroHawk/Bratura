import {
  DEFAULT_LOCALE,
  LocaleEnum,
  type Locale,
} from '@bratura/shared/primitives/external/locale/enum';
import { lang } from 'next/root-params';
import { notFound } from 'next/navigation';

/** The `[lang]` segment arrives as any string from the URL; anything but a supported locale is a 404. */
export async function localeFromParams(
  params: Promise<{ lang: string }> | { lang: string },
): Promise<Locale> {
  const parsed = LocaleEnum.safeParse((await params).lang);
  if (!parsed.success) notFound();
  return parsed.data;
}

/** For files that get no params (not-found): the root `[lang]` segment, already validated by it. */
export async function localeFromRootParams(): Promise<Locale> {
  return LocaleEnum.catch(DEFAULT_LOCALE).parse(await lang());
}
