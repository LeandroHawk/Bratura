import { NotFoundPage } from '@/features/not-found/pages/NotFound.page';
import { localeFromRootParams } from '@/features/common/utils/locale-from-params';

export default async function NotFound() {
  return <NotFoundPage locale={await localeFromRootParams()} />;
}
