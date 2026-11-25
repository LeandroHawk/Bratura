import {
  DEFAULT_LOCALE,
  LocaleEnum,
  type Locale,
} from '@bratura/shared/primitives/external/locale/enum';

/** The `[lang]` segment where the layout already validated it (a 404 would have stopped there). */
export function localeFromValidatedSegment(segment: string | undefined): Locale {
  return LocaleEnum.catch(DEFAULT_LOCALE).parse(segment);
}
