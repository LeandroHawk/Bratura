'use client';

import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { ExitSign } from '@bratura/ui';
import type { ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/features/common/config/routes';
import { signOut } from '@/features/common/data/demoStore';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { APP_CONTENT } from './content';

/**
 * The museum's exit sign: erases the demo's browser data and goes back to the home page. The
 * corridor's `compact` sign says only "Saída"; the phone's map keeps the line under it.
 */
export function SignOutButton({
  locale,
  size,
  className,
}: {
  locale: Locale;
  size?: ComponentProps<typeof ExitSign>['size'];
  className?: string;
}) {
  const router = useRouter();
  const content = APP_CONTENT[locale];
  return (
    <ExitSign
      label={content.exit}
      hint={size === 'compact' ? undefined : content.exitHint}
      size={size}
      className={className}
      onClick={() => {
        signOut();
        router.push(localizedPathFromLocale(locale, ROUTES.home));
      }}
    />
  );
}
