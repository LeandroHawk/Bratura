'use client';

import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Button } from '@bratura/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/features/common/config/routes';
import { signOut } from '@/features/common/data/demoStore';
import { localizedPathFromLocale, type SitePath } from '@/features/common/utils/locale-path';
import { APP_CONTENT } from './content';

const PAGES = [
  { path: ROUTES.portfolio, label: 'portfolio' },
  { path: ROUTES.matches, label: 'matches' },
  { path: ROUTES.callNotices, label: 'callNotices' },
] as const;

/** The signed-in area's pages and the way out; the current page is marked for screen readers. */
export function AppNav({ locale, currentPath }: { locale: Locale; currentPath: SitePath }) {
  const content = APP_CONTENT[locale];
  const router = useRouter();
  return (
    <nav
      aria-label={content.nav}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-4 print:hidden"
    >
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {PAGES.map(({ path, label }) => (
          <li key={path}>
            <Link
              href={localizedPathFromLocale(locale, path)}
              aria-current={path === currentPath ? 'page' : undefined}
              className="bt-app-nav-link rounded-sm py-1 font-body font-semibold text-muted-foreground focus-ring hover:text-foreground aria-[current=page]:text-foreground"
            >
              {content[label]}
            </Link>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          signOut();
          router.push(localizedPathFromLocale(locale, ROUTES.home));
        }}
      >
        {content.signOut}
      </Button>
    </nav>
  );
}
