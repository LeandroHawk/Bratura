import { authkit, applyResponseHeaders, partitionAuthkitHeaders } from '@workos-inc/authkit-nextjs';
import { DEFAULT_LOCALE, LocaleEnum } from '@bratura/shared/primitives/external/locale/enum';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * AuthKit runs on every request first (its session lives in this proxy; the headers carry the
 * signed user to the server components). Then, the default locale has no prefix: `/` is served
 * by `app/[lang]` as `/pt-BR`, by rewrite, so the public URL stays the same.
 */
export async function proxy(request: NextRequest) {
  const { headers } = await authkit(request);
  const { requestHeaders, responseHeaders } = partitionAuthkitHeaders(request, headers);

  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1] ?? '';
  const response = LocaleEnum.safeParse(firstSegment).success
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : (() => {
        const url = request.nextUrl.clone();
        url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
        return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
      })();
  applyResponseHeaders(response, responseHeaders);
  return response;
}

export const config = {
  // Not Next internals, files with an extension (robots.txt, sitemap.xml, the manifest), the
  // locale-free icon routes, or the auth routes at the root (callback, login).
  matcher: ['/((?!_next|icon|apple-icon|callback|login|.*\\..*).*)'],
};
