import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { themeInitScript } from '@bratura/ui';
import { Fraunces, Instrument_Sans, Titan_One } from 'next/font/google';
import type { ReactNode } from 'react';
import '../../styles/globals.css';
import { InlineScript } from '../InlineScript';

const logoFace = Titan_One({ weight: '400', subsets: ['latin'], variable: '--bt-face-logo' });
const displayFace = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--bt-face-display',
});
const bodyFace = Instrument_Sans({ subsets: ['latin'], variable: '--bt-face-body' });

/**
 * `<html>` and `<body>` of every page: fonts, global styles and the theme script. Shared by the
 * `[lang]` root layout and `global-not-found`, which renders outside any layout.
 */
export function SiteDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html
      lang={locale}
      // The inline script may set data-theme before React hydrates.
      suppressHydrationWarning
      className={`${logoFace.variable} ${displayFace.variable} ${bodyFace.variable}`}
    >
      {/* App Router document head; the rule only knows files under app/ and the Pages Router. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body className="bg-background font-body text-foreground antialiased">{children}</body>
    </html>
  );
}
