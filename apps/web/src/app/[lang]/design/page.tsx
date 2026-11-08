import { DEFAULT_LOCALE } from '@bratura/shared/primitives/external/locale/enum';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StyleguidePage } from '@/features/styleguide/pages/Styleguide.page';
import { localeFromParams } from '@/features/common/utils/locale-from-params';

export const metadata: Metadata = {
  title: 'Design system',
  description: 'Tokens e componentes do @bratura/ui nos temas claro (Acervo) e escuro (Galeria).',
  // Team reference, not a page for search results.
  robots: { index: false },
  alternates: { canonical: '/design', languages: {} },
};

/** A team reference, written in Portuguese only: `/en/design` is a 404. */
export default async function Page({ params }: PageProps<'/[lang]/design'>) {
  if ((await localeFromParams(params)) !== DEFAULT_LOCALE) notFound();
  return <StyleguidePage />;
}
