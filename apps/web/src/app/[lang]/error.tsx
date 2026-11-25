'use client';

import { useParams } from 'next/navigation';
import { localeFromValidatedSegment } from '@/features/common/utils/locale-from-segment';
import { RouteErrorPage } from '@/features/route-error/pages/RouteError.page';

/** Any page under `[lang]` that throws while rendering; the layout already validated the locale. */
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  const locale = localeFromValidatedSegment(useParams<{ lang: string }>().lang);
  return <RouteErrorPage locale={locale} retry={retry} />;
}
