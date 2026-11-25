import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Logo } from '@bratura/ui';
import { SITE_SLOGAN } from '@/features/common/config/site';

/** The word mark with the slogan in the page's language. */
export function Brand({ locale }: { locale: Locale }) {
  return (
    <div className="grid justify-items-center gap-4 py-4">
      <Logo slogan={{ text: SITE_SLOGAN[locale], lang: locale }} className="text-6xl" />
    </div>
  );
}
