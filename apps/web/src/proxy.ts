import { DEFAULT_LOCALE, LocaleEnum } from '@bratura/shared/primitives/external/locale/enum';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * The default locale has no prefix: `/` is served by `app/[lang]` as `/pt-BR`, by rewrite, so the
 * public URL (and every link already shared) stays the same. Prefixed paths pass through.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1] ?? '';
  if (LocaleEnum.safeParse(firstSegment).success) return;
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Not Next internals, files with an extension (robots.txt, sitemap.xml, the manifest) or the
  // locale-free icon routes (icon, apple-icon), which all live at the root of app/.
  matcher: ['/((?!_next|icon|apple-icon|.*\\..*).*)'],
};
