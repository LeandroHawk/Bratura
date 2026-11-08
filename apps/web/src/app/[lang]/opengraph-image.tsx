import { LocaleEnum } from '@bratura/shared/primitives/external/locale/enum';
import {
  SHARE_CARD_SIZE,
  shareCardAltFromLocale,
  shareCardImageFromLocale,
} from '@/features/common/components/share-art/share-card';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

/**
 * One card per locale, with its `alt`. Next also calls this with no `lang` while it lists the card
 * ids at build time; that call only needs the id.
 */
export function generateImageMetadata({ params }: { params: { lang?: string } }) {
  const card = { id: 'card', size: SHARE_CARD_SIZE, contentType: 'image/png' };
  const locale = LocaleEnum.safeParse(params.lang);
  return [locale.success ? { ...card, alt: shareCardAltFromLocale(locale.data) } : card];
}

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  return shareCardImageFromLocale(await localeFromParams(params));
}
