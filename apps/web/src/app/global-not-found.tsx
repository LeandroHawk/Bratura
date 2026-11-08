import { DEFAULT_LOCALE } from '@bratura/shared/primitives/external/locale/enum';
import { SiteDocument } from '@/features/common/components/layout/SiteDocument';
import { NotFoundPage } from '@/features/not-found/pages/NotFound.page';

/** A URL no route matches renders outside the `[lang]` layout, so it uses the default locale. */
export default function GlobalNotFound() {
  return (
    <SiteDocument locale={DEFAULT_LOCALE}>
      <NotFoundPage locale={DEFAULT_LOCALE} />
    </SiteDocument>
  );
}
